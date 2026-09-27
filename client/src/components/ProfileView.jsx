// client/src/components/ProfileView.jsx
import { useState, useEffect } from 'react';
import { User, Disc, ArrowLeft, UserPlus, UserCheck, Radio, Settings } from 'lucide-react';
import { apiUrl } from '../lib/api';

export default function ProfileView({ userId, token, onBack, onPlayPlaylist, nowListening, isCurrentUser }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isUpdatingFollow, setIsUpdatingFollow] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [username, setUsername] = useState('');
    const [showActivity, setShowActivity] = useState(true);
    const [avatarFile, setAvatarFile] = useState(null);
    const [saveError, setSaveError] = useState('');

    useEffect(() => {
        fetch(apiUrl(`/api/users/${userId}/profile`), {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            setProfile(data);
            setIsFollowing(Boolean(data.is_following));
            setUsername(data.username);
            setShowActivity(data.show_listening_activity !== false);
            setLoading(false);
        })
        .catch(err => {
            console.error('Error fetching profile:', err);
            setLoading(false);
        });
    }, [userId, token]);

    if (loading) {
        return <div className="p-8 text-gray-400">Loading profile...</div>;
    }

    if (!profile) {
        return <div className="p-8 text-red-400">Profile not found.</div>;
    }

    const toggleFollow = async () => {
        setIsUpdatingFollow(true);
        try {
            const response = await fetch(apiUrl(`/api/users/${userId}/follow`), {
                method: isFollowing ? 'DELETE' : 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            setIsFollowing(data.following);
            setProfile((current) => ({ ...current, follower_count: current.follower_count + (data.following ? 1 : -1) }));
        } catch (error) {
            console.error('Unable to update follow:', error);
        } finally {
            setIsUpdatingFollow(false);
        }
    };

    const saveProfile = async (event) => {
        event.preventDefault(); setSaveError('');
        const formData = new FormData(); formData.append('username', username); formData.append('show_listening_activity', String(showActivity)); if (avatarFile) formData.append('avatar', avatarFile);
        try { const response = await fetch(apiUrl('/api/me/profile'), { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: formData }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setProfile((current) => ({ ...current, ...data })); setAvatarFile(null); setIsEditing(false); } catch (error) { setSaveError(error.message || 'Unable to save profile.'); }
    };

    return (
        <div className="w-full pb-12">
            <button onClick={onBack} className="text-sm font-bold text-gray-400 hover:text-white mb-6 flex items-center gap-2">
                <ArrowLeft size={16} /> Back
            </button>
            
            {/* Profile Header */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-6 mb-10 bg-gradient-to-br from-[#5c3b6f] via-[#34233f] to-[#201827] p-8 rounded-3xl border border-white/10 shadow-2xl">
                <div className="w-28 h-28 rounded-full bg-[#f6c6d1] text-[#241829] flex items-center justify-center shadow-xl ring-8 ring-white/5">
                    {profile.avatar_path ? <img src={apiUrl(profile.avatar_path)} alt="" className="h-full w-full object-cover" /> : <User size={54} />}
                </div>
                <div className="flex-1">
                    <h1 className="text-4xl font-black tracking-tighter mb-2">{profile.username}</h1>
                    <p className="text-sm text-gray-300">{profile.follower_count} {profile.follower_count === 1 ? 'follower' : 'followers'} · Member since {new Date(profile.created_at).toLocaleDateString()}</p>
                    {nowListening && <p className="mt-3 flex items-center gap-2 text-sm font-medium text-[#ffd6de]"><Radio size={16} className="animate-pulse" /> Listening to {nowListening.title} · {nowListening.artist}</p>}
                </div>
                {isCurrentUser ? <button onClick={() => setIsEditing((editing) => !editing)} className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-[#25182a] hover:bg-[#ffd6de]"><Settings size={17} /> {isEditing ? 'Close settings' : 'Edit profile'}</button> : <button onClick={toggleFollow} disabled={isUpdatingFollow} className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-[#25182a] hover:bg-[#ffd6de] disabled:opacity-60">{isFollowing ? <UserCheck size={17} /> : <UserPlus size={17} />}{isFollowing ? 'Following' : 'Follow'}</button>}
            </div>

            {isEditing && <form onSubmit={saveProfile} className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-5"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold text-gray-300">Display name<input value={username} onChange={(event) => setUsername(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white outline-none focus:border-[#f6c6d1]" /></label><label className="text-sm font-bold text-gray-300">Profile picture<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setAvatarFile(event.target.files?.[0] || null)} className="mt-2 block w-full text-xs text-gray-400" /></label></div><label className="mt-4 flex items-center gap-3 text-sm text-gray-300"><input type="checkbox" checked={showActivity} onChange={(event) => setShowActivity(event.target.checked)} className="accent-[#f6c6d1]" /> Show my listening activity to colleagues</label>{saveError && <p className="mt-3 text-sm text-red-200">{saveError}</p>}<button className="mt-4 rounded-full bg-[#f6c6d1] px-5 py-2.5 text-sm font-bold text-[#281a30]">Save changes</button></form>}

            {/* Public Playlists */}
            <h3 className="text-xl font-bold mb-5 tracking-tight">{profile.username}'s Public Playlists</h3>
            
            {profile.playlists.length === 0 ? (
                <p className="text-gray-400 text-sm p-6 bg-[#342742]/50 rounded-xl border border-[#4a395c] border-dashed">
                    This user hasn't created any public playlists yet.
                </p>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {profile.playlists.map(playlist => (
                        <div 
                            key={playlist.id} 
                            onClick={() => onPlayPlaylist(playlist)}
                            className="bg-white/5 hover:bg-white/10 p-4 rounded-2xl transition-all cursor-pointer group border border-white/5 hover:border-[#ffd6de]/40"
                        >
                            <div className="w-full aspect-square bg-[#4a395c] rounded-lg mb-4 flex items-center justify-center text-4xl shadow-md group-hover:shadow-xl transition-all relative">
                                <Disc className="text-[#f2cdd6]" size={40} />
                            </div>
                            <h4 className="font-bold text-sm mb-1 truncate text-white">{playlist.title}</h4>
                            <p className="text-xs text-gray-400">Public Playlist</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
