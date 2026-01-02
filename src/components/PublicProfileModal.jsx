import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { getUserProfile, sendFriendRequest, getFriendshipStatus, blockUser, getBlockStatus } from '../utils/social';
import PropTypes from 'prop-types';

const PublicProfileModal = ({ username, onClose, currentUser }) => {
    const { theme } = useTheme();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [friendStatus, setFriendStatus] = useState('none'); // 'none' | 'pending' | 'friends'
    const [isBlocked, setIsBlocked] = useState(false);
    const [sendingRequest, setSendingRequest] = useState(false);
    const [blocking, setBlocking] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadProfile = async () => {
            setLoading(true);
            setError(null);
            try {
                console.log('[PublicProfile] Loading profile for:', username);
                const data = await getUserProfile(username);
                console.log('[PublicProfile] Profile data:', data);

                if (data) {
                    setProfile(data);
                } else {
                    // Create a basic profile fallback from the username
                    setProfile({
                        username,
                        gamesPlayed: '-',
                        bestScore: '-',
                        friendCount: 0
                    });
                }

                if (currentUser && currentUser !== username) {
                    const [status, blocked] = await Promise.all([
                        getFriendshipStatus(currentUser, username),
                        getBlockStatus(currentUser, username)
                    ]);
                    setFriendStatus(status);
                    setIsBlocked(blocked);
                }
            } catch (e) {
                console.error('Error loading profile:', e);
                setError('Failed to load profile');
                // Still show basic profile
                setProfile({
                    username,
                    gamesPlayed: '-',
                    bestScore: '-',
                    friendCount: 0
                });
            } finally {
                setLoading(false);
            }
        };
        if (username) {
            loadProfile();
        }
    }, [username, currentUser]);

    const handleAddFriend = async () => {
        if (!currentUser || sendingRequest) return;
        setSendingRequest(true);
        try {
            await sendFriendRequest(currentUser, username);
            setFriendStatus('pending');
        } catch (e) {
            console.error('Error sending friend request:', e);
        } finally {
            setSendingRequest(false);
        }
    };

    const handleBlock = async () => {
        if (!currentUser || blocking) return;
        const confirmed = window.confirm(`Block ${username}? They won't be able to send you friend requests.`);
        if (!confirmed) return;

        setBlocking(true);
        try {
            await blockUser(currentUser, username);
            setIsBlocked(true);
        } catch (e) {
            console.error('Error blocking user:', e);
        } finally {
            setBlocking(false);
        }
    };

    const initial = username ? username.charAt(0).toUpperCase() : '?';

    return (
        <div className="fixed inset-0 z-[9000] flex items-center justify-center p-4 backdrop-blur-sm bg-black/50 overflow-hidden" onClick={onClose}>
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className={`w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden
                    ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}
                `}
            >
                {/* Header */}
                <div className={`p-6 flex flex-col items-center border-b relative ${theme === 'dark' ? 'border-slate-800 bg-slate-800/30' : 'border-slate-100 bg-slate-50'}`}>
                    <button
                        onClick={onClose}
                        className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>

                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center text-3xl font-black text-white shadow-lg mb-3 ring-4 ring-white dark:ring-slate-700">
                        {initial}
                    </div>
                    <h2 className="text-xl font-black tracking-tight">{username}</h2>
                </div>

                {/* Content */}
                <div className="p-6">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
                        </div>
                    ) : profile ? (
                        <>
                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-3 mb-6">
                                <div className="text-center">
                                    <p className="text-2xl font-black text-slate-700 dark:text-slate-200">{profile.gamesPlayed || 0}</p>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Games</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-black text-emerald-500">{profile.bestScore || 0}</p>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Best</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-black text-sky-500">{profile.friendCount || 0}</p>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Friends</p>
                                </div>
                            </div>

                            {/* Actions */}
                            {currentUser && currentUser !== username && (
                                <div className="space-y-3">
                                    {/* Friend Button */}
                                    {!isBlocked && (
                                        friendStatus === 'friends' ? (
                                            <div className="w-full py-3 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-center font-bold text-sm">
                                                ✅ Friends
                                            </div>
                                        ) : friendStatus === 'pending' ? (
                                            <div className="w-full py-3 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-xl text-center font-bold text-sm">
                                                ⏳ Request Pending
                                            </div>
                                        ) : (
                                            <button
                                                onClick={handleAddFriend}
                                                disabled={sendingRequest}
                                                className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                                            >
                                                {sendingRequest ? 'Sending...' : '👋 Add Friend'}
                                            </button>
                                        )
                                    )}

                                    {/* Block Button */}
                                    {isBlocked ? (
                                        <div className="w-full py-2 bg-red-500/10 text-red-500 rounded-lg text-center text-xs font-bold">
                                            🚫 Blocked
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleBlock}
                                            disabled={blocking}
                                            className={`w-full py-2 rounded-lg text-xs font-bold transition-all
                                                ${theme === 'dark' ? 'text-red-400 hover:bg-red-500/10' : 'text-red-500 hover:bg-red-50'}
                                            `}
                                        >
                                            {blocking ? 'Blocking...' : '🚫 Block User'}
                                        </button>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-8 opacity-50">
                            <p>{error || 'Profile not found'}</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

PublicProfileModal.propTypes = {
    username: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    currentUser: PropTypes.string
};

export default PublicProfileModal;
