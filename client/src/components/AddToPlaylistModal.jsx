import { useState } from 'react';
import { Check, ListMusic, Plus, X } from 'lucide-react';
import { apiUrl } from '../lib/api';

export default function AddToPlaylistModal({ song, playlists, token, onClose, onCreatePlaylist }) {
    const [error, setError] = useState('');
    const [savedPlaylistId, setSavedPlaylistId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    if (!song) return null;

    const addSong = async (playlistId) => {
        setError('');
        setIsSaving(true);
        try {
            const response = await fetch(apiUrl(`/api/playlists/${playlistId}/songs`), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ songId: song.id }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Unable to add song to playlist.');
            setSavedPlaylistId(playlistId);
        } catch (saveError) {
            setError(saveError.message);
        } finally {
            setIsSaving(false);
        }
    };

    return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#100b15]/80 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#21162a] p-7 shadow-2xl">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#f6c6d1]">Add to playlist</p><h2 className="mt-1 truncate text-xl font-black text-white">{song.title}</h2><p className="mt-1 text-sm text-gray-400">Choose where to save this song.</p></div><button onClick={onClose} aria-label="Close" className="rounded-full p-2 text-gray-400 hover:bg-white/10 hover:text-white"><X size={20} /></button></div>
            {error && <p className="mt-5 rounded-xl border border-red-400/30 bg-red-950/40 p-3 text-sm text-red-200">{error}</p>}
            <div className="mt-6 max-h-64 space-y-2 overflow-y-auto">
                {playlists.map((playlist) => <button key={playlist.id} disabled={isSaving} onClick={() => addSong(playlist.id)} className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-left transition hover:border-[#f6c6d1]/40 hover:bg-white/10 disabled:opacity-60"><span className="flex min-w-0 items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-[#f6c6d1]/15 text-[#f6c6d1]"><ListMusic size={18} /></span><span className="truncate text-sm font-bold text-white">{playlist.title}</span></span>{savedPlaylistId === playlist.id && <Check size={18} className="text-[#f6c6d1]" />}</button>)}
                {playlists.length === 0 && <p className="rounded-xl border border-dashed border-white/15 p-5 text-center text-sm text-gray-400">Create a playlist first, then you can save songs to it.</p>}
            </div>
            <button onClick={() => { onClose(); onCreatePlaylist(); }} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#f6c6d1] hover:text-white"><Plus size={17} /> Create a new playlist</button>
        </div>
    </div>;
}
