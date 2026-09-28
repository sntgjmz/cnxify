// client/src/components/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { Users, MessageSquare, Check, X, ShieldAlert, Music2, Pencil, Trash2 } from 'lucide-react';
import { apiUrl } from '../lib/api';

export default function AdminDashboard({ onBackToDashboard }) {
    const [pendingUsers, setPendingUsers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [feedbackList, setFeedbackList] = useState([]);
    const [songs, setSongs] = useState([]);
    const [userSearch, setUserSearch] = useState('');
    const [activeTab, setActiveTab] = useState('users');
    const [error, setError] = useState('');

    const token = localStorage.getItem('cnxify_token');

    const fetchData = async () => {
        try {
            // Fetch Pending Users
            const usersRes = await fetch(apiUrl('/api/admin/users/pending'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const usersData = await usersRes.json();
            if (!usersRes.ok) throw new Error(usersData.error || 'Unable to load pending users');
            setPendingUsers(usersData);

            const directoryRes = await fetch(apiUrl('/api/admin/users'), { headers: { 'Authorization': `Bearer ${token}` } });
            const directoryData = await directoryRes.json();
            if (!directoryRes.ok) throw new Error(directoryData.error || 'Unable to load user directory');
            setAllUsers(directoryData);

            const songsRes = await fetch(apiUrl('/api/songs'), { headers: { 'Authorization': `Bearer ${token}` } });
            const songsData = await songsRes.json();
            if (!songsRes.ok) throw new Error(songsData.error || 'Unable to load songs');
            setSongs(songsData);

            // Fetch Feedback & Song Requests
            const feedbackRes = await fetch(apiUrl('/api/admin/feedback'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const feedbackData = await feedbackRes.json();
            if (!feedbackRes.ok) throw new Error(feedbackData.error || 'Unable to load feedback');
            setFeedbackList(feedbackData);
        } catch {
            setError('Failed to load admin data');
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleUserStatus = async (id, status) => {
        try {
            const res = await fetch(apiUrl(`/api/admin/users/${id}/status`), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                setPendingUsers((users) => users.filter((user) => user.id !== id));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleFeedbackStatus = async (id, status) => {
        try {
            const res = await fetch(apiUrl(`/api/admin/feedback/${id}/status`), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                fetchData(); // Refresh list
            }
        } catch (err) {
            console.error(err);
        }
    };
    const editSong = async (song) => {
        const title = window.prompt('Song title', song.title);
        if (title === null) return;
        const artist = window.prompt('Artist', song.artist);
        if (artist === null) return;
        const album = window.prompt('Album', song.album);
        if (album === null) return;
        try {
            const response = await fetch(apiUrl(`/api/admin/songs/${song.id}`), { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ title, artist, album }) });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Unable to update song.');
            setSongs((items) => items.map((item) => item.id === data.id ? data : item));
        } catch (updateError) { setError(updateError.message); }
    };
    const deleteSong = async (song) => {
        if (!window.confirm(`Delete “${song.title}” from CNXify? This cannot be undone.`)) return;
        try {
            const response = await fetch(apiUrl(`/api/admin/songs/${song.id}`), { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Unable to delete song.');
            setSongs((items) => items.filter((item) => item.id !== song.id));
        } catch (deleteError) { setError(deleteError.message); }
    };
    const visibleUsers = allUsers.filter((user) => `${user.username} ${user.email}`.toLowerCase().includes(userSearch.toLowerCase()));

    return (
        <div className="min-h-screen bg-[#17121b] text-white p-6 md:p-10 font-sans">
            <header className="flex justify-between items-center mb-10 border-b border-white/10 pb-5">
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-black text-[#f6c6d1] tracking-tighter flex items-center gap-2">
                        <ShieldAlert /> Admin Portal
                    </h1>
                </div>
                <button 
                    onClick={onBackToDashboard}
                    className="bg-white/10 text-white px-4 py-2 rounded-xl font-medium hover:bg-white/15 transition-colors"
                >
                    Back to App
                </button>
            </header>

            {error && <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded mb-6">{error}</div>}
            <section className="mb-8 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-white/10 bg-white/5 p-5"><p className="text-xs font-bold uppercase tracking-wider text-[#b9a6c0]">Members</p><p className="mt-2 text-3xl font-black">{allUsers.length}</p></div><div className="rounded-2xl border border-white/10 bg-white/5 p-5"><p className="text-xs font-bold uppercase tracking-wider text-[#b9a6c0]">Music library</p><p className="mt-2 text-3xl font-black">{songs.length}</p></div><div className="rounded-2xl border border-white/10 bg-white/5 p-5"><p className="text-xs font-bold uppercase tracking-wider text-[#b9a6c0]">Open requests</p><p className="mt-2 text-3xl font-black">{feedbackList.filter((item) => item.status === 'PENDING').length}</p></div></section>

            {/* Navigation Tabs */}
            <div className="flex gap-4 mb-6">
                <button 
                    onClick={() => setActiveTab('users')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'users' ? 'bg-[#f6c6d1] text-[#281a30]' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                >
                    <Users size={18} /> Pending Approvals ({pendingUsers.length})
                </button>
                <button onClick={() => setActiveTab('directory')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'directory' ? 'bg-[#f6c6d1] text-[#281a30]' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}><Users size={18} /> All Users ({allUsers.length})</button>
                <button onClick={() => setActiveTab('songs')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'songs' ? 'bg-[#f6c6d1] text-[#281a30]' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}><Music2 size={18} /> Songs ({songs.length})</button>
                <button 
                    onClick={() => setActiveTab('feedback')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'feedback' ? 'bg-[#f6c6d1] text-[#281a30]' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                >
                    <MessageSquare size={18} /> Feedback & Requests ({feedbackList.length})
                </button>
            </div>

            {/* Tab 1: Pending Users */}
            {activeTab === 'users' && (
                <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                    {pendingUsers.length === 0 ? (
                        <p className="p-6 text-gray-400 text-center">No pending user registrations found.</p>
                    ) : (
                        <div className="divide-y divide-gray-800">
                            {pendingUsers.map(user => (
                                <div key={user.id} className="p-6 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-lg">{user.username}</h3>
                                        <p className="text-sm text-gray-400">{user.email}</p>
                                        <p className="text-xs text-gray-500 mt-1">Registered: {new Date(user.created_at).toLocaleString()}</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <button 
                                            onClick={() => handleUserStatus(user.id, 'APPROVED')}
                                            className="bg-[#f6c6d1] text-[#281a30] px-4 py-2 rounded-xl font-bold flex items-center gap-1 hover:bg-white"
                                        >
                                            <Check size={16} /> Approve
                                        </button>
                                        <button 
                                            onClick={() => handleUserStatus(user.id, 'REJECTED')}
                                            className="bg-white/10 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-1 hover:bg-red-500"
                                        >
                                            <X size={16} /> Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'directory' && (
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                    <div className="border-b border-white/10 p-3"><input value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Search members by name or email" className="w-full rounded-xl border border-white/10 bg-black/15 px-4 py-2.5 text-sm outline-none focus:border-[#f6c6d1]/60" /></div>{visibleUsers.length === 0 ? <p className="p-6 text-center text-gray-400">No users found.</p> : <div className="divide-y divide-white/10">{visibleUsers.map((user) => <div key={user.id} className="flex flex-wrap items-center justify-between gap-3 p-5"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-[#f6c6d1]/15 text-[#f6c6d1]">{user.avatar_path ? <img src={apiUrl(user.avatar_path)} alt="" className="h-full w-full object-cover" /> : <Users size={17} />}</span><div><h3 className="font-bold">{user.username}</h3><p className="text-sm text-gray-400">{user.email}</p></div></div><div className="flex gap-2 text-xs font-bold"><span className="rounded-full bg-white/10 px-3 py-1.5 text-gray-300">{user.role}</span><span className={`rounded-full px-3 py-1.5 ${user.status === 'APPROVED' ? 'bg-green-400/15 text-green-200' : user.status === 'PENDING' ? 'bg-yellow-400/15 text-yellow-200' : 'bg-red-400/15 text-red-200'}`}>{user.status}</span></div></div>)}</div>}
                </div>
            )}

            {activeTab === 'songs' && <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">{songs.length === 0 ? <p className="p-6 text-center text-gray-400">No uploaded songs yet.</p> : <div className="divide-y divide-white/10">{songs.map((song) => <div key={song.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div className="flex min-w-0 items-center gap-3"><span className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-white/10">{song.cover_path && <img src={apiUrl(song.cover_path)} alt="" className="h-full w-full object-cover" />}</span><div className="min-w-0"><b className="block truncate">{song.title}</b><p className="truncate text-xs text-gray-400">{song.artist} · {song.album}</p></div></div><div className="flex gap-1"><button onClick={() => editSong(song)} title="Edit song" className="rounded-lg p-2 text-[#f6c6d1] hover:bg-white/10"><Pencil size={16} /></button><button onClick={() => deleteSong(song)} title="Delete song" className="rounded-lg p-2 text-red-300 hover:bg-red-500/15"><Trash2 size={16} /></button></div></div>)}</div>}</div>}

            {/* Tab 2: Feedback & Requests */}
            {activeTab === 'feedback' && (
                <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                    {feedbackList.length === 0 ? (
                        <p className="p-6 text-gray-400 text-center">No feedback or song requests submitted yet.</p>
                    ) : (
                        <div className="divide-y divide-gray-800">
                            {feedbackList.map(item => (
                                <div key={item.id} className="p-6 flex justify-between items-center">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className={`text-xs px-2.5 py-1 rounded font-bold ${item.type === 'SONG_REQUEST' ? 'bg-purple-900 text-purple-200' : 'bg-blue-900 text-blue-200'}`}>
                                                {item.type}
                                            </span>
                                            <span className="text-xs text-gray-400">By: {item.username}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded font-semibold ${item.status === 'PENDING' ? 'text-yellow-400 bg-yellow-900/20' : 'text-green-400 bg-green-900/20'}`}>
                                                {item.status}
                                            </span>
                                        </div>
                                        <p className="text-white mt-2">{item.content}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        {item.status === 'PENDING' && (
                                            <button 
                                                onClick={() => handleFeedbackStatus(item.id, 'COMPLETED')}
                                            className="bg-[#f6c6d1] text-[#281a30] px-3 py-1.5 rounded-xl text-sm font-bold hover:bg-white"
                                            >
                                                Mark Complete
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => handleFeedbackStatus(item.id, 'REJECTED')}
                                            className="bg-gray-800 text-gray-300 px-3 py-1.5 rounded text-sm hover:bg-gray-700"
                                        >
                                            Dismiss
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
