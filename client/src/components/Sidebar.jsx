// client/src/components/Sidebar.jsx
import { Disc3, Home, Search, Library, ShieldAlert, PlusSquare, Heart, MessageCircle, Mic2, UserCircle, UploadCloud } from 'lucide-react';
import { apiUrl } from '../lib/api';

export default function Sidebar({ userRole, onlineCount, onOpenUpload, onNavigate, currentView, onOpenNewPlaylist, onOpenChat, unreadMessages, playlists, followedArtists, onPlayPlaylist, onSelectArtist, onOpenProfile }) {
    const navItemClass = (view) => `flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all font-semibold text-sm ${currentView === view ? 'bg-[#f6c6d1] text-[#281a30] shadow-[0_8px_22px_rgba(246,198,209,0.14)]' : 'text-[#bbaec1] hover:bg-white/7 hover:text-white'}`;

    return (
        <aside className="cnx-sidebar fixed left-0 top-0 flex h-screen w-64 flex-col border-r border-white/10 bg-[linear-gradient(180deg,#17101d_0%,#110c15_100%)] py-5 text-gray-300 shadow-[12px_0_40px_rgba(0,0,0,0.16)]">
            <div className="min-h-0 flex-1 overflow-y-auto">
                {/* Logo */}
                <h3 
                    className="mx-3 flex cursor-pointer items-center gap-2 rounded-2xl px-3 py-3 text-xl font-black tracking-tight text-white hover:bg-white/5" 
                    onClick={() => onNavigate('home')}
                >
                    <span className="rounded-xl bg-[#f6c6d1] p-2 text-[#1c1423] shadow-lg"><Mic2 size={17} /></span>
                    CNXify
                </h3>

                {/* Main Nav Links */}
                <nav className="mt-5 flex flex-col gap-1 px-3">
                    <button onClick={() => onNavigate('home')} className={navItemClass('home')}>
                        <Home size={20} /> Home
                    </button>
                    <button onClick={() => onNavigate('search')} className={navItemClass('search')}>
                        <Search size={20} /> Search
                    </button>
                    <button onClick={() => onNavigate('library')} className={navItemClass('library')}>
                        <Library size={20} /> Your Library
                    </button>
                    <button onClick={() => onNavigate('artists')} className={navItemClass('artists')}>
                        <Mic2 size={20} /> Artists
                    </button>
                    <button onClick={onOpenProfile} className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#bbaec1] transition hover:bg-white/7 hover:text-white"><UserCircle size={20} /> My profile</button>
                    <button onClick={onOpenChat} className="flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#bbaec1] transition hover:bg-white/7 hover:text-white">
                        <span className="flex items-center gap-3"><MessageCircle size={20} /> Colleague chat</span>
                        {unreadMessages > 0 && <span className="grid min-w-5 h-5 place-items-center rounded-full bg-[#f6c6d1] px-1 text-[11px] font-black text-[#281a30]">{unreadMessages > 99 ? '99+' : unreadMessages}</span>}
                    </button>
                    {userRole === 'ADMIN' && <button onClick={() => onNavigate('admin')} className={navItemClass('admin')}><ShieldAlert size={20} /> Admin Portal</button>}
                </nav>

                <div className="mx-3 mt-5 rounded-2xl border border-white/10 bg-white/[.04] p-3.5">
                    <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2 text-xs font-bold text-[#d9cadf]"><span className="h-2 w-2 animate-pulse rounded-full bg-[#f6c6d1]" /> Live now</span>
                        <span className="text-sm font-black text-white">{onlineCount}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-[#9f8ca7]">colleagues online</p>
                    {userRole === 'ADMIN' && <button onClick={onOpenUpload} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#f6c6d1] px-3 py-2 text-xs font-black text-[#281a30] transition hover:bg-white"><UploadCloud size={15} /> Upload music</button>}
                </div>

                <div className="mx-5 my-5 border-t border-white/10" />

                <div className="flex flex-col gap-1 px-3">
                    <p className="px-4 pb-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#cdb8d2]">Your music</p>
                    <button onClick={onOpenNewPlaylist} className="flex items-center gap-4 px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm font-medium text-left">
                        <div className="bg-[#f6c6d1]/20 p-1 rounded text-[#f6c6d1]">
                            <PlusSquare size={16} />
                        </div> 
                        Create playlist
                    </button>
                    <button onClick={() => onNavigate('liked')} className="flex items-center gap-4 px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm font-medium text-left">
                        <div className="bg-gradient-to-br from-indigo-400 to-[#f2cdd6] p-1 rounded text-white">
                            <Heart size={16} fill="currentColor" />
                        </div> 
                        Liked Songs
                    </button>
                </div>

                <div className="mx-5 my-5 border-t border-white/10" />

                <div className="flex flex-col gap-1 px-3">
                    <p className="px-4 pb-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#cdb8d2]">Playlists</p>
                    {playlists.slice(0, 5).map((playlist) => <button key={playlist.id} onClick={() => onPlayPlaylist(playlist)} className="flex items-center gap-3 rounded-xl px-4 py-2 text-left text-sm font-medium text-gray-400 transition hover:bg-white/5 hover:text-white"><span className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-md bg-[#f6c6d1]/15">{playlist.cover_path ? <img src={apiUrl(playlist.cover_path)} alt="" className="h-full w-full object-cover" /> : <Disc3 size={16} className="text-[#f6c6d1]/70" />}</span><span className="truncate">{playlist.title}</span></button>)}
                    {playlists.length === 0 && <p className="px-4 py-1 text-xs text-gray-600">No playlists yet</p>}
                </div>

                <div className="mx-5 my-5 border-t border-white/10" />

                <div className="flex flex-col gap-1 px-3 pb-5">
                    <p className="px-4 pb-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#cdb8d2]">Following</p>
                    {followedArtists.slice(0, 5).map((artist) => <button key={artist.artist_name} onClick={() => onSelectArtist(artist.artist_name)} className="flex items-center gap-3 rounded-xl px-4 py-1.5 text-left text-sm font-medium text-gray-300 transition hover:bg-white/5 hover:text-white"><span className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-[#f6c6d1]/15">{artist.cover_path && <img src={apiUrl(artist.cover_path)} alt="" className="h-full w-full object-cover" />}</span><span className="truncate">{artist.artist_name}</span></button>)}
                    {followedArtists.length === 0 && <p className="px-4 py-1 text-xs text-gray-600">Follow artists to see them here</p>}
                </div>
            </div>
        </aside>
    );
}
