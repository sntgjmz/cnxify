// client/src/components/FeedbackModal.jsx
import { useState } from 'react';
import { apiUrl } from '../lib/api';

export default function FeedbackModal({ isOpen, onClose, token }) {
    const [content, setContent] = useState('');
    const [type, setType] = useState('SONG_REQUEST');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        try {
            const response = await fetch(apiUrl('/api/feedback'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ type, content }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Unable to submit feedback.');
            setContent('');
            onClose();
        } catch (submitError) {
            setError(submitError.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[#100b15]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#21162a] p-7 rounded-3xl w-full max-w-md border border-white/10 shadow-2xl">
                <h2 className="text-xl font-bold mb-4 text-white">Submit Request / Feedback</h2>
                {error && <p className="mb-4 rounded border border-red-500 bg-red-950/50 p-3 text-sm text-red-200">{error}</p>}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <select 
                        value={type} 
                        onChange={(e) => setType(e.target.value)}
                        className="p-3 bg-[#2c2036] text-white rounded-xl border border-[#f6c6d1]/30 focus:border-[#f6c6d1] outline-none appearance-none"
                    >
                        <option value="SONG_REQUEST">Song Request</option>
                        <option value="FEEDBACK">General Feedback</option>
                    </select>
                    <textarea 
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="What's on your mind?"
                        className="p-3 bg-white/5 text-white rounded-xl border border-white/10 focus:border-[#f6c6d1] outline-none h-32 resize-none"
                        required
                    />
                    <div className="flex justify-end gap-3 mt-2">
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-[#f6c6d1] text-[#281a30] font-bold rounded-full hover:bg-white transition-colors disabled:opacity-60">{isSubmitting ? 'Submitting…' : 'Submit'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
