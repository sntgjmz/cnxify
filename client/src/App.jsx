// client/src/App.jsx
import { useEffect, useState, useContext } from 'react';
import { io } from 'socket.io-client';
import { ArrowLeft, Disc, Heart, ListMusic, Play, Search, UploadCloud, UserCheck, UserPlus, UserRound } from 'lucide-react';
import { AudioProvider } from './context/AudioContext';
import { AudioContext } from './context/audio-state';
import FullScreenPlayer from './components/FullScreenPlayer';
import FeedbackModal from './components/FeedbackModal';
import ChatDrawer from './components/ChatDrawer';
import AdminDashboard from './components/AdminDashboard';
import Sidebar from './components/Sidebar';
import Auth from './components/Auth';
import PlaylistModal from './components/PlaylistModal';
import UploadModal from './components/UploadModal'; 
import AddToPlaylistModal from './components/AddToPlaylistModal';
import ProfileView from './components/ProfileView';
import { API_URL, apiUrl } from './lib/api';

const socket = io(API_URL, { autoConnect: false });

function TypeBadge({ label }) {
    return <span className="ml-auto shrink-0 rounded-full bg-[#f6c6d1]/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#f6c6d1]">{label}</span>;
}

function SearchResults({ title, icon, empty, items, renderItem }) {
    return <section><h3 className="mb-3 flex items-center gap-2 text-sm font-black text-white">{icon} {title}</h3>{items.length ? <div className="space-y-2">{items.map(renderItem)}</div> : <p className="rounded-xl border border-dashed border-white/10 px-4 py-3 text-sm text-gray-500">{empty}</p>}</section>;
}

