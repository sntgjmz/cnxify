import { Bell, CheckCircle2, Heart, ListMusic, MessageCircle, Music2, ShieldCheck, Sparkles, X } from 'lucide-react';

const updates = [
    { icon: Music2, title: 'A stronger player', text: 'Queue controls, previous/next tracks, likes, and an upgraded full-screen listening view.' },
    { icon: ListMusic, title: 'Your music, organized', text: 'Create playlists, update their details and artwork, browse liked songs, and revisit recently played tracks.' },
    { icon: MessageCircle, title: 'Better community chat', text: 'Share songs and images, mention colleagues, react to messages, and manage your own messages.' },
    { icon: Bell, title: 'Notifications', text: 'See important CNXify updates and account decisions from the new bell in the header.' },
    { icon: ShieldCheck, title: 'Admin workspace', text: 'Admins can review members and feedback, search users, and edit or remove library songs.' },
];

export default function WhatsNewModal({ onClose }) {
    return <div className="fixed inset-0 z-[100] grid place-items-center bg-[#100b15]/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="whats-new-title">
        <section className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#21172a] text-white shadow-[0_30px_100px_rgba(0,0,0,.55)]">
            <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_18%_20%,rgba(246,198,209,.35),transparent_37%),linear-gradient(115deg,#62416f,#2d2039)]" />
            <header className="relative flex items-start justify-between p-6 sm:p-8"><div><span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/10 px-3 py-1 text-[10px] font-black uppercase tracking-[.18em] text-[#ffd9e2]"><Sparkles size={13} /> What’s new</span><h1 id="whats-new-title" className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Welcome to the new CNXify.</h1><p className="mt-2 max-w-lg text-sm text-[#eaddeb]">Your soundroom has new ways to listen, connect, and organize your music.</p></div><button onClick={onClose} aria-label="Close updates" className="grid h-10 w-10 place-items-center rounded-full bg-black/15 text-white transition hover:bg-white/15"><X size={19} /></button></header>
            <div className="relative grid gap-3 px-6 pb-5 sm:grid-cols-2 sm:px-8">{updates.map(({ icon: Icon, title, text }) => <article key={title} className="flex gap-3 rounded-2xl border border-white/[.07] bg-white/[.045] p-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#f6c6d1]/15 text-[#f6c6d1]"><Icon size={18} /></span><div><h2 className="text-sm font-black">{title}</h2><p className="mt-1 text-xs leading-relaxed text-[#cdbed2]">{text}</p></div></article>)}</div>
            <footer className="relative flex flex-col-reverse gap-3 border-t border-white/10 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8"><p className="flex items-center gap-2 text-xs text-[#b9a6c0]"><CheckCircle2 size={15} className="text-[#f6c6d1]" /> You’ll only see this once per update.</p><button onClick={onClose} className="rounded-full bg-[#f6c6d1] px-6 py-2.5 text-sm font-black text-[#281a30] transition hover:scale-[1.03]">Start listening</button></footer>
        </section>
    </div>;
}
