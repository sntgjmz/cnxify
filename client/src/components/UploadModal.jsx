// client/src/components/UploadModal.jsx
import { useState } from 'react';
import { X, UploadCloud, Music, Image as ImageIcon, User, Disc } from 'lucide-react';
import { apiUrl } from '../lib/api';

export default function UploadModal({ isOpen, onClose, token, onUploadComplete }) {
    const [artist, setArtist] = useState('');
    const [album, setAlbum] = useState('');
    const [audioFiles, setAudioFiles] = useState([]);
    const [coverFile, setCoverFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (audioFiles.length === 0) {
            return setError('Please select at least one MP3 file.');
        }

        setIsLoading(true);
        setProgress(0);

        let sharedCoverPath = null;

        try {
            for (let i = 0; i < audioFiles.length; i++) {
                const file = audioFiles[i];
                const formData = new FormData();
                
                // Clean up filename: remove extension, replace underscores with spaces, strip web watermarks
                const rawName = file.name.replace(/\.[^/.]+$/, "");
                const trackTitle = rawName
                    .replace(/_spotdown\.org/gi, '')
                    .replace(/_/g, ' ')
                    .trim();
                
                formData.append('title', trackTitle);
                formData.append('artist', artist);
                formData.append('album', album || 'Unknown Album');
                formData.append('audio', file);
                
                // Only send the physical cover file on the FIRST song. 
                // For subsequent songs, send the shared cover path string to save storage.
                if (i === 0 && coverFile) {
                    formData.append('cover', coverFile);
                } else if (sharedCoverPath) {
                    formData.append('cover_path', sharedCoverPath);
                }

                const res = await fetch(apiUrl('/api/songs'), {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });

                const contentType = res.headers.get("content-type");
                if (!contentType || !contentType.includes("application/json")) {
                    const htmlText = await res.text();
                    console.error("Server returned HTML:", htmlText);
                    throw new Error("Server error (500/404). Check your backend terminal.");
                }

                const data = await res.json();
                if (!res.ok) throw new Error(data.error || `Failed to upload ${trackTitle}`);

                // Capture the cover path from the first successful upload response
                if (i === 0 && data.cover_path) {
                    sharedCoverPath = data.cover_path;
                }

                onUploadComplete(data);
                setProgress(Math.round(((i + 1) / audioFiles.length) * 100));
            }

            // Reset and close
            setArtist('');
            setAlbum('');
            setAudioFiles([]);
            setCoverFile(null);
            setProgress(0);
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[#150f1a]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#21182a] p-8 rounded-3xl w-full max-w-md border border-[#3b2d47] shadow-2xl">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-black text-white flex items-center gap-3">
                        <UploadCloud className="text-[#f2cdd6]" size={28} /> Bulk Upload
                    </h2>
                    <button onClick={onClose} disabled={isLoading} className="text-gray-400 hover:text-white bg-[#342742] p-2 rounded-full transition-colors disabled:opacity-50">
                        <X size={20} />
                    </button>
                </div>

                {error && <div className="bg-red-950/50 border border-red-900 text-red-200 p-3 rounded-xl mb-6 text-sm font-medium">{error}</div>}

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    
                    <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#f2cdd6] transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder="Artist Name" 
                            value={artist}
                            onChange={(e) => setArtist(e.target.value)}
                            disabled={isLoading}
                            className="w-full bg-[#150f1a] text-white pl-12 pr-4 py-3.5 rounded-xl border border-[#3b2d47] focus:border-[#f2cdd6] outline-none transition-colors text-sm font-medium disabled:opacity-50"
                            required
                        />
                    </div>

                    <div className="relative group">
                        <Disc className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#f2cdd6] transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder="Album Name" 
                            value={album}
                            onChange={(e) => setAlbum(e.target.value)}
                            disabled={isLoading}
                            className="w-full bg-[#150f1a] text-white pl-12 pr-4 py-3.5 rounded-xl border border-[#3b2d47] focus:border-[#f2cdd6] outline-none transition-colors text-sm font-medium disabled:opacity-50"
                            required
                        />
                    </div>

                    <div className="flex gap-4 mt-2">
                        <label className={`flex-1 cursor-pointer bg-[#342742] hover:bg-[#3e2f4f] border border-[#4a395c] rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-colors ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                            <Music className={audioFiles.length > 0 ? "text-[#f2cdd6]" : "text-gray-400"} size={24} />
                            <span className="text-xs font-bold text-center text-gray-300">
                                {audioFiles.length > 0 ? `${audioFiles.length} Tracks Selected` : 'Select MP3s'}
                            </span>
                            <input 
                                type="file" 
                                accept="audio/mpeg, audio/mp3" 
                                multiple 
                                className="hidden"
                                onChange={(e) => setAudioFiles(Array.from(e.target.files))}
                            />
                        </label>

                        <label className={`flex-1 cursor-pointer bg-[#342742] hover:bg-[#3e2f4f] border border-[#4a395c] rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-colors ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                            <ImageIcon className={coverFile ? "text-[#f2cdd6]" : "text-gray-400"} size={24} />
                            <span className="text-xs font-bold text-center text-gray-300">
                                {coverFile ? 'Cover Selected' : 'Album Art'}
                            </span>
                            <input 
                                type="file" 
                                accept="image/jpeg, image/png, image/webp" 
                                className="hidden"
                                onChange={(e) => setCoverFile(e.target.files[0])}
                            />
                        </label>
                    </div>

                    {isLoading && (
                        <div className="w-full bg-[#342742] rounded-full h-2.5 mt-2 overflow-hidden">
                            <div className="bg-[#f2cdd6] h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="mt-6 py-4 bg-[#f2cdd6] text-[#2c2137] font-black rounded-xl hover:bg-white transition-all disabled:opacity-70 shadow-lg flex justify-center items-center gap-2"
                    >
                        {isLoading ? `Uploading... ${progress}%` : 'Upload Entire Album'}
                    </button>
                </form>
            </div>
        </div>
    );
}
