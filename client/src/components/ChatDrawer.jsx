import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Music2, Send, Smile, Trash2, UserRound, X } from 'lucide-react';
import { apiUrl } from '../lib/api';

const time = new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit', hour12: true });
const EMOJIS = [
    '\u{1F600}', '\u{1F603}', '\u{1F604}', '\u{1F601}', '\u{1F606}', '\u{1F979}', '\u{1F60A}', '\u{1F60D}',
    '\u{1F618}', '\u{1F60E}', '\u{1F929}', '\u{1F973}', '\u{1F602}', '\u{1F923}', '\u{1F97A}', '\u{1F62D}',
    '\u{1F622}', '\u{1F62E}', '\u{1F631}', '\u{1F621}', '\u{1F914}', '\u{1F644}', '\u{1F634}', '\u{1F917}',
    '\u{1F44D}', '\u{1F44E}', '\u{1F44F}', '\u{1F64C}', '\u{1F525}', '\u{2728}', '\u{1F4AF}', '\u{1F389}',
    '\u{2764}\u{FE0F}', '\u{1FAF6}', '\u{1F494}', '\u{1F495}', '\u{1F3B5}', '\u{1F3A7}', '\u{1F3B6}', '\u{1F3A4}',
    '\u{2615}', '\u{1F4BC}', '\u{2705}', '\u{274C}', '\u{1F4AA}', '\u{1F64F}', '\u{1F440}', '\u{1F31F}',
];
const REACTIONS = ['\u{1F44D}', '\u{1F606}', '\u{1F62E}', '\u{1F622}', '\u{1F621}', '\u{2764}\u{FE0F}'];

