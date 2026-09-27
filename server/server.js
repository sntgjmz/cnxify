const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const pool = require('./db');

const app = express();
const server = http.createServer(app);
const PORT = Number(process.env.PORT) || 5000;
const jwtSecret = process.env.JWT_SECRET;
const origins = (process.env.CLIENT_ORIGINS || 'http://localhost:5173').split(',').map((value) => value.trim()).filter(Boolean);
const adminEmails = new Set((process.env.ADMIN_EMAILS || '').split(',').map((value) => value.trim().toLowerCase()).filter(Boolean));
if (!jwtSecret || jwtSecret === 'replace-with-a-long-random-secret') throw new Error('JWT_SECRET must be configured with a strong unique value.');

const corsOptions = {
    origin(origin, callback) {
        if (!origin || origins.includes(origin)) return callback(null, true);
        return callback(new Error('Origin is not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
};
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));
app.use(cors(corsOptions));
const io = new Server(server, { cors: corsOptions });

const uploadDir = path.join(__dirname, 'uploads');
const audioDir = path.join(uploadDir, 'audio');
const coversDir = path.join(uploadDir, 'covers');
for (const directory of [uploadDir, audioDir, coversDir]) fs.mkdirSync(directory, { recursive: true });
app.use('/uploads', express.static(uploadDir, { fallthrough: false, maxAge: '1d' }));
const upload = multer({
    storage: multer.diskStorage({
        destination: (_req, file, callback) => callback(null, file.fieldname === 'audio' ? audioDir : coversDir),
        filename: (_req, file, callback) => callback(null, `${Date.now()}-${path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_')}`),
    }),
    limits: { fileSize: 25 * 1024 * 1024, files: 2 },
    fileFilter: (_req, file, callback) => {
        const types = file.fieldname === 'audio' ? ['audio/mpeg', 'audio/mp3'] : ['image/jpeg', 'image/png', 'image/webp'];
        callback(types.includes(file.mimetype) ? null : new Error(`Unsupported ${file.fieldname} file type`), types.includes(file.mimetype));
    },
});

const authPayload = (token) => jwt.verify(token, jwtSecret);
function authenticateToken(req, res, next) {
    const [scheme, token] = (req.headers.authorization || '').split(' ');
    if (scheme !== 'Bearer' || !token) return res.status(401).json({ error: 'Access token required.' });
    try { req.user = authPayload(token); return next(); } catch { return res.status(403).json({ error: 'Invalid or expired token.' }); }
}
function requireAdmin(req, res, next) { return req.user.role === 'ADMIN' ? next() : res.status(403).json({ error: 'Admin access required.' }); }
const isOneOf = (value, options) => typeof value === 'string' && options.includes(value);

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.post('/api/auth/register', async (req, res) => {
    try {
        const email = String(req.body.email || '').trim().toLowerCase();
        const username = String(req.body.username || '').trim();
        const password = String(req.body.password || '');
        if (!email.endsWith('@concentrix.com')) return res.status(400).json({ error: 'Registration is restricted to @concentrix.com emails.' });
        if (!username || username.length > 50) return res.status(400).json({ error: 'Username must be between 1 and 50 characters.' });
        if (password.length < 12) return res.status(400).json({ error: 'Password must be at least 12 characters.' });
        const role = adminEmails.has(email) ? 'ADMIN' : 'USER';
        const status = role === 'ADMIN' ? 'APPROVED' : 'PENDING';
        const result = await pool.query('INSERT INTO users (email, username, password_hash, role, status) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, username, role, status', [email, username, await bcrypt.hash(password, 12), role, status]);
        return res.status(201).json({ message: status === 'APPROVED' ? 'Registration successful. You can now log in.' : 'Registration submitted for administrator approval.', user: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') return res.status(409).json({ error: 'Email already registered.' });
        console.error('Registration error:', error); return res.status(500).json({ error: 'Server error during registration.' });
    }
});
app.post('/api/auth/login', async (req, res) => {
    try {
        const email = String(req.body.email || '').trim().toLowerCase();
        const user = (await pool.query('SELECT id, email, username, password_hash, role, status FROM users WHERE email = $1', [email])).rows[0];
        if (!user || !(await bcrypt.compare(String(req.body.password || ''), user.password_hash))) return res.status(400).json({ error: 'Invalid email or password.' });
        if (user.status !== 'APPROVED') return res.status(403).json({ error: 'Your account is awaiting administrator approval.' });
        return res.json({ token: jwt.sign({ id: user.id, email: user.email, username: user.username, role: user.role }, jwtSecret, { expiresIn: '7d' }), role: user.role });
    } catch (error) { console.error('Login error:', error); return res.status(500).json({ error: 'Server error during login.' }); }
});
app.post('/api/songs', authenticateToken, requireAdmin, (req, res, next) => upload.fields([{ name: 'audio', maxCount: 1 }, { name: 'cover', maxCount: 1 }])(req, res, (error) => error ? res.status(400).json({ error: error.message }) : next()), async (req, res) => {
    try {
        const title = String(req.body.title || '').trim(); const artist = String(req.body.artist || '').trim(); const album = String(req.body.album || 'Unknown Album').trim();
        if (!title || !artist || !req.files?.audio?.[0]) return res.status(400).json({ error: 'Title, artist, and an MP3 audio file are required.' });
        const coverPath = req.files.cover?.[0] ? `/uploads/covers/${req.files.cover[0].filename}` : (typeof req.body.cover_path === 'string' && req.body.cover_path.startsWith('/uploads/covers/') ? req.body.cover_path : null);
        const result = await pool.query('INSERT INTO songs (title, artist, album, file_path, cover_path, uploaded_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [title, artist, album || 'Unknown Album', `/uploads/audio/${req.files.audio[0].filename}`, coverPath, req.user.id]);
        return res.status(201).json(result.rows[0]);
    } catch (error) { console.error('Song upload error:', error); return res.status(500).json({ error: 'Failed to upload song.' }); }
});
app.get('/api/songs', authenticateToken, async (_req, res) => { try { return res.json((await pool.query('SELECT * FROM songs ORDER BY created_at DESC')).rows); } catch { return res.status(500).json({ error: 'Unable to load songs.' }); } });
app.get('/api/search', authenticateToken, async (req, res) => {
    const query = String(req.query.q || '').trim();
    if (!query) return res.json({ songs: [], playlists: [], profiles: [] });
    const pattern = `%${query}%`;
    try {
        const [songs, playlists, profiles] = await Promise.all([
            pool.query('SELECT id, title, artist, album, file_path, cover_path FROM songs WHERE title ILIKE $1 OR artist ILIKE $1 OR album ILIKE $1 ORDER BY created_at DESC LIMIT 20', [pattern]),
            pool.query('SELECT id, title, description, user_id, is_public FROM playlists WHERE is_public = true AND (title ILIKE $1 OR description ILIKE $1) ORDER BY created_at DESC LIMIT 20', [pattern]),
            pool.query('SELECT id, username, avatar_path FROM users WHERE status = \'APPROVED\' AND username ILIKE $1 ORDER BY username LIMIT 20', [pattern]),
        ]);
        return res.json({ songs: songs.rows, playlists: playlists.rows, profiles: profiles.rows });
    } catch { return res.status(500).json({ error: 'Unable to search CNXify.' }); }
});
app.post('/api/playlists', authenticateToken, async (req, res) => {
    const title = String(req.body.title || '').trim(); if (!title || title.length > 100) return res.status(400).json({ error: 'Playlist title must be between 1 and 100 characters.' });
    const description = String(req.body.description || '').trim();
    try { return res.status(201).json((await pool.query('INSERT INTO playlists (title, description, user_id, is_public) VALUES ($1, $2, $3, $4) RETURNING *', [title, description || null, req.user.id, Boolean(req.body.is_public)])).rows[0]); } catch { return res.status(500).json({ error: 'Unable to create playlist.' }); }
});
app.put('/api/playlists/:playlistId', authenticateToken, (req, res, next) => upload.single('cover')(req, res, (error) => error ? res.status(400).json({ error: error.message }) : next()), async (req, res) => {
    const title = String(req.body.title || '').trim(); const description = String(req.body.description || '').trim();
    if (!title || title.length > 100 || description.length > 500) return res.status(400).json({ error: 'Provide a playlist name and a description up to 500 characters.' });
    try { const coverPath = req.file ? `/uploads/covers/${req.file.filename}` : null; const result = await pool.query('UPDATE playlists SET title = $1, description = $2, is_public = $3, cover_path = COALESCE($4, cover_path) WHERE id = $5 AND user_id = $6 RETURNING *', [title, description || null, req.body.is_public === 'true' || req.body.is_public === true, coverPath, req.params.playlistId, req.user.id]); return result.rows[0] ? res.json(result.rows[0]) : res.status(404).json({ error: 'Playlist not found.' }); } catch { return res.status(500).json({ error: 'Unable to update playlist.' }); }
});
app.delete('/api/playlists/:playlistId', authenticateToken, async (req, res) => {
    try { const result = await pool.query('DELETE FROM playlists WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.playlistId, req.user.id]); return result.rows[0] ? res.json({ deleted: true }) : res.status(404).json({ error: 'Playlist not found.' }); } catch { return res.status(500).json({ error: 'Unable to delete playlist.' }); }
});
app.get('/api/me/profile', authenticateToken, async (req, res) => {
    try { const result = await pool.query('SELECT id, username, email, avatar_path, show_listening_activity, created_at FROM users WHERE id = $1', [req.user.id]); return res.json(result.rows[0]); } catch { return res.status(500).json({ error: 'Unable to load profile.' }); }
});
app.put('/api/me/profile', authenticateToken, (req, res, next) => upload.single('avatar')(req, res, (error) => error ? res.status(400).json({ error: error.message }) : next()), async (req, res) => {
    const username = String(req.body.username || '').trim(); if (!username || username.length > 50) return res.status(400).json({ error: 'Username must be between 1 and 50 characters.' });
    try { const avatarPath = req.file ? `/uploads/covers/${req.file.filename}` : null; const result = await pool.query('UPDATE users SET username = $1, show_listening_activity = $2, avatar_path = COALESCE($3, avatar_path) WHERE id = $4 RETURNING id, username, email, avatar_path, show_listening_activity, created_at', [username, req.body.show_listening_activity === 'true' || req.body.show_listening_activity === true, avatarPath, req.user.id]); return res.json(result.rows[0]); } catch { return res.status(500).json({ error: 'Unable to update profile.' }); }
});
app.get('/api/users/:userId/profile', authenticateToken, async (req, res) => {
    try { const user = (await pool.query(`SELECT users.id, users.username, users.avatar_path, users.show_listening_activity, users.created_at, (SELECT COUNT(*)::int FROM follows WHERE following_id = users.id) AS follower_count, EXISTS(SELECT 1 FROM follows WHERE follower_id = $2 AND following_id = users.id) AS is_following FROM users WHERE users.id = $1`, [req.params.userId, req.user.id])).rows[0]; if (!user) return res.status(404).json({ error: 'User not found.' }); const playlists = (await pool.query('SELECT * FROM playlists WHERE user_id = $1 AND (is_public = true OR user_id = $2) ORDER BY created_at DESC', [req.params.userId, req.user.id])).rows; return res.json({ ...user, playlists }); } catch { return res.status(500).json({ error: 'Unable to load profile.' }); }
});
app.post('/api/users/:userId/follow', authenticateToken, async (req, res) => {
    if (String(req.user.id) === String(req.params.userId)) return res.status(400).json({ error: 'You cannot follow yourself.' });
    try { await pool.query('INSERT INTO follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.user.id, req.params.userId]); return res.status(201).json({ following: true }); } catch { return res.status(500).json({ error: 'Unable to follow colleague.' }); }
});
app.delete('/api/users/:userId/follow', authenticateToken, async (req, res) => {
    try { await pool.query('DELETE FROM follows WHERE follower_id = $1 AND following_id = $2', [req.user.id, req.params.userId]); return res.json({ following: false }); } catch { return res.status(500).json({ error: 'Unable to unfollow colleague.' }); }
});
app.get('/api/artists/:artistName/follow', authenticateToken, async (req, res) => {
    try { const result = await pool.query('SELECT EXISTS(SELECT 1 FROM artist_follows WHERE user_id = $1 AND artist_name = $2) AS following', [req.user.id, req.params.artistName]); return res.json(result.rows[0]); } catch (error) { if (error.code === '42P01') return res.status(503).json({ error: 'Database migration required: create the artist_follows table from schema.sql.' }); return res.status(500).json({ error: 'Unable to load artist follow status.' }); }
});
app.post('/api/artists/:artistName/follow', authenticateToken, async (req, res) => {
    try { await pool.query('INSERT INTO artist_follows (user_id, artist_name) VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.user.id, req.params.artistName]); return res.status(201).json({ following: true }); } catch (error) { if (error.code === '42P01') return res.status(503).json({ error: 'Database migration required: create the artist_follows table from schema.sql.' }); return res.status(500).json({ error: 'Unable to follow artist.' }); }
});
app.delete('/api/artists/:artistName/follow', authenticateToken, async (req, res) => {
    try { await pool.query('DELETE FROM artist_follows WHERE user_id = $1 AND artist_name = $2', [req.user.id, req.params.artistName]); return res.json({ following: false }); } catch (error) { if (error.code === '42P01') return res.status(503).json({ error: 'Database migration required: create the artist_follows table from schema.sql.' }); return res.status(500).json({ error: 'Unable to unfollow artist.' }); }
});
app.get('/api/artists/following', authenticateToken, async (req, res) => {
    try { const result = await pool.query('SELECT artist_follows.artist_name, (SELECT cover_path FROM songs WHERE songs.artist = artist_follows.artist_name AND cover_path IS NOT NULL ORDER BY created_at DESC LIMIT 1) AS cover_path FROM artist_follows WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]); return res.json(result.rows); } catch (error) { if (error.code === '42P01') return res.status(503).json({ error: 'Database migration required: create the artist_follows table from schema.sql.' }); return res.status(500).json({ error: 'Unable to load followed artists.' }); }
});
app.get('/api/liked-songs', authenticateToken, async (req, res) => {
    try { const result = await pool.query('SELECT songs.* FROM songs JOIN liked_songs ON liked_songs.song_id = songs.id WHERE liked_songs.user_id = $1 ORDER BY liked_songs.created_at DESC', [req.user.id]); return res.json(result.rows); } catch (error) { if (error.code === '42P01') return res.status(503).json({ error: 'Database migration required: create the liked_songs table from schema.sql.' }); return res.status(500).json({ error: 'Unable to load liked songs.' }); }
});
app.post('/api/songs/:songId/like', authenticateToken, async (req, res) => {
    try { await pool.query('INSERT INTO liked_songs (user_id, song_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.user.id, req.params.songId]); return res.status(201).json({ liked: true }); } catch (error) { if (error.code === '42P01') return res.status(503).json({ error: 'Database migration required: create the liked_songs table from schema.sql.' }); return res.status(500).json({ error: 'Unable to like song.' }); }
});
app.delete('/api/songs/:songId/like', authenticateToken, async (req, res) => {
    try { await pool.query('DELETE FROM liked_songs WHERE user_id = $1 AND song_id = $2', [req.user.id, req.params.songId]); return res.json({ liked: false }); } catch (error) { if (error.code === '42P01') return res.status(503).json({ error: 'Database migration required: create the liked_songs table from schema.sql.' }); return res.status(500).json({ error: 'Unable to unlike song.' }); }
});
app.get('/api/users/:userId', authenticateToken, async (req, res) => {
    if (String(req.user.id) !== String(req.params.userId) && req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Unauthorized.' });
    try { const user = (await pool.query('SELECT id, username, email, role FROM users WHERE id = $1', [req.params.userId])).rows[0]; if (!user) return res.status(404).json({ error: 'User not found.' }); const playlists = (await pool.query('SELECT * FROM playlists WHERE user_id = $1 ORDER BY created_at DESC', [req.params.userId])).rows; return res.json({ ...user, playlists }); } catch { return res.status(500).json({ error: 'Unable to load user.' }); }
});
app.post('/api/playlists/:playlistId/songs', authenticateToken, async (req, res) => {
    try { const playlist = (await pool.query('SELECT user_id FROM playlists WHERE id = $1', [req.params.playlistId])).rows[0]; if (!playlist) return res.status(404).json({ error: 'Playlist not found.' }); if (String(playlist.user_id) !== String(req.user.id)) return res.status(403).json({ error: 'Unauthorized.' }); await pool.query('INSERT INTO playlist_songs (playlist_id, song_id) VALUES ($1, $2)', [req.params.playlistId, req.body.songId]); return res.status(201).json({ message: 'Song added to playlist.' }); } catch (error) { return res.status(error.code === '23505' ? 409 : 500).json({ error: error.code === '23505' ? 'Song is already in this playlist.' : 'Unable to add song to playlist.' }); }
});
app.get('/api/playlists/:playlistId/songs', authenticateToken, async (req, res) => {
    try { const playlist = (await pool.query('SELECT user_id, is_public FROM playlists WHERE id = $1', [req.params.playlistId])).rows[0]; if (!playlist) return res.status(404).json({ error: 'Playlist not found.' }); if (!playlist.is_public && String(playlist.user_id) !== String(req.user.id)) return res.status(403).json({ error: 'Unauthorized.' }); return res.json((await pool.query('SELECT s.id, s.title, s.artist, s.album, s.file_path, s.cover_path, ps.added_at FROM songs s JOIN playlist_songs ps ON s.id = ps.song_id WHERE ps.playlist_id = $1 ORDER BY ps.added_at DESC', [req.params.playlistId])).rows); } catch { return res.status(500).json({ error: 'Unable to load playlist songs.' }); }
});
app.post('/api/feedback', authenticateToken, async (req, res) => {
    const type = String(req.body.type || ''); const content = String(req.body.content || '').trim(); if (!isOneOf(type, ['SONG_REQUEST', 'FEEDBACK']) || !content || content.length > 1000) return res.status(400).json({ error: 'Provide a valid feedback type and message up to 1000 characters.' });
    try { return res.status(201).json((await pool.query('INSERT INTO feedback (user_id, type, content) VALUES ($1, $2, $3) RETURNING *', [req.user.id, type, content])).rows[0]); } catch { return res.status(500).json({ error: 'Unable to submit feedback.' }); }
});
app.get('/api/admin/users/pending', authenticateToken, requireAdmin, async (_req, res) => { try { return res.json((await pool.query("SELECT id, username, email, created_at FROM users WHERE status = 'PENDING' ORDER BY created_at ASC")).rows); } catch { return res.status(500).json({ error: 'Unable to load pending users.' }); } });
app.put('/api/admin/users/:id/status', authenticateToken, requireAdmin, async (req, res) => {
    if (!isOneOf(req.body.status, ['APPROVED', 'REJECTED'])) return res.status(400).json({ error: 'Invalid user status.' });
    try { const result = await pool.query("UPDATE users SET status = $1 WHERE id = $2 AND role <> 'ADMIN' RETURNING id, status", [req.body.status, req.params.id]); return result.rows[0] ? res.json(result.rows[0]) : res.status(404).json({ error: 'Pending user not found.' }); } catch { return res.status(500).json({ error: 'Unable to update user.' }); }
});
app.get('/api/admin/feedback', authenticateToken, requireAdmin, async (_req, res) => { try { return res.json((await pool.query('SELECT feedback.id, feedback.type, feedback.content, feedback.status, feedback.created_at, users.username FROM feedback JOIN users ON users.id = feedback.user_id ORDER BY feedback.created_at DESC')).rows); } catch { return res.status(500).json({ error: 'Unable to load feedback.' }); } });
app.put('/api/admin/feedback/:id/status', authenticateToken, requireAdmin, async (req, res) => {
    if (!isOneOf(req.body.status, ['COMPLETED', 'REJECTED'])) return res.status(400).json({ error: 'Invalid feedback status.' });
    try { const result = await pool.query('UPDATE feedback SET status = $1 WHERE id = $2 RETURNING id, status', [req.body.status, req.params.id]); return result.rows[0] ? res.json(result.rows[0]) : res.status(404).json({ error: 'Feedback not found.' }); } catch { return res.status(500).json({ error: 'Unable to update feedback.' }); }
});

const socketsByUser = new Map(); const listeningByUser = new Map();
const emitPresence = () => { io.emit('onlineCount', socketsByUser.size); io.emit('onlineUsers', [...socketsByUser.keys()].map((id) => ({ id, username: socketsByUser.get(id).username, nowListening: socketsByUser.get(id).showListening ? listeningByUser.get(id) || null : null }))); };
io.use((socket, next) => { try { socket.user = authPayload(socket.handshake.auth?.token); return next(); } catch { return next(new Error('Unauthorized')); } });
io.on('connection', async (socket) => {
    const userId = String(socket.user.id); const settings = await pool.query('SELECT show_listening_activity FROM users WHERE id = $1', [socket.user.id]).catch(() => ({ rows: [] })); const user = socketsByUser.get(userId) || { username: socket.user.username, showListening: settings.rows[0]?.show_listening_activity !== false, socketIds: new Set() }; user.socketIds.add(socket.id); socketsByUser.set(userId, user); emitPresence();
    socket.on('requestChatHistory', async () => { try { const rows = (await pool.query('SELECT chat_messages.id, chat_messages.user_id, chat_messages.message, chat_messages.created_at, users.username FROM chat_messages JOIN users ON users.id = chat_messages.user_id ORDER BY chat_messages.created_at DESC LIMIT 100')).rows; socket.emit('chatHistory', rows.reverse()); } catch (error) { console.error('Chat history error:', error); socket.emit('chatError', 'Unable to load chat history.'); } });
    socket.on('sendMessage', async (payload) => { const message = String(payload?.message || '').trim(); if (!message || message.length > 500) return socket.emit('chatError', 'Messages must be between 1 and 500 characters.'); try { const row = (await pool.query('INSERT INTO chat_messages (user_id, message) VALUES ($1, $2) RETURNING id, user_id, message, created_at', [socket.user.id, message])).rows[0]; io.emit('newMessage', { ...row, username: socket.user.username }); } catch (error) { console.error('Chat send error:', error); socket.emit('chatError', 'Unable to send message.'); } });
    socket.on('nowListening', (song) => { const title = String(song?.title || '').trim(); const artist = String(song?.artist || '').trim(); listeningByUser.set(userId, title ? { title: title.slice(0, 100), artist: artist.slice(0, 100) } : null); emitPresence(); });
    socket.on('disconnect', () => { const active = socketsByUser.get(userId); active?.socketIds.delete(socket.id); if (!active?.socketIds.size) { socketsByUser.delete(userId); listeningByUser.delete(userId); } emitPresence(); });
});
server.listen(PORT, () => console.log(`CNXify server listening on port ${PORT}`));
