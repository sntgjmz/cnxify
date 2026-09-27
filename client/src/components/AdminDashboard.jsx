// client/src/components/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { Users, MessageSquare, Check, X, ShieldAlert } from 'lucide-react';
import { apiUrl } from '../lib/api';

export default function AdminDashboard({ onBackToDashboard }) {
    const [pendingUsers, setPendingUsers] = useState([]);
    const [feedbackList, setFeedbackList] = useState([]);
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

            {/* Navigation Tabs */}
            <div className="flex gap-4 mb-6">
                <button 
                    onClick={() => setActiveTab('users')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'users' ? 'bg-[#f6c6d1] text-[#281a30]' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                >
                    <Users size={18} /> Pending Approvals ({pendingUsers.length})
                </button>
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
