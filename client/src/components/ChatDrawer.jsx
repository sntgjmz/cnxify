import { useState, useEffect, useRef } from 'react';
import { X, Send, Users, Radio, UserRound } from 'lucide-react';

const philippinesTime = new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit', hour12: true,
});

export default function ChatDrawer({ socket, onlineUsers, onProfile, openRequest, onUnreadChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [error, setError] = useState('');
    const [unreadMessages, setUnreadMessages] = useState(0);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!socket) return undefined;
        const receiveMessage = (message) => {
            setMessages((current) => [...current, message]);
            if (!isOpen) setUnreadMessages((count) => count + 1);
        };
        socket.on('chatHistory', setMessages);
        socket.on('newMessage', receiveMessage);
        socket.on('chatError', setError);
        return () => { socket.off('chatHistory'); socket.off('newMessage', receiveMessage); socket.off('chatError'); };
    }, [socket, isOpen]);

    useEffect(() => { if (isOpen) { socket.emit('requestChatHistory'); setUnreadMessages(0); } }, [isOpen, socket]);
    useEffect(() => { if (openRequest > 0) setIsOpen(true); }, [openRequest]);
    useEffect(() => { onUnreadChange(unreadMessages); }, [unreadMessages, onUnreadChange]);
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isOpen]);

    const handleSend = (event) => {
        event.preventDefault();
        if (!newMessage.trim()) return;
        setError('');
        socket.emit('sendMessage', { message: newMessage });
        setNewMessage('');
    };

    return (
        <>
            {isOpen && <button aria-label="Close chat" onClick={() => setIsOpen(false)} className="fixed inset-0 z-40 cursor-default bg-[#100b15]/60 backdrop-blur-sm" />}
            <aside className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-white/10 bg-[#1c1423] text-white shadow-2xl transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <header className="border-b border-white/10 bg-gradient-to-r from-[#34213f] to-[#21162a] px-6 py-5">
                    <div className="flex items-center justify-between">
                        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f6c6d1]">CNXify socials</p></div>
                        <button onClick={() => setIsOpen(false)} aria-label="Close chat" className="rounded-full p-2 text-gray-400 hover:bg-white/10 hover:text-white"><X size={21} /></button>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs text-gray-300"><Users size={15} className="text-[#f6c6d1]" /> {onlineUsers.length} colleagues online · Philippine time</div>
                </header>

                <section className="border-b border-white/10 px-5 py-4">
                    <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-gray-500">Listening now</p>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {onlineUsers.map((user) => <button key={user.id} onClick={() => onProfile(user.id)} className="min-w-[116px] rounded-xl border border-white/8 bg-white/5 p-2.5 text-left transition hover:border-[#f6c6d1]/50 hover:bg-white/10"><span className="flex items-center gap-1.5 text-xs font-bold text-white"><span className="h-2 w-2 rounded-full bg-[#f6c6d1]" />{user.username}</span><span className="mt-1 block truncate text-[11px] text-gray-400">{user.nowListening ? `${user.nowListening.title} · ${user.nowListening.artist}` : 'Taking a pause'}</span></button>)}
                        {onlineUsers.length === 0 && <p className="text-xs text-gray-500">No colleagues online yet.</p>}
                    </div>
                </section>

                <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
                    {error && <p className="rounded-xl border border-red-400/30 bg-red-950/40 p-3 text-xs text-red-200">{error}</p>}
                    {messages.map((message, index) => <article key={message.id || index} className="flex gap-3">
                        <button onClick={() => onProfile(message.user_id)} aria-label={`View ${message.username}'s profile`} className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#f6c6d1] text-[#2a1b32]"><UserRound size={15} /></button>
                        <div className="min-w-0"><div className="flex items-baseline gap-2"><button onClick={() => onProfile(message.user_id)} className="text-sm font-bold text-[#ffdbe2] hover:underline">{message.username}</button><time className="text-[11px] text-gray-500">{message.created_at ? philippinesTime.format(new Date(message.created_at)) : ''}</time></div><p className="mt-1 w-fit max-w-[290px] break-words rounded-2xl rounded-tl-sm bg-white/8 px-3.5 py-2.5 text-sm leading-relaxed text-gray-100">{message.message}</p></div>
                    </article>)}
                    {messages.length === 0 && <div className="pt-10 text-center text-sm text-gray-500"><Radio className="mx-auto mb-3 text-[#f6c6d1]" /><p>Start the room’s conversation.</p></div>}
                    <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSend} className="border-t border-white/10 bg-[#17101d] p-4">
                    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-1.5 focus-within:border-[#f6c6d1]/60"><input value={newMessage} onChange={(event) => setNewMessage(event.target.value)} maxLength={500} placeholder="Share a song or thought…" className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-gray-500" /><button type="submit" aria-label="Send message" className="grid h-9 w-9 place-items-center rounded-xl bg-[#f6c6d1] text-[#2a1b32] transition hover:bg-white"><Send size={16} /></button></div>
                </form>
            </aside>
        </>
    );
}
