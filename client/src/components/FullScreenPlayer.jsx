import { useContext, useEffect, useState } from 'react';
import { Heart, ListMusic, Maximize2, MonitorSpeaker, Repeat, Repeat1, SkipBack, SkipForward, Trash2, Volume2, VolumeX, X } from 'lucide-react';
import { AudioContext } from '../context/audio-state';
import { apiUrl } from '../lib/api';

const formatTime = (seconds) => !Number.isFinite(seconds) || seconds < 0 ? '0:00' : `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;

function Progress({ currentTime, duration, seekTo }) {
    return <div className="flex w-full items-center gap-3 text-[11px] font-bold tabular-nums text-[#b9a6c0]"><span>{formatTime(currentTime)}</span><input type="range" min="0" max={duration || 0} step="0.1" value={Math.min(currentTime, duration || 0)} onChange={(event) => seekTo(event.target.value)} aria-label="Song progress" className="cnx-range flex-1" /><span>{formatTime(duration)}</span></div>;
}

function RepeatButton({ repeatMode, cycleRepeatMode }) {
    const active = repeatMode !== 'off';
    return <button onClick={cycleRepeatMode} title={`Repeat: ${repeatMode}`} aria-label={`Repeat: ${repeatMode}. Change repeat mode`} className={`rounded-full p-2.5 transition ${active ? 'bg-[#f6c6d1]/15 text-[#f6c6d1]' : 'text-[#b9a6c0] hover:bg-white/10 hover:text-white'}`}>{repeatMode === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}</button>;
}

function PlaybackControls({ isPlaying, togglePlay, playNext, playPrevious, large = false, showRepeat = true }) {
    const { repeatMode, cycleRepeatMode } = useContext(AudioContext);
    return <div className={`flex items-center justify-center ${large ? 'gap-5 sm:gap-7' : 'gap-3'}`}>
        {showRepeat && <RepeatButton repeatMode={repeatMode} cycleRepeatMode={cycleRepeatMode} />}
        <button onClick={playPrevious} aria-label="Previous track" className="rounded-full p-2.5 text-[#d8c5de] transition hover:bg-white/10 hover:text-white"><SkipBack size={large ? 25 : 18} fill="currentColor" /></button>
        <button onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'} className={`grid place-items-center rounded-full bg-[#f6c6d1] text-[#291b31] shadow-[0_14px_32px_rgba(246,198,209,.26)] transition hover:scale-105 ${large ? 'h-[68px] w-[68px]' : 'h-10 w-10'}`}>
            {isPlaying ? <span aria-hidden="true" className={`flex gap-1 ${large ? 'h-6' : 'h-3.5'}`}><i className="block h-full w-[3px] rounded-sm bg-current" /><i className="block h-full w-[3px] rounded-sm bg-current" /></span> : <span aria-hidden="true" className={`ml-1 block h-0 w-0 border-y-transparent border-l-current ${large ? 'border-y-[12px] border-l-[17px]' : 'border-y-[7px] border-l-[10px]'}`} />}
        </button>
        <button onClick={playNext} aria-label="Next track" className="rounded-full p-2.5 text-[#d8c5de] transition hover:bg-white/10 hover:text-white"><SkipForward size={large ? 25 : 18} fill="currentColor" /></button>
    </div>;
}

