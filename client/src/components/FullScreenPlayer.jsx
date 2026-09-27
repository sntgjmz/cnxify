import { useContext, useEffect, useState } from 'react';
import { AudioContext } from '../context/audio-state';
import { Heart, ListMusic, Maximize2, MonitorSpeaker, SkipBack, SkipForward, Volume2, VolumeX, X } from 'lucide-react';

const formatTime = (seconds) => {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
};

function Progress({ currentTime, duration, seekTo }) {
    return <div className="flex w-full items-center gap-3 text-xs font-semibold text-[#b9a6c0]"><span>{formatTime(currentTime)}</span><input type="range" min="0" max={duration || 0} step="0.1" value={Math.min(currentTime, duration || 0)} onChange={(event) => seekTo(event.target.value)} aria-label="Song progress" className="cnx-range flex-1" /><span>{formatTime(duration)}</span></div>;
}

function PlaybackControls({ isPlaying, togglePlay, large = false }) {
    return <div className="flex items-center justify-center gap-7"><button aria-label="Previous track" className="text-[#baa8c3] hover:text-white"><SkipBack size={large ? 23 : 18} fill="currentColor" /></button><button onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'} className={`grid place-items-center rounded-full bg-[#f6c6d1] text-[#291b31] shadow-[0_12px_24px_rgba(246,198,209,0.2)] transition hover:scale-105 ${large ? 'h-14 w-14' : 'h-10 w-10'}`}>{isPlaying ? <span aria-hidden="true" className={`flex gap-1 ${large ? 'h-5' : 'h-3.5'}`}><i className="block h-full w-[3px] rounded-sm bg-current" /><i className="block h-full w-[3px] rounded-sm bg-current" /></span> : <span aria-hidden="true" className={`ml-0.5 block h-0 w-0 border-y-transparent border-l-current ${large ? 'border-y-[10px] border-l-[14px]' : 'border-y-[7px] border-l-[10px]'}`} />}</button><button aria-label="Next track" className="text-[#baa8c3] hover:text-white"><SkipForward size={large ? 23 : 18} fill="currentColor" /></button></div>;
}

export default function FullScreenPlayer() {
    const { currentSong, isPlaying, togglePlay, currentTime, duration, seekTo, volume, setAudioVolume } = useContext(AudioContext);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        const closeOnEscape = (event) => { if (event.key === 'Escape') setIsExpanded(false); };
        window.addEventListener('keydown', closeOnEscape);
        return () => window.removeEventListener('keydown', closeOnEscape);
    }, []);

    if (!currentSong) return null;
    const toggleExpanded = () => setIsExpanded((value) => !value);

    if (isExpanded) return <section className="fixed inset-0 z-[60] overflow-y-auto bg-[radial-gradient(circle_at_top,#4a3553_0%,#251b2d_42%,#17111e_100%)] text-white">
        <header className="absolute left-6 right-6 top-6 z-10 flex items-start justify-between md:left-12 md:right-12"><div><p className="text-xs font-black tracking-[0.22em] text-[#ffd6df]">CNXIFY</p><p className="mt-1 text-sm text-[#e0d3e4]">Now playing</p></div><button onClick={toggleExpanded} aria-label="Close expanded player" className="grid h-11 w-11 place-items-center rounded-full bg-black/20 text-white hover:bg-white/10"><X size={21} /></button></header>
        <main className="mx-auto flex min-h-screen w-full max-w-[540px] flex-col justify-center px-6 py-28"><div className="aspect-square overflow-hidden rounded-3xl bg-white/5 shadow-[0_28px_80px_rgba(0,0,0,0.4)]">{currentSong.cover_path && <img src={currentSong.cover_path} alt={`${currentSong.title} cover`} className="h-full w-full object-cover" />}</div><div className="mt-7 flex items-end justify-between gap-4"><div className="min-w-0"><h1 className="truncate text-2xl font-black tracking-tight sm:text-3xl">{currentSong.title}</h1><p className="mt-1 truncate text-sm text-[#dacbdf]">{currentSong.artist}{currentSong.album ? ` · ${currentSong.album}` : ''}</p></div><button aria-label="Like song" className="shrink-0 text-[#ffd6df] hover:text-white"><Heart size={25} /></button></div><div className="mt-8"><Progress currentTime={currentTime} duration={duration} seekTo={seekTo} /></div><div className="mt-6"><PlaybackControls isPlaying={isPlaying} togglePlay={togglePlay} large /></div></main>
        <p className="absolute bottom-7 left-0 right-0 text-center text-xs text-[#b9a6c0]">Press Esc or close to return to CNXify</p>
    </section>;

    return <section className="fixed bottom-0 left-0 right-0 z-30 h-[90px] border-t border-white/10 bg-[#130e18]/98 px-3 text-white shadow-[0_-12px_35px_rgba(0,0,0,0.22)] backdrop-blur-xl md:px-5"><div className="mx-auto grid h-full max-w-[1900px] grid-cols-[minmax(180px,1fr)_minmax(320px,2fr)_minmax(180px,1fr)] items-center gap-5"><div className="flex min-w-0 items-center gap-3"><div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-white/5">{currentSong.cover_path && <img src={currentSong.cover_path} alt="" className="h-full w-full object-cover" />}</div><div className="min-w-0"><p className="truncate text-[13px] font-bold text-white">{currentSong.title}</p><p className="truncate text-[11px] text-[#b9a6c0]">{currentSong.artist}</p></div></div><div className="mx-auto flex w-full max-w-[680px] flex-col gap-2"><PlaybackControls isPlaying={isPlaying} togglePlay={togglePlay} /><Progress currentTime={currentTime} duration={duration} seekTo={seekTo} /></div><div className="flex items-center justify-end gap-2 text-[#c8b7ce]"><button aria-label="Open queue" className="hidden rounded-md p-2 hover:bg-white/10 hover:text-white md:block"><ListMusic size={17} /></button><button aria-label="Select output device" className="hidden rounded-md p-2 hover:bg-white/10 hover:text-white lg:block"><MonitorSpeaker size={17} /></button><div className="hidden items-center gap-2 lg:flex">{volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}<input type="range" min="0" max="1" step="0.01" value={volume} onChange={(event) => setAudioVolume(event.target.value)} aria-label="Volume" className="cnx-range w-24" /></div><button onClick={toggleExpanded} aria-label="Open expanded player" className="rounded-md p-2 hover:bg-white/10 hover:text-white"><Maximize2 size={17} /></button></div></div></section>;
}