function MainDashboard({ setToken }) {

    const { currentSong, setCurrentSong } = useContext(AudioContext);
    const [onlineCount, setOnlineCount] = useState(0);
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false); 
    const [currentView, setCurrentView] = useState('home');
    const [userRole, setUserRole] = useState('USER');
    const [searchQuery, setSearchQuery] = useState('');
    const [myPlaylists, setMyPlaylists] = useState([]);
    
    // Music Library State
    const [librarySongs, setLibrarySongs] = useState([]); 
    const [selectedArtist, setSelectedArtist] = useState(null);
    const [selectedAlbum, setSelectedAlbum] = useState(null);   
    const [selectedProfileId, setSelectedProfileId] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [isFollowingArtist, setIsFollowingArtist] = useState(false);
    const [isArtistFollowLoading, setIsArtistFollowLoading] = useState(false);
    const [chatOpenRequest, setChatOpenRequest] = useState(0);
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [songToAdd, setSongToAdd] = useState(null);
    const [likedSongs, setLikedSongs] = useState([]);
    const [libraryError, setLibraryError] = useState('');
    const [followedArtists, setFollowedArtists] = useState([]);
    const [selectedPlaylist, setSelectedPlaylist] = useState(null);
    const [playlistSongs, setPlaylistSongs] = useState([]);
    const [isPlaylistLoading, setIsPlaylistLoading] = useState(false);
    const [searchResults, setSearchResults] = useState({ songs: [], playlists: [], profiles: [] });

    const token = localStorage.getItem('cnxify_token');

    useEffect(() => {
        if (token) {
            try {
                const decoded = JSON.parse(atob(token.split('.')[1]));
                setUserRole(decoded.role);
                socket.auth = { token };
                socket.connect();
                
                // Fetch user's existing playlists
                fetch(apiUrl(`/api/users/${decoded.id}`), {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                .then(res => res.json())
                .then(data => {
                    if (data.playlists) setMyPlaylists(data.playlists);
                })
                .catch(err => console.error('Error fetching playlists:', err));

                // Fetch all uploaded songs for the library
                fetch(apiUrl('/api/songs'), {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                .then(res => res.json())
                .then(data => setLibrarySongs(data))
                .catch(err => console.error('Error fetching songs:', err));

                fetch(apiUrl('/api/liked-songs'), {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                .then(async (response) => {
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.error || 'Unable to load liked songs.');
                    return data;
                })
                .then(setLikedSongs)
                .catch((error) => setLibraryError(error.message));

                fetch(apiUrl('/api/artists/following'), {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                .then(async (response) => {
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.error || 'Unable to load followed artists.');
                    return data;
                })
                .then(setFollowedArtists)
                .catch((error) => console.error('Unable to load followed artists:', error));

            } catch (e) {
                console.error('Invalid token payload:', e);
            }
        }

        socket.on('onlineCount', (count) => setOnlineCount(count));
        socket.on('onlineUsers', setOnlineUsers);

        return () => {
            socket.off('onlineCount');
            socket.off('onlineUsers');
            socket.disconnect();
        };
    }, [token]);

    useEffect(() => {
        const publishListening = () => socket.emit('nowListening', currentSong ? { title: currentSong.title, artist: currentSong.artist } : null);
        socket.on('connect', publishListening);
        if (socket.connected) publishListening();
        return () => socket.off('connect', publishListening);
    }, [currentSong]);

    useEffect(() => {
        if (!selectedArtist || !token) return;
        fetch(apiUrl(`/api/artists/${encodeURIComponent(selectedArtist)}/follow`), { headers: { Authorization: `Bearer ${token}` } })
            .then((response) => response.ok ? response.json() : { following: false })
            .then((data) => setIsFollowingArtist(Boolean(data.following)))
            .catch(() => setIsFollowingArtist(false));
    }, [selectedArtist, token]);

    useEffect(() => {
        const query = searchQuery.trim();
        if (!query || !token) { setSearchResults({ songs: [], playlists: [], profiles: [] }); return undefined; }
        const timer = setTimeout(async () => {
            try {
                const response = await fetch(apiUrl(`/api/search?q=${encodeURIComponent(query)}`), { headers: { Authorization: `Bearer ${token}` } });
                const data = await response.json();
                if (response.ok) setSearchResults(data);
            } catch (error) { console.error('Search failed:', error); }
        }, 220);
        return () => clearTimeout(timer);
    }, [searchQuery, token]);

    const handleLogout = () => {
        localStorage.removeItem('cnxify_token');
        setToken(null);
    };

    const handlePlaylistCreated = (newPlaylist) => {
        setMyPlaylists([newPlaylist, ...myPlaylists]);
        setCurrentView('library'); 
    };

    const handleUploadComplete = (newSong) => {
        setLibrarySongs(prev => [newSong, ...prev]);
    };

    const playSong = (song) => {
        setCurrentSong({
            ...song,
            file_path: apiUrl(song.file_path),
            cover_path: song.cover_path ? apiUrl(song.cover_path) : null
        });
    };

    const toggleLikedSong = async (song) => {
        const isLiked = likedSongs.some((likedSong) => likedSong.id === song.id);
        try {
            const response = await fetch(apiUrl(`/api/songs/${song.id}/like`), {
                method: isLiked ? 'DELETE' : 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Unable to update liked songs.');
            setLikedSongs((songs) => isLiked ? songs.filter((likedSong) => likedSong.id !== song.id) : [song, ...songs]);
        } catch (error) {
            setLibraryError(error.message);
        }
    };

    const openProfile = (profileId) => {
        setSelectedProfileId(profileId);
        setCurrentView('profile');
    };

    const playPlaylist = async (playlist) => {
        try {
            const response = await fetch(apiUrl(`/api/playlists/${playlist.id}/songs`), { headers: { Authorization: `Bearer ${token}` } });
            const songs = await response.json();
            if (response.ok && songs[0]) playSong(songs[0]);
        } catch (error) {
            console.error('Unable to play playlist:', error);
        }
    };

    const openPlaylist = async (playlist) => {
        setSelectedPlaylist(playlist);
        setCurrentView('playlistDetail');
        setIsPlaylistLoading(true);
        try {
            const response = await fetch(apiUrl(`/api/playlists/${playlist.id}/songs`), { headers: { Authorization: `Bearer ${token}` } });
            const songs = await response.json();
            if (!response.ok) throw new Error(songs.error || 'Unable to load playlist.');
            setPlaylistSongs(songs);
        } catch (error) {
            setPlaylistSongs([]);
            setLibraryError(error.message);
        } finally {
            setIsPlaylistLoading(false);
        }
    };

    const toggleArtistFollow = async () => {
        if (!selectedArtist) return;
        setIsArtistFollowLoading(true);
        setLibraryError('');
        try {
            const response = await fetch(apiUrl(`/api/artists/${encodeURIComponent(selectedArtist)}/follow`), {
                method: isFollowingArtist ? 'DELETE' : 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (response.ok) {
                setIsFollowingArtist(data.following);
                setFollowedArtists((artists) => data.following
                    ? [{ artist_name: selectedArtist, cover_path: artistSongs.find((song) => song.cover_path)?.cover_path || null }, ...artists.filter((artist) => artist.artist_name !== selectedArtist)]
                    : artists.filter((artist) => artist.artist_name !== selectedArtist));
            }
        } catch (error) {
            setLibraryError(error.message || 'Unable to update artist follow.');
        } finally {
            setIsArtistFollowLoading(false);
        }
    };

    // --- Dynamic Data Grouping Logic ---
    const uniqueArtists = Array.from(new Set(librarySongs.map(s => s.artist))).map(artistName => {
        const artistSongs = librarySongs.filter(s => s.artist === artistName);
        return {
            name: artistName,
            cover: artistSongs.find(s => s.cover_path)?.cover_path || null, 
            songCount: artistSongs.length
        };
    });

    const artistSongs = selectedArtist ? librarySongs.filter(s => s.artist === selectedArtist) : [];
    
    const uniqueAlbums = Array.from(new Set(artistSongs.map(s => s.album))).map(albumName => {
        const albumSongs = artistSongs.filter(s => s.album === albumName);
        return {
            title: albumName,
            cover: albumSongs.find(s => s.cover_path)?.cover_path || null,
            songCount: albumSongs.length
        };
    });

    const albumSongs = selectedAlbum ? artistSongs.filter(s => s.album === selectedAlbum) : [];

    if (currentView === 'admin') {
        return <AdminDashboard onBackToDashboard={() => setCurrentView('home')} />;
    }

    return (
        <div className="min-h-screen bg-[#17121b] text-white font-sans flex">
            <Sidebar 
                userRole={userRole} 
                currentView={currentView} 
                onNavigate={(view) => {
                    setCurrentView(view);
                    if (view !== 'artistDetail' && view !== 'albumDetail') {
                        setSelectedArtist(null);
                        setSelectedAlbum(null);
                    }
                }} 
                onOpenNewPlaylist={() => setIsPlaylistModalOpen(true)}
                onOpenChat={() => setChatOpenRequest((request) => request + 1)}
                unreadMessages={unreadMessages}
                onLogout={handleLogout}
                playlists={myPlaylists}
                followedArtists={followedArtists}
                onPlayPlaylist={openPlaylist}
                onSelectArtist={(artistName) => { setSelectedArtist(artistName); setCurrentView('artistDetail'); }}
                onOpenProfile={() => { setSelectedProfileId(JSON.parse(atob(token.split('.')[1])).id); setCurrentView('profile'); }}
            />

            <div className="flex-1 ml-60 flex flex-col h-screen overflow-hidden bg-[radial-gradient(circle_at_70%_-20%,#493253_0%,#211827_38%,#17121b_72%)]">
                <header className="flex justify-between items-center gap-5 px-6 md:px-10 py-4 bg-[#17121b]/70 backdrop-blur-xl border-b border-white/5 z-10">
                    <div className="flex items-center gap-4 w-full flex-1 max-w-2xl">
                        <div className="relative w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <input 
                                type="text" 
                                placeholder="What do you want to play?" 
                                value={searchQuery}
                                onChange={(event) => { setSearchQuery(event.target.value); if (event.target.value.trim()) setCurrentView('search'); }}
                                className="w-full bg-white/10 border border-white/10 text-white placeholder:text-gray-400 py-2.5 pl-12 pr-4 rounded-full text-sm font-medium outline-none focus:ring-2 focus:ring-[#f2cdd6]/70 transition-all"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="hidden md:flex text-xs font-semibold text-[#f2cdd6] bg-[#3b2d47] px-3.5 py-1.5 rounded-full items-center gap-2 border border-[#4a395c]">
                            <span className="w-2 h-2 rounded-full bg-[#f2cdd6] animate-pulse"></span> {onlineCount} Online
                        </div>
                        
                        {/* ADMIN ONLY: Upload Button */}
                        {userRole === 'ADMIN' && (
                            <button onClick={() => setIsUploadModalOpen(true)} className="flex items-center gap-2 text-xs font-bold text-[#f2cdd6] hover:text-white transition-colors">
                                <UploadCloud size={16} /> Upload
                            </button>
                        )}
                        
                        <button onClick={() => setIsFeedbackOpen(true)} className="hidden sm:block rounded-full px-3 py-2 text-xs font-bold text-gray-300 hover:bg-white/5 hover:text-white transition-colors">Feedback</button>
                    </div>
                </header>
                
                <main className="flex-1 overflow-y-auto px-6 md:px-10 pb-32">
                    {currentView === 'profile' && selectedProfileId && (
                        <ProfileView
                            userId={selectedProfileId}
                            token={token}
                            onBack={() => setCurrentView('home')}
                            onPlayPlaylist={playPlaylist}
                            nowListening={onlineUsers.find((user) => String(user.id) === String(selectedProfileId))?.nowListening}
                            isCurrentUser={String(selectedProfileId) === String(JSON.parse(atob(token.split('.')[1])).id)}
                        />
                    )}
                    {currentView === 'home' && (
                        <div className="w-full">
                            <h2 className="text-2xl font-bold mb-5 tracking-tight">Good to see you</h2>
                            
                            <div className="bg-gradient-to-br from-[#684474] via-[#3d294b] to-[#211827] border border-white/10 p-8 md:p-12 rounded-3xl mb-12 flex flex-col justify-between relative overflow-hidden min-h-[300px] shadow-[0_24px_70px_rgba(0,0,0,0.3)]">
                                <div className="z-10">
                                    <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-[#f2cdd6] mb-4 uppercase">
                                        <span className="w-2 h-2 rounded-full bg-[#f2cdd6]"></span> CNX Soundroom
                                    </div>
                                    <h1 className="text-4xl md:text-6xl font-black mb-3 tracking-tighter leading-tight">Your workday, <br/> your soundtrack.</h1>
                                    <p className="text-gray-300 text-sm md:text-base max-w-lg mb-8">Play what you love, save the songs that fit your flow, and make the space your own.</p>
                                    
                                    <div className="flex items-center gap-4">
                                        <button 
                                            onClick={() => librarySongs.length > 0 && playSong(librarySongs[0])} 
                                            className="bg-[#f6c6d1] text-[#2c2137] w-14 h-14 rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
                                        >
                                            <span aria-hidden="true" className="ml-1 block h-0 w-0 border-y-[9px] border-y-transparent border-l-[13px] border-l-current" />
                                        </button>
                                        <div>
                                            <p className="font-bold text-base">{librarySongs.length > 0 ? librarySongs[0].title : 'No tracks yet'}</p>
                                            <p className="text-sm text-gray-400">{librarySongs.length > 0 ? librarySongs[0].artist : (userRole === 'ADMIN' ? 'Click Upload to add music' : 'Waiting for Admin to add music')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold mb-5 tracking-tight">Recently Added</h3>
                            
                            {librarySongs.length === 0 ? (
                                <p className="text-gray-400 text-sm p-4 bg-[#342742] rounded-lg border border-[#4a395c] border-dashed">
                                    {userRole === 'ADMIN' ? 'No music found. Click "Upload" in the top right.' : 'The library is currently empty.'}
                                </p>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-6">
                                    {librarySongs.slice(0, 16).map((song) => (
                                        <div key={song.id} onClick={() => playSong(song)} className="bg-white/5 hover:bg-white/10 p-4 rounded-2xl transition-all cursor-pointer group border border-white/5 hover:border-[#f6c6d1]/35 hover:-translate-y-1">
                                            <div className="w-full aspect-square bg-[#4a395c] rounded-lg mb-4 flex items-center justify-center text-4xl shadow-md group-hover:shadow-xl transition-all relative overflow-hidden">
                                                {song.cover_path ? (
                                                    <img src={apiUrl(song.cover_path)} alt={song.title} className="w-full h-full object-cover" />
                                                ) : null}
                                                <button onClick={(event) => { event.stopPropagation(); playSong(song); }} aria-label={`Play ${song.title}`} className="absolute inset-0 m-auto bg-[#f6c6d1] text-[#2c2137] w-12 h-12 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 shadow-[0_12px_24px_rgba(0,0,0,0.35)] hover:scale-110">
                                                    <span aria-hidden="true" className="ml-0.5 block h-0 w-0 border-y-[7px] border-y-transparent border-l-[10px] border-l-current" />
                                                </button>
                                            </div>
                                            <h4 className="font-bold text-sm mb-1 truncate text-white">{song.title}</h4>
                                            <p className="text-xs text-gray-400 truncate">{song.artist}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {currentView === 'search' && (
                        <div className="w-full">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f6c6d1]">Explore CNXify</p>
                            <h2 className="mt-1 text-3xl font-black tracking-tight">Search results</h2>
                            {searchQuery.trim() && <div className="mt-7 space-y-8">
                                <SearchResults title="Songs" icon={<Play size={15} fill="currentColor" />} empty="No matching songs." items={searchResults.songs} renderItem={(song) => <button key={song.id} onClick={() => playSong(song)} className="flex w-full items-center gap-4 rounded-2xl border border-white/5 bg-white/5 p-4 text-left hover:bg-white/10"><span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#f6c6d1]/15 text-[#f6c6d1]">{song.cover_path ? <img src={apiUrl(song.cover_path)} alt="" className="h-full w-full object-cover" /> : <Play size={16} fill="currentColor" />}</span><span className="min-w-0"><b className="block truncate">{song.title}</b><small className="block truncate text-gray-400">{song.artist} · {song.album}</small></span><TypeBadge label="Song" /></button>} />
                                <SearchResults title="Playlists" icon={<ListMusic size={15} />} empty="No public playlists found." items={searchResults.playlists} renderItem={(playlist) => <button key={playlist.id} onClick={() => openPlaylist(playlist)} className="flex w-full items-center gap-4 rounded-2xl border border-white/5 bg-white/5 p-4 text-left hover:bg-white/10"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#f6c6d1]/15 text-[#f6c6d1]"><ListMusic size={20} /></span><span className="min-w-0"><b className="block truncate">{playlist.title}</b><small className="block truncate text-gray-400">{playlist.description || 'Public playlist'}</small></span><TypeBadge label="Playlist" /></button>} />
                                <SearchResults title="Colleagues" icon={<UserRound size={15} />} empty="No colleague profiles found." items={searchResults.profiles} renderItem={(profile) => <button key={profile.id} onClick={() => openProfile(profile.id)} className="flex w-full items-center gap-4 rounded-2xl border border-white/5 bg-white/5 p-4 text-left hover:bg-white/10"><span className="grid h-11 w-11 place-items-center overflow-hidden rounded-full bg-[#f6c6d1]/15 text-[#f6c6d1]">{profile.avatar_path ? <img src={apiUrl(profile.avatar_path)} alt="" className="h-full w-full object-cover" /> : <UserRound size={19} />}</span><b className="truncate">{profile.username}</b><TypeBadge label="Profile" /></button>} />
                            </div>}
                            {searchResults.__legacy ? (
                                <div className="grid grid-cols-1 gap-3">
                                    {librarySongs.filter((song) => `${song.title} ${song.artist} ${song.album}`.toLowerCase().includes(searchQuery.toLowerCase())).map((song) => (
                                        <button key={song.id} onClick={() => playSong(song)} className="text-left bg-[#342742] hover:bg-[#3e2f4f] rounded-xl p-4 flex items-center gap-4"><span className="font-bold">{song.title}</span><span className="text-sm text-gray-400">{song.artist} · {song.album}</span></button>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    )}

                    {currentView === 'library' && (
                        <div className="w-full">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-3xl font-black tracking-tight">Your Library</h2>
                            </div>
                            
                            {myPlaylists.length === 0 ? (
                                <div className="text-center p-16 bg-[#342742]/50 rounded-2xl border border-[#4a395c] border-dashed">
                                    <h3 className="text-xl font-bold mb-2">No playlists yet</h3>
                                    <p className="text-gray-400 text-sm">Create your first playlist to start organizing your music.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-6">
                                    {myPlaylists.map(playlist => (
                                        <button key={playlist.id} onClick={() => openPlaylist(playlist)} className="bg-white/5 hover:bg-white/10 p-4 rounded-2xl transition-all cursor-pointer group border border-white/5 hover:border-[#f6c6d1]/35 text-left">
                                            <div className="w-full aspect-square bg-[#4a395c] rounded-lg mb-4 flex items-center justify-center text-5xl shadow-md group-hover:shadow-xl transition-all relative">
                                                <Disc size={42} className="text-[#f6c6d1]/70" />
                                            </div>
                                            <h4 className="font-bold text-sm mb-1 truncate text-white">{playlist.title}</h4>
                                            <p className="text-xs text-gray-400 truncate">
                                                {playlist.is_public ? 'Public Playlist' : 'Private Playlist'}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {currentView === 'playlistDetail' && selectedPlaylist && (
                        <div className="w-full">
                            <button onClick={() => setCurrentView('library')} className="mb-6 flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white"><ArrowLeft size={16} /> Your Library</button>
                            <div className="mb-9 flex flex-col gap-5 rounded-3xl border border-white/10 bg-gradient-to-br from-[#563a63] via-[#34233f] to-[#211827] p-7 sm:flex-row sm:items-end"><div className="grid h-32 w-32 place-items-center rounded-2xl bg-[#f6c6d1]/15 text-[#f6c6d1]"><Disc size={56} /></div><div className="flex-1"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#f6c6d1]">{selectedPlaylist.is_public ? 'Public playlist' : 'Private playlist'}</p><h2 className="mt-2 text-4xl font-black tracking-tight">{selectedPlaylist.title}</h2><p className="mt-2 text-sm text-gray-300">{playlistSongs.length} {playlistSongs.length === 1 ? 'song' : 'songs'}</p></div><button onClick={() => playlistSongs[0] && playSong(playlistSongs[0])} disabled={!playlistSongs.length} className="inline-flex items-center justify-center gap-3 rounded-full bg-[#f6c6d1] px-6 py-3 font-black text-[#281a30] transition hover:scale-105 disabled:opacity-50"><span aria-hidden="true" className="ml-0.5 block h-0 w-0 border-y-[7px] border-y-transparent border-l-[10px] border-l-current" /> Play</button></div>
                            {isPlaylistLoading ? <p className="text-sm text-gray-400">Loading playlist…</p> : playlistSongs.length === 0 ? <p className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-8 text-sm text-gray-400">This playlist has no songs yet. Use the + action on an album track to add one.</p> : <div className="space-y-2">{playlistSongs.map((song, index) => <button key={song.id} onClick={() => playSong(song)} className="grid w-full grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-4 py-3 text-left transition hover:bg-white/5"><span className="text-sm text-gray-500">{index + 1}</span><span className="min-w-0"><span className="block truncate text-sm font-bold text-white">{song.title}</span><span className="block truncate text-xs text-gray-400">{song.artist} · {song.album}</span></span><span aria-hidden="true" className="ml-0.5 block h-0 w-0 border-y-[5px] border-y-transparent border-l-[7px] border-l-[#f6c6d1]" /></button>)}</div>}
                        </div>
                    )}

                    {currentView === 'liked' && (
                        <div className="w-full pt-6">
                            <div className="mb-9 flex items-end gap-5 rounded-3xl border border-white/10 bg-gradient-to-r from-[#382743] to-[#211827] p-6 shadow-xl"><div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#f6c6d1] to-[#8b5ba0] text-[#281a30] shadow-lg"><Heart size={34} fill="currentColor" /></div><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#f6c6d1]">Your collection</p><h2 className="mt-1 text-3xl font-black tracking-tight">Liked Songs</h2><p className="mt-1 text-sm text-gray-400">{likedSongs.length} saved {likedSongs.length === 1 ? 'song' : 'songs'}</p></div></div>
                            {libraryError && <p className="mb-5 rounded-xl border border-red-400/30 bg-red-950/30 p-3 text-sm text-red-200">{libraryError}</p>}
                            {likedSongs.length === 0 ? <p className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-8 text-sm text-gray-400">No liked songs yet. Use the heart beside any album track to save it here.</p> : <div className="space-y-2">{likedSongs.map((song, index) => <div key={song.id} className="group grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-4 py-3 hover:bg-white/5"><span className="text-sm text-gray-500">{index + 1}</span><button onClick={() => playSong(song)} className="min-w-0 text-left"><p className="truncate text-sm font-bold text-white">{song.title}</p><p className="truncate text-xs text-gray-400">{song.artist} · {song.album}</p></button><button onClick={() => toggleLikedSong(song)} aria-label={`Remove ${song.title} from liked songs`} className="p-2 text-[#f6c6d1] hover:text-white"><Heart size={18} fill="currentColor" /></button></div>)}</div>}
                        </div>
                    )}

                    {currentView === 'artists' && (
                        <div className="w-full">
                            <h2 className="text-3xl font-black mb-2 tracking-tight">Artists</h2>
                            <p className="text-gray-400 text-sm mb-8">Browse your collection by artist.</p>
                            
                            {uniqueArtists.length === 0 ? (
                                <p className="text-gray-400 text-sm p-4 bg-[#342742] rounded-lg border border-[#4a395c] border-dashed">No artists found.</p>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-6">
                                    {uniqueArtists.map((artist, idx) => (
                                        <div 
                                            key={idx} 
                                            onClick={() => { setSelectedArtist(artist.name); setCurrentView('artistDetail'); }}
                                            className="bg-white/5 hover:bg-white/10 p-5 rounded-2xl transition-all cursor-pointer group text-center flex flex-col items-center border border-white/5 hover:border-[#f6c6d1]/35 hover:-translate-y-1"
                                        >
                                            <div className="w-full aspect-square bg-[#4a395c] rounded-full mb-5 flex items-center justify-center text-5xl shadow-md group-hover:shadow-xl transition-all overflow-hidden relative">
                                                {artist.cover ? (
                                                    <img src={apiUrl(artist.cover)} alt={artist.name} className="w-full h-full object-cover" />
                                                ) : <div className="h-1/2 w-1/2 rounded-full bg-[#f6c6d1]/20" />}
                                            </div>
                                            <h4 className="font-bold text-sm mb-1 truncate text-white w-full">{artist.name}</h4>
                                            <p className="text-xs text-gray-400">{artist.songCount} {artist.songCount === 1 ? 'song' : 'songs'}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {currentView === 'artistDetail' && selectedArtist && (
                        <div className="w-full">
                            <button onClick={() => setCurrentView('artists')} className="text-sm font-bold text-gray-400 hover:text-white mb-6 flex items-center gap-2">
                                <ArrowLeft size={16} /> Artists
                            </button>
                            
                            <div className="flex flex-col sm:flex-row sm:items-end gap-6 mb-10 rounded-3xl border border-white/10 bg-gradient-to-br from-[#563a63] via-[#34233f] to-[#211827] p-6 md:p-8 shadow-2xl">
                                <div className="w-36 h-36 md:w-40 md:h-40 rounded-full bg-[#4a395c] shadow-2xl overflow-hidden flex items-center justify-center text-6xl ring-4 ring-[#f6c6d1]/30">
                                    {uniqueAlbums[0]?.cover ? (
                                        <img src={apiUrl(uniqueAlbums[0].cover)} alt={selectedArtist} className="w-full h-full object-cover" />
                                    ) : <div className="h-1/2 w-1/2 rounded-full bg-[#f6c6d1]/20" />}
                                </div>
                                <div className="pb-1 flex-1">
                                    <p className="text-xs font-bold tracking-widest text-[#f6c6d1] uppercase mb-2">Artist</p>
                                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-2">{selectedArtist}</h1>
                                    <p className="text-sm text-gray-300 mb-5">{artistSongs.length} songs available in your library</p>
                                    <div className="flex flex-wrap gap-3">
                                    <button 
                                        onClick={() => artistSongs.length > 0 && playSong(artistSongs[0])}
                                        className="bg-[#f6c6d1] text-[#2c2137] px-6 py-3 rounded-full font-black hover:scale-105 transition-transform flex items-center gap-2 shadow-lg"
                                    >
                                        <Play size={17} fill="currentColor" /> Play all
                                    </button>
                                    <button onClick={toggleArtistFollow} disabled={isArtistFollowLoading} className="inline-flex items-center gap-2 rounded-full border border-[#f6c6d1]/50 bg-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/15 disabled:opacity-60">{isFollowingArtist ? <UserCheck size={17} /> : <UserPlus size={17} />}{isFollowingArtist ? 'Following' : 'Follow artist'}</button>
                                    </div>
                                    {libraryError && <p className="mt-4 text-sm text-red-200">{libraryError}</p>}
                                </div>
                            </div>

                            <h3 className="text-2xl font-bold mb-6 tracking-tight">Albums</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-6">
                                {uniqueAlbums.map((album, idx) => (
                                    <div 
                                        key={idx} 
                                        onClick={() => { setSelectedAlbum(album.title); setCurrentView('albumDetail'); }}
                                        className="bg-[#342742] hover:bg-[#3e2f4f] p-4 rounded-xl transition-all cursor-pointer group shadow-lg border border-transparent hover:border-[#4a395c]"
                                    >
                                        <div className="w-full aspect-square bg-[#4a395c] rounded-lg mb-4 flex items-center justify-center text-4xl shadow-md group-hover:shadow-xl transition-all relative overflow-hidden">
                                            {album.cover ? (
                                                <img src={apiUrl(album.cover)} alt={album.title} className="w-full h-full object-cover" />
                                            ) : <Disc size={36} className="text-[#f6c6d1]/55" />}
                                        </div>
                                        <h4 className="font-bold text-sm mb-1 truncate text-white">{album.title}</h4>
                                        <p className="text-xs text-gray-400">{album.songCount} {album.songCount === 1 ? 'track' : 'tracks'}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {currentView === 'albumDetail' && selectedAlbum && (
                        <div className="w-full">
                            <button onClick={() => setCurrentView('artistDetail')} className="text-sm font-bold text-gray-400 hover:text-white mb-6 flex items-center gap-2">
                                ‹ Back to {selectedArtist}
                            </button>
                            
                            <div className="flex items-end gap-6 mb-10">
                                <div className="w-48 h-48 rounded-lg bg-[#4a395c] shadow-2xl overflow-hidden flex items-center justify-center text-6xl">
                                    {albumSongs[0]?.cover_path ? (
                                        <img src={apiUrl(albumSongs[0].cover_path)} alt={selectedAlbum} className="w-full h-full object-cover" />
                                    ) : <Disc size={54} className="text-[#f6c6d1]/55" />}
                                </div>
                                <div className="pb-4">
                                    <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-2">Album</p>
                                    <h1 className="text-5xl font-black tracking-tighter mb-2">{selectedAlbum}</h1>
                                    <p className="text-sm text-gray-400 font-bold mb-6">{selectedArtist} • {albumSongs.length} tracks</p>
                                    <button 
                                        onClick={() => albumSongs.length > 0 && playSong(albumSongs[0])}
                                        className="bg-[#f6c6d1] text-[#2c2137] px-6 py-3 rounded-full font-black hover:scale-105 transition-transform flex items-center gap-3 shadow-lg"
                                    >
                                        <span aria-hidden="true" className="ml-0.5 block h-0 w-0 border-y-[7px] border-y-transparent border-l-[10px] border-l-current" /> Play album
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <div className="grid grid-cols-[40px_1fr_100px] text-xs font-bold text-gray-400 uppercase px-4 py-2 border-b border-[#3b2d47] mb-2">
                                    <span>#</span>
                                    <span>Title</span>
                                    <span className="text-right">Actions</span>
                                </div>
                                {albumSongs.map((song, idx) => (
                                    <div 
                                        key={song.id} 
                                        className="grid grid-cols-[40px_1fr_100px] items-center px-4 py-3 hover:bg-[#342742] rounded-lg cursor-pointer group transition-colors"
                                    >
                                        <span className="text-gray-500 group-hover:text-white" onClick={() => playSong(song)}>{idx + 1}</span>
                                        <div onClick={() => playSong(song)}>
                                            <p className="font-bold text-white mb-0.5">{song.title}</p>
                                            <p className="text-xs text-gray-400">{song.artist}</p>
                                        </div>
                                        <div className="text-right flex items-center justify-end gap-3 text-gray-500">
                                            <button onClick={() => setSongToAdd(song)} className="grid h-8 w-8 place-items-center rounded-full text-gray-400 hover:bg-white/10 hover:text-[#f6c6d1] transition-colors" title="Add to playlist" aria-label={`Add ${song.title} to playlist`}>+</button>
                                            <button onClick={() => toggleLikedSong(song)} aria-label={likedSongs.some((likedSong) => likedSong.id === song.id) ? `Unlike ${song.title}` : `Like ${song.title}`} className={`grid h-8 w-8 place-items-center rounded-full transition ${likedSongs.some((likedSong) => likedSong.id === song.id) ? 'text-[#f6c6d1]' : 'text-gray-500 hover:bg-white/10 hover:text-[#f6c6d1]'}`}><Heart size={16} fill={likedSongs.some((likedSong) => likedSong.id === song.id) ? 'currentColor' : 'none'} /></button>
                                            <button onClick={() => playSong(song)} aria-label={`Play ${song.title}`} className="grid h-8 w-8 place-items-center rounded-full bg-[#f6c6d1] text-[#281a30] opacity-0 group-hover:opacity-100 transition"><span aria-hidden="true" className="ml-0.5 block h-0 w-0 border-y-[5px] border-y-transparent border-l-[7px] border-l-current" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Modals are only rendered if the user is an Admin, adding extra security */}
            {userRole === 'ADMIN' && (
                <UploadModal 
                    isOpen={isUploadModalOpen} 
                    onClose={() => setIsUploadModalOpen(false)} 
                    token={token} 
                    onUploadComplete={handleUploadComplete} 
                />
            )}
            <PlaylistModal 
                isOpen={isPlaylistModalOpen} 
                onClose={() => setIsPlaylistModalOpen(false)} 
                token={token} 
                onPlaylistCreated={handlePlaylistCreated} 
            />
            <AddToPlaylistModal song={songToAdd} playlists={myPlaylists} token={token} onClose={() => setSongToAdd(null)} onCreatePlaylist={() => setIsPlaylistModalOpen(true)} />
            <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} token={token} />
            <ChatDrawer socket={socket} onlineUsers={onlineUsers} onProfile={openProfile} openRequest={chatOpenRequest} onUnreadChange={setUnreadMessages} />
            <FullScreenPlayer />
        </div>
    );
}

function App() {
    const [token, setToken] = useState(localStorage.getItem('cnxify_token'));

    return (
        <AudioProvider>
            {!token ? (
                <Auth setToken={setToken} />
            ) : (
                <MainDashboard setToken={setToken} />
            )}
        </AudioProvider>
    );
}

export default App;