function QueueRows({ queue, removeFromQueue, playQueueSong, onChoose }) {
    if (!queue.length) return <div className="grid min-h-44 place-items-center rounded-2xl border border-dashed border-white/10 bg-white/[.025] p-6 text-center"><div><ListMusic className="mx-auto mb-3 text-[#f6c6d1]" size={27} /><p className="text-sm font-bold text-[#e5d8e9]">Your queue is clear</p><p className="mt-1 text-xs text-[#a997b1]">Add songs to keep the vibe going.</p></div></div>;
    return <div className="space-y-1">{queue.map((song, index) => <div key={`${song.id}-${index}`} className="group flex items-center gap-2 rounded-xl p-2 transition hover:bg-white/[.07]"><button onClick={() => { playQueueSong(index); onChoose?.(); }} className="flex min-w-0 flex-1 items-center gap-3 text-left"><span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-white/5 text-xs font-bold text-[#f6c6d1]">{song.cover_path ? <img src={song.cover_path} alt="" className="h-full w-full object-cover" /> : index + 1}</span><span className="min-w-0"><b className="block truncate text-sm text-white">{song.title}</b><small className="block truncate text-xs text-[#b9a6c0]">{song.artist}</small></span></button><button onClick={() => removeFromQueue(index)} aria-label={`Remove ${song.title} from queue`} className="rounded-lg p-2 text-[#a997b1] opacity-100 hover:bg-white/10 hover:text-[#f6c6d1] sm:opacity-0 sm:group-hover:opacity-100"><X size={16} /></button></div>)}</div>;
}

function QueuePanel({ queue, onClose, removeFromQueue, clearQueue, playQueueSong }) {
    return <><button onClick={onClose} aria-label="Close queue" className="fixed inset-0 z-40 cursor-default bg-black/30" /><aside className="fixed bottom-[116px] right-3 z-50 flex max-h-[min(570px,calc(100vh-139px))] w-[min(380px,calc(100vw-24px))] flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#201728]/[.98] text-white shadow-2xl backdrop-blur-xl"><div className="flex items-center justify-between border-b border-white/10 px-5 py-4"><div><h2 className="font-black">Queue</h2><p className="text-xs text-[#b9a6c0]">{queue.length ? `${queue.length} song${queue.length === 1 ? '' : 's'} up next` : 'Nothing queued yet'}</p></div><button onClick={onClose} aria-label="Close queue" className="rounded-lg p-2 text-[#c8b7ce] hover:bg-white/10 hover:text-white"><X size={18} /></button></div><div className="min-h-0 flex-1 overflow-y-auto p-3"><QueueRows queue={queue} removeFromQueue={removeFromQueue} playQueueSong={playQueueSong} onChoose={onClose} /></div>{queue.length > 0 && <button onClick={clearQueue} className="m-3 inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-[#d9cadf] hover:bg-white/10 hover:text-white"><Trash2 size={15} /> Clear queue</button>}</aside></>;
}

export default function FullScreenPlayer() {
    const { currentSong, isPlaying, togglePlay, currentTime, duration, seekTo, volume, setAudioVolume, queue, removeFromQueue, clearQueue, playQueueSong, playNext, playPrevious } = useContext(AudioContext);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isQueueOpen, setIsQueueOpen] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [isLikeLoading, setIsLikeLoading] = useState(false);
    const token = localStorage.getItem('cnxify_token');

    useEffect(() => {
        const closeOnEscape = (event) => { if (event.key === 'Escape') { setIsExpanded(false); setIsQueueOpen(false); } };
        window.addEventListener('keydown', closeOnEscape);
        return () => window.removeEventListener('keydown', closeOnEscape);
    }, []);
    useEffect(() => {
        if (!currentSong?.id || !token) { setIsLiked(false); return; }
        fetch(apiUrl('/api/liked-songs'), { headers: { Authorization: `Bearer ${token}` } })
            .then((response) => (response.ok ? response.json() : []))
            .then((songs) => setIsLiked(songs.some((song) => String(song.id) === String(currentSong.id))))
            .catch(() => setIsLiked(false));
    }, [currentSong?.id, token]);

    const toggleLike = async () => {
        if (!currentSong?.id || !token || isLikeLoading) return;
        setIsLikeLoading(true);
        try {
            const response = await fetch(apiUrl(`/api/songs/${currentSong.id}/like`), { method: isLiked ? 'DELETE' : 'POST', headers: { Authorization: `Bearer ${token}` } });
            if (!response.ok) throw new Error();
            setIsLiked((liked) => !liked);
        } finally { setIsLikeLoading(false); }
    };

    if (!currentSong) return null;
    const controls = <PlaybackControls isPlaying={isPlaying} togglePlay={togglePlay} playNext={playNext} playPrevious={playPrevious} />;
    const cover = currentSong.cover_path;

    if (isExpanded) return <section className="fixed inset-0 z-[60] isolate overflow-hidden bg-[#160f1c] text-white">
        {cover && <><img src={cover} alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 -z-20 h-full w-full scale-110 object-cover opacity-25 blur-[90px]" /><div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_15%,rgba(115,70,125,.52),transparent_48%),linear-gradient(135deg,rgba(20,12,27,.92),rgba(28,18,36,.97)_45%,rgba(15,10,19,.98))]" /></>}
        <header className="relative z-20 flex h-[73px] items-center justify-between border-b border-white/[.08] bg-[#1a1220]/75 px-5 py-4 backdrop-blur-xl sm:px-8">
            <div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-[#f6c6d1] font-black tracking-tight text-[#2b1a32]">C</div><div><p className="text-xs font-black tracking-[.2em] text-[#ffd6df]">CNXIFY</p><p className="mt-0.5 text-xs text-[#d9cadf]">Now playing</p></div></div>
            <div className="flex items-center gap-2"><span className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#d9cadf] sm:block">Press Esc to close</span><button onClick={() => setIsExpanded(false)} aria-label="Close expanded player" className="grid h-10 w-10 place-items-center rounded-full bg-white/[.06] text-white transition hover:bg-[#f6c6d1] hover:text-[#281a30]"><X size={20} /></button></div>
        </header>
        <main className="mx-auto grid h-[calc(100dvh-73px)] w-full max-w-[1450px] gap-5 overflow-hidden px-5 py-5 sm:px-8 lg:grid-cols-[minmax(280px,440px)_minmax(300px,500px)_minmax(240px,340px)] lg:items-center lg:gap-8 lg:py-7">
            <div className="mx-auto w-full max-w-[min(440px,54vh)]"><div className="relative aspect-square overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-[0_30px_80px_rgba(0,0,0,.42)]">{cover ? <img src={cover} alt={`${currentSong.title} cover`} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center bg-gradient-to-br from-[#6f4a7a] to-[#211529] text-7xl font-black text-[#f6c6d1]/40">C</div>}<div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/35 to-transparent" /></div></div>
            <section className="mx-auto flex w-full max-w-[500px] flex-col justify-center">
                <p className="text-xs font-black uppercase tracking-[.2em] text-[#f6c6d1]">Now playing</p>
                <div className="mt-3 flex items-start justify-between gap-4"><div className="min-w-0"><h1 className="break-words text-3xl font-black leading-[.96] tracking-tight sm:text-5xl">{currentSong.title}</h1><p className="mt-3 truncate text-base text-[#e1d5e5]">{currentSong.artist}</p>{currentSong.album && <p className="mt-1 truncate text-sm text-[#aa98b2]">{currentSong.album}</p>}</div><button onClick={toggleLike} disabled={isLikeLoading} aria-label={isLiked ? 'Remove from liked songs' : 'Add to liked songs'} className={`grid h-12 w-12 shrink-0 place-items-center rounded-full border transition ${isLiked ? 'border-[#f6c6d1] bg-[#f6c6d1] text-[#281a30]' : 'border-white/10 bg-white/[.07] text-[#ffd6df] hover:bg-white/15'}`}><Heart size={22} fill={isLiked ? 'currentColor' : 'none'} /></button></div>
                <div className="mt-7"><Progress currentTime={currentTime} duration={duration} seekTo={seekTo} /></div>
                <div className="mt-5"><PlaybackControls isPlaying={isPlaying} togglePlay={togglePlay} playNext={playNext} playPrevious={playPrevious} large showRepeat={false} /></div>
            </section>
            <div className="mx-auto flex w-full max-w-[340px] flex-col gap-3"><aside className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#211727]/65 p-4 shadow-2xl backdrop-blur-xl lg:max-h-[min(500px,calc(100dvh-210px))]"><div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[.16em] text-[#f6c6d1]">Up next</p><p className="mt-1 text-xs text-[#b9a6c0]">{queue.length ? `${queue.length} queued ${queue.length === 1 ? 'song' : 'songs'}` : 'Nothing queued yet'}</p></div>{queue.length > 0 && <button onClick={clearQueue} title="Clear queue" className="rounded-lg p-2 text-[#b9a6c0] hover:bg-white/10 hover:text-[#f6c6d1]"><Trash2 size={17} /></button>}</div><div className="max-h-[350px] overflow-y-auto pr-1"><QueueRows queue={queue} removeFromQueue={removeFromQueue} playQueueSong={playQueueSong} /></div></aside><div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#211727]/75 px-4 py-3 shadow-xl backdrop-blur-xl"><button onClick={() => setAudioVolume(volume === 0 ? 0.7 : 0)} aria-label={volume === 0 ? 'Unmute' : 'Mute'} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/5 text-[#f6c6d1] hover:bg-white/10">{volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}</button><div className="min-w-0 flex-1"><p className="mb-1 text-[10px] font-black uppercase tracking-[.14em] text-[#cdb9d3]">Volume</p><input type="range" min="0" max="1" step="0.01" value={volume} onChange={(event) => setAudioVolume(event.target.value)} aria-label="Volume" className="cnx-range w-full" /></div><span className="w-7 text-right text-xs font-bold text-[#f6c6d1]">{Math.round(volume * 100)}</span></div></div>
        </main>
    </section>;

    return <><section className="fixed bottom-0 left-0 right-0 z-30 h-[104px] border-t border-white/10 bg-[#130e18]/98 px-3 text-white shadow-[0_-12px_35px_rgba(0,0,0,.22)] backdrop-blur-xl md:px-5"><div className="mx-auto grid h-full max-w-[1900px] grid-cols-[minmax(120px,1fr)_minmax(210px,2fr)_auto] items-center gap-3 sm:grid-cols-[minmax(180px,1fr)_minmax(320px,2fr)_minmax(180px,1fr)] sm:gap-5"><div className="flex min-w-0 items-center gap-3"><div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white/5 sm:h-14 sm:w-14">{cover && <img src={cover} alt="" className="h-full w-full object-cover" />}</div><div className="min-w-0"><p className="truncate text-[13px] font-bold text-white">{currentSong.title}</p><p className="truncate text-[11px] text-[#b9a6c0]">{currentSong.artist}</p></div></div><div className="mx-auto grid w-full max-w-[680px] grid-rows-[40px_18px] content-center gap-1"><div className="flex items-center justify-center">{controls}</div><Progress currentTime={currentTime} duration={duration} seekTo={seekTo} /></div><div className="flex items-center justify-end gap-1 text-[#c8b7ce] sm:gap-2"><button onClick={() => setIsQueueOpen((open) => !open)} aria-label="Open queue" title="Open queue" className="relative rounded-md p-2 hover:bg-white/10 hover:text-white"><ListMusic size={17} />{queue.length > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#f6c6d1] px-1 text-[9px] font-black text-[#281a30]">{queue.length}</span>}</button><button aria-label="Select output device" className="hidden rounded-md p-2 hover:bg-white/10 hover:text-white lg:block"><MonitorSpeaker size={17} /></button><div className="hidden items-center gap-2 lg:flex">{volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}<input type="range" min="0" max="1" step="0.01" value={volume} onChange={(event) => setAudioVolume(event.target.value)} aria-label="Volume" className="cnx-range w-24" /></div><button onClick={() => setIsExpanded(true)} aria-label="Open expanded player" className="rounded-md p-2 hover:bg-white/10 hover:text-white"><Maximize2 size={17} /></button></div></div></section>{isQueueOpen && <QueuePanel queue={queue} onClose={() => setIsQueueOpen(false)} removeFromQueue={removeFromQueue} clearQueue={clearQueue} playQueueSong={playQueueSong} />}</>;
}
