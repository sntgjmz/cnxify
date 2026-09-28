import { useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { apiUrl } from '../lib/api';

export default function NotificationMenu({ token }) {
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState([]);
    const unread = items.filter((item) => !item.is_read).length;

    const load = async () => {
        try {
            const response = await fetch(apiUrl('/api/notifications'), { headers: { Authorization: `Bearer ${token}` } });
            if (response.ok) setItems(await response.json());
        } catch { /* Notifications are non-blocking. */ }
    };
    useEffect(() => { if (token) load(); }, [token]);
    useEffect(() => {
        if (!open || !unread) return undefined;
        fetch(apiUrl('/api/notifications/read'), { method: 'PUT', headers: { Authorization: `Bearer ${token}` } })
            .then(() => setItems((list) => list.map((item) => ({ ...item, is_read: true }))))
            .catch(() => {});
        return undefined;
    }, [open, unread, token]);

    return <div className="relative">
        <button onClick={() => { setOpen((value) => !value); if (!open) load(); }} aria-label="Notifications" className="relative grid h-9 w-9 place-items-center rounded-full text-[#d9cadf] transition hover:bg-white/10 hover:text-white"><Bell size={18} />{unread > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#f6c6d1] px-1 text-[9px] font-black text-[#281a30]">{unread > 9 ? '9+' : unread}</span>}</button>
        {open && <><button onClick={() => setOpen(false)} aria-label="Close notifications" className="fixed inset-0 z-20 cursor-default" /><section className="absolute right-0 top-12 z-30 w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-white/10 bg-[#22182a]/[.98] shadow-2xl backdrop-blur-xl"><header className="flex items-center justify-between border-b border-white/10 px-4 py-3"><div><h3 className="font-black">Notifications</h3><p className="text-xs text-[#b9a6c0]">Updates from CNXify</p></div><CheckCheck size={18} className="text-[#f6c6d1]" /></header><div className="max-h-80 overflow-y-auto p-2">{items.length ? items.map((item) => <article key={item.id} className="rounded-xl p-3 hover:bg-white/5"><p className="text-sm text-white">{item.message}</p><time className="mt-1 block text-[11px] text-[#a997b1]">{new Date(item.created_at).toLocaleString()}</time></article>) : <p className="p-6 text-center text-sm text-[#a997b1]">You are all caught up.</p>}</div></section></>}
    </div>;
}
