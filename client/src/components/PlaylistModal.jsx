// client/src/components/PlaylistModal.jsx
import { useEffect, useState } from 'react';
import { Check, ChevronDown, ImagePlus, Music, Users, Lock, X } from 'lucide-react';
import { apiUrl } from '../lib/api';

export default function PlaylistModal({ isOpen, onClose, token, playlist, onPlaylistCreated, onPlaylistUpdated }) {
    const [title, setTitle] = useState('');
    const [isPublic, setIsPublic] = useState(true);
    const [error, setError] = useState('');
    const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [coverFile, setCoverFile] = useState(null);
    const [coverPreview, setCoverPreview] = useState('');

    useEffect(() => {
        if (!isOpen) return;
        setTitle(playlist?.title || '');
        setDescription(playlist?.description || '');
        setIsPublic(playlist ? Boolean(playlist.is_public) : true);
        setError('');
        setIsPrivacyOpen(false);
        setCoverFile(null);
        setCoverPreview(playlist?.cover_path ? apiUrl(playlist.cover_path) : '');
    }, [isOpen, playlist]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setError('');

        if (!title.trim()) return setError('Playlist title is required');

        setIsSubmitting(true);
        try {
            const editing = Boolean(playlist);
            const body = new FormData();
            body.append('title', title.trim()); body.append('description', description.trim()); body.append('is_public', String(isPublic));
            if (coverFile) body.append('cover', coverFile);
            const res = await fetch(apiUrl(editing ? `/api/playlists/${playlist.id}` : '/api/playlists'), {
                method: editing ? 'PUT' : 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to create playlist');

            if (editing) onPlaylistUpdated(data); else onPlaylistCreated(data);
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[#100b15]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#21162a] p-7 rounded-3xl w-full max-w-md border border-white/10 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Music className="text-[#f6c6d1]" /> {playlist ? 'Edit Playlist' : 'Create Playlist'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {error && <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded mb-4 text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Playlist Name</label>
                        <input 
                            type="text" 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="My Awesome Mix..."
                            className="w-full p-3 bg-white/5 text-white rounded-xl border border-white/10 focus:border-[#f6c6d1] outline-none"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Description <span className="font-normal normal-case text-gray-600">(optional)</span></label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} rows={2} placeholder="What is this playlist for?" className="w-full resize-none rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-[#f6c6d1]" />
                    </div>
                    
                    <div className="relative">
                        <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Privacy</label>
                        <button type="button" onClick={() => setIsPrivacyOpen((open) => !open)} aria-haspopup="listbox" aria-expanded={isPrivacyOpen} className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 text-left text-sm text-white transition hover:border-[#f6c6d1]/50">
                            <span className="flex items-center gap-2">{isPublic ? <Users size={16} className="text-[#f6c6d1]" /> : <Lock size={16} className="text-[#f6c6d1]" />}{isPublic ? 'Public · Visible to all colleagues' : 'Private · Only visible to you'}</span><ChevronDown size={17} className={`text-[#f6c6d1] transition-transform ${isPrivacyOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isPrivacyOpen && <div role="listbox" className="absolute z-10 mt-2 w-full overflow-hidden rounded-xl border border-white/10 bg-[#2c2036] p-1.5 shadow-2xl">
                            <button type="button" role="option" aria-selected={isPublic} onClick={() => { setIsPublic(true); setIsPrivacyOpen(false); }} className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm text-white hover:bg-white/10"><span className="flex items-center gap-2"><Users size={16} className="text-[#f6c6d1]" />Public · Visible to all colleagues</span>{isPublic && <Check size={16} className="text-[#f6c6d1]" />}</button>
                            <button type="button" role="option" aria-selected={!isPublic} onClick={() => { setIsPublic(false); setIsPrivacyOpen(false); }} className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm text-white hover:bg-white/10"><span className="flex items-center gap-2"><Lock size={16} className="text-[#f6c6d1]" />Private · Only visible to you</span>{!isPublic && <Check size={16} className="text-[#f6c6d1]" />}</button>
                        </div>}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Playlist cover <span className="font-normal normal-case text-gray-600">(optional)</span></label>
                        <div className="flex items-center gap-4"><div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#4a395c] text-[#f6c6d1]">{coverPreview ? <img src={coverPreview} alt="Playlist cover preview" className="h-full w-full object-cover" /> : <Music size={28} />}</div><label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-[#f6c6d1] transition hover:bg-white/10"><ImagePlus size={17} /> Choose image<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { const file = event.target.files?.[0] || null; setCoverFile(file); setCoverPreview(file ? URL.createObjectURL(file) : (playlist?.cover_path ? apiUrl(playlist.cover_path) : '')); }} /></label></div>
                    </div>

                    <div className="flex justify-end gap-3 mt-4">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-gray-400 hover:text-white transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-[#f6c6d1] text-[#281a30] text-sm font-bold rounded-full hover:bg-white transition-colors hover:scale-105 disabled:cursor-wait disabled:opacity-60">
                            {isSubmitting ? 'Saving…' : playlist ? 'Save changes' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