export default function ChatDrawer({ socket, onProfile, onPlaySong, openRequest, onUnreadChange, userRole, currentSong }) {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [users, setUsers] = useState([]);
    const [mention, setMention] = useState('');
    const [unread, setUnread] = useState(0);
    const [error, setError] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
    const [reactionPickerId, setReactionPickerId] = useState(null);
    const end = useRef(null);
    const token = localStorage.getItem('cnxify_token');
    const currentUserId = (() => { try { return JSON.parse(atob(token.split('.')[1])).id; } catch { return null; } })();

    useEffect(() => {
        if (!token) return undefined;
        let cancelled = false;
        fetch(apiUrl('/api/users/directory'), { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => (res.ok ? res.json() : []))
            .then((data) => { if (!cancelled) setUsers(data); })
            .catch(() => {});
        return () => { cancelled = true; };
    }, [token]);

    useEffect(() => {
        if (!socket) return undefined;
        const received = (message) => {
            setMessages((items) => [...items, message]);
            if (!open) setUnread((count) => count + 1);
        };
        const deleted = (id) => setMessages((items) => items.filter((message) => String(message.id) !== String(id)));
        const reactionUpdated = ({ messageId, reactions }) => setMessages((items) => items.map((message) => (
            String(message.id) === String(messageId) ? { ...message, reactions } : message
        )));
        socket.on('chatHistory', setMessages);
        socket.on('newMessage', received);
        socket.on('chatError', setError);
        socket.on('chatCleared', () => setMessages([]));
        socket.on('chatMessageDeleted', deleted);
        socket.on('chatReactionUpdated', reactionUpdated);
        return () => {
            socket.off('chatHistory'); socket.off('newMessage', received); socket.off('chatError');
            socket.off('chatCleared'); socket.off('chatMessageDeleted', deleted); socket.off('chatReactionUpdated', reactionUpdated);
        };
    }, [socket, open]);

    useEffect(() => { if (open && socket) { socket.emit('requestChatHistory'); setUnread(0); } }, [open, socket]);
    useEffect(() => { onUnreadChange(unread); }, [unread, onUnreadChange]);
    useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
    useEffect(() => { if (openRequest) setOpen(true); }, [openRequest]);

    const updateText = (value) => {
        setText(value);
        const match = value.match(/@([\w.-]*)$/);
        setMention(match ? match[1] : '');
    };
    const insertMention = (user) => { setText((value) => value.replace(/@[\w.-]*$/, `@${user.username} `)); setMention(''); };
    const insertEmoji = (emoji) => { setText((value) => `${value}${value ? ' ' : ''}${emoji}`); setEmojiPickerOpen(false); };
    const matches = mention ? users.filter((user) => user.username.toLowerCase().includes(mention.toLowerCase())).slice(0, 5) : [];

    const send = async (share = false) => {
        const message = share ? '' : text.trim();
        if ((!message && !share && !imageFile) || (share && !currentSong)) return;
        try {
            let imagePath = null;
            if (imageFile) {
                const form = new FormData(); form.append('image', imageFile);
                const response = await fetch(apiUrl('/api/chat/images'), { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Unable to upload image.');
                imagePath = data.image_path;
            }
            socket.emit('sendMessage', { message, songId: share ? currentSong.id : null, imagePath });
            setText(''); setMention(''); setImageFile(null);
        } catch (sendError) { setError(sendError.message); }
    };

    const deleteMessage = async (id) => {
        const path = id ? (userRole === 'ADMIN' ? `/api/admin/chat/messages/${id}` : `/api/chat/messages/${id}`) : '/api/admin/chat/messages';
        try {
            const response = await fetch(apiUrl(path), { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Unable to delete message.');
            setMessages((items) => (id ? items.filter((message) => String(message.id) !== String(id)) : []));
        } catch (deleteError) { setError(deleteError.message); }
    };

    const renderMentions = (value) => String(value || '').split(/(@[\w.-]+)/g).map((part, index) => {
        const user = part.startsWith('@') && users.find((item) => item.username.toLowerCase() === part.slice(1).toLowerCase());
        return user ? <button key={index} onClick={() => onProfile(user.id)} className="font-bold text-[#f6c6d1] hover:underline">{part}</button> : part;
    });

    return <>
        {open && <button onClick={() => setOpen(false)} className="fixed inset-0 z-40 cursor-default bg-black/50" aria-label="Close chat" />}
        <aside className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-white/10 bg-[#1c1423] text-white shadow-2xl transition-transform ${open ? 'translate-x-0' : 'translate-x-full'}`}>
            <header className="flex items-center justify-between border-b border-white/10 bg-[#2e2038] p-5">
                <div><b className="text-xs tracking-[.18em] text-[#f6c6d1]">CNXIFY COMMUNITY CHAT</b><p className="mt-1 text-xs text-gray-400">Share songs, images, and emojis</p></div>
                <div className="flex gap-1">
                    {userRole === 'ADMIN' && <button onClick={() => window.confirm('Delete every community message?') && deleteMessage('')} title="Clear all messages" className="rounded-lg p-2 text-[#f6c6d1] hover:bg-white/10"><Trash2 size={17} /></button>}
                    <button onClick={() => setOpen(false)} className="rounded-lg p-2 hover:bg-white/10"><X /></button>
                </div>
            </header>
            <main className="flex-1 space-y-4 overflow-y-auto p-5">
                {error && <p className="rounded-lg bg-red-950/50 p-2 text-xs text-red-200">{error}</p>}
                {messages.map((message, index) => <article key={message.id || index} className="group flex gap-2">
                    <button onClick={() => onProfile(message.user_id)} className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-[#f6c6d1] text-[#281a30]">
                        {message.avatar_path ? <img src={apiUrl(message.avatar_path)} alt="" className="h-full w-full object-cover" /> : <UserRound size={15} />}
                    </button>
                    <div className="min-w-0">
                        <div className="flex gap-2 text-xs"><b>{message.username}</b><time className="text-gray-500">{message.created_at && time.format(new Date(message.created_at))}</time>
                            {(userRole === 'ADMIN' || String(message.user_id) === String(currentUserId)) && <button onClick={() => window.confirm('Delete this message?') && deleteMessage(message.id)} title="Delete message" className="rounded p-1 text-gray-500 sm:opacity-0 sm:group-hover:opacity-100"><Trash2 size={13} /></button>}
                        </div>
                        <div className="mt-1 max-w-[290px] rounded-2xl rounded-tl-sm bg-white/10 px-3 py-2 text-sm">
                            {renderMentions(message.message)}
                            {message.image_path && <img src={apiUrl(message.image_path)} alt="Shared in chat" className="mt-2 max-h-60 w-full rounded-xl object-cover" />}
                            {message.song_title && <button onClick={() => message.song_file_path && onPlaySong({ id: message.song_id, title: message.song_title, artist: message.song_artist, file_path: message.song_file_path, cover_path: message.song_cover_path })} className="mt-2 flex w-full items-center gap-2 rounded-xl bg-[#f6c6d1]/15 p-2 text-left"><Music2 size={16} className="text-[#f6c6d1]" /><span className="min-w-0"><b className="block truncate text-xs">{message.song_title}</b><small className="block truncate text-[10px] text-gray-300">{message.song_artist} - Play</small></span></button>}
                        </div>
                        <div className="relative mt-1 flex flex-wrap gap-1">
                            {(message.reactions || []).map((reaction) => <button key={reaction.emoji} onClick={() => socket.emit('toggleChatReaction', { messageId: message.id, emoji: reaction.emoji })} className={`rounded-full border px-2 py-0.5 text-xs ${reaction.reacted_by_me ? 'border-[#f6c6d1]/70 bg-[#f6c6d1]/20' : 'border-white/10 bg-white/5'}`}>{reaction.emoji} {reaction.count}</button>)}
                            <button onClick={() => setReactionPickerId(reactionPickerId === message.id ? null : message.id)} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs">+</button>
                            {reactionPickerId === message.id && <div className="absolute bottom-8 left-0 z-10 flex gap-1 rounded-full border border-white/10 bg-[#32243c] p-1.5 shadow-xl">{REACTIONS.map((emoji) => <button key={emoji} onClick={() => { socket.emit('toggleChatReaction', { messageId: message.id, emoji }); setReactionPickerId(null); }} className="rounded-full p-1 text-base hover:bg-white/10">{emoji}</button>)}</div>}
                        </div>
                    </div>
                </article>)}
                <div ref={end} />
            </main>
            <form onSubmit={(event) => { event.preventDefault(); send(); }} className="relative border-t border-white/10 p-4">
                {matches.length > 0 && <div className="absolute bottom-[76px] left-4 right-4 z-10 rounded-xl border border-white/10 bg-[#2a1d33] p-2 shadow-xl">{matches.map((user) => <button type="button" key={user.id} onClick={() => insertMention(user)} className="flex w-full gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-white/10"><UserRound size={15} />{user.username}</button>)}</div>}
                {emojiPickerOpen && <div className="absolute bottom-[76px] right-4 z-10 rounded-2xl border border-white/10 bg-[#2a1d33] p-3 shadow-2xl" style={{ width: 'min(304px, calc(100vw - 32px))' }}>
                    <p className="mb-2 text-[10px] font-black uppercase tracking-[.16em] text-[#f6c6d1]">Choose an emoji</p>
                    <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(8, minmax(0, 1fr))' }}>{EMOJIS.map((emoji) => <button type="button" key={emoji} onClick={() => insertEmoji(emoji)} className="grid aspect-square place-items-center rounded-lg text-lg hover:scale-110 hover:bg-white/10">{emoji}</button>)}</div>
                </div>}
                <div className="mb-2 flex justify-between text-[11px] text-gray-500">
                    <span>{imageFile ? `Image ready: ${imageFile.name}` : 'Type @ to mention'}</span>
                    <span className="flex items-center gap-2"><label className="cursor-pointer text-[#f6c6d1]"><ImagePlus size={15} /><input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => setImageFile(event.target.files?.[0] || null)} /></label><button type="button" onClick={() => setEmojiPickerOpen((value) => !value)} className={`rounded p-1 ${emojiPickerOpen ? 'bg-[#f6c6d1] text-[#281a30]' : 'text-[#f6c6d1]'}`}><Smile size={15} /></button>{currentSong && <button type="button" onClick={() => send(true)} className="text-[#f6c6d1]">Share current song</button>}</span>
                </div>
                <div className="flex gap-2 rounded-xl bg-white/5 p-1"><input value={text} onChange={(event) => updateText(event.target.value)} placeholder="Message..." className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none" /><button className="grid h-9 w-9 place-items-center rounded-lg bg-[#f6c6d1] text-[#281a30]"><Send size={16} /></button></div>
            </form>
        </aside>
    </>;
}
