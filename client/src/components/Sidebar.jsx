// client/src/components/Sidebar.jsx
import { Disc3, Home, Search, Library, ShieldAlert, PlusSquare, Heart, LogOut, MessageCircle, Mic2, UserCircle } from 'lucide-react';
import { apiUrl } from '../lib/api';

export default function Sidebar({ userRole, onNavigate, currentView, onOpenNewPlaylist, onOpenChat, unreadMessages, onLogout, playlists, followedArtists, onPlayPlaylist, onSelectArtist, onOpenProfile }) {
    const navItemClass = (view) => `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors font-medium text-sm ${currentView === view ? 'bg-[#f6c6d1] text-[#281a30] shadow-sm' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`;

    return (
        <aside className="w-60 bg-[#120d16] h-screen py-7 flex flex-col justify-between fixed left-0 top-0 border-r border-white/5 select-none text-gray-300">
            <div className="flex flex-col gap-6">
                {/* Logo */}
                <h3 
                    className="text-xl font-bold text-[#f2cdd6] tracking-wide px-6 cursor-pointer flex items-center gap-2" 
                    onClick={() => onNavigate('home')}
                >
                    <span className="bg-[#f6c6d1] text-[#1c1423] p-1.5 rounded-xl"><Mic2 size={16} /></span>
                    CNXify
                </h3>

                {/* Main Nav Links */}
                <nav className="flex flex-col gap-1 px-2">
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
                    <button onClick={onOpenProfile} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-colors font-medium text-sm"><UserCircle size={20} /> My profile</button>
                    <button onClick={onOpenChat} className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-colors font-medium text-sm">
                        <span className="flex items-center gap-3"><MessageCircle size={20} /> Colleague chat</span>
                        {unreadMessages > 0 && <span className="grid min-w-5 h-5 place-items-center rounded-full bg-[#f6c6d1] px-1 text-[11px] font-black text-[#281a30]">{unreadMessages > 99 ? '99+' : unreadMessages}</span>}
                    </button>
                </nav>

                <div className="mx-5 my-1 border-t border-white/10" />

                <div className="flex flex-col gap-1 px-2">
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

                <div className="mx-5 my-1 border-t border-white/10" />

                <div className="flex flex-col gap-1 px-2">
                    <p className="px-4 pb-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#cdb8d2]">Playlists</p>
                    {playlists.slice(0, 5).map((playlist) => <button key={playlist.id} onClick={() => onPlayPlaylist(playlist)} className="flex items-center gap-3 rounded-xl px-4 py-2 text-left text-sm font-medium text-gray-400 transition hover:bg-white/5 hover:text-white"><Disc3 size={16} className="text-[#f6c6d1]/70" /><span className="truncate">{playlist.title}</span></button>)}
                    {playlists.length === 0 && <p className="px-4 py-1 text-xs text-gray-600">No playlists yet</p>}
                </div>

                <div className="mx-5 my-1 border-t border-white/10" />

                <div className="flex flex-col gap-1 px-2">
                    <p className="px-4 pb-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#cdb8d2]">Following</p>
                    {followedArtists.slice(0, 5).map((artist) => <button key={artist.artist_name} onClick={() => onSelectArtist(artist.artist_name)} className="flex items-center gap-3 rounded-xl px-4 py-1.5 text-left text-sm font-medium text-gray-300 transition hover:bg-white/5 hover:text-white"><span className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-[#f6c6d1]/15">{artist.cover_path && <img src={apiUrl(artist.cover_path)} alt="" className="h-full w-full object-cover" />}</span><span className="truncate">{artist.artist_name}</span></button>)}
                    {followedArtists.length === 0 && <p className="px-4 py-1 text-xs text-gray-600">Follow artists to see them here</p>}
                </div>
            </div>

            <div className="px-6 pb-32 flex flex-col gap-3">
                {userRole === 'ADMIN' && (
                    <button 
                        onClick={() => onNavigate('admin')}
                        className="flex items-center gap-2 text-xs font-bold text-[#ffdbe2] bg-[#f6c6d1]/10 p-2.5 rounded-xl border border-[#f6c6d1]/25 hover:bg-[#f6c6d1]/20 transition-colors"
                    >
                        <ShieldAlert size={14} /> Admin Portal
                    </button>
                )}
                <button onClick={onLogout} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-400 transition hover:bg-white/5 hover:text-[#ffdbe2]">
                    <LogOut size={15} /> Leave CNXify
                </button>
            </div>
        </aside>
    );
}
