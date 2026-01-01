import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { getPendingFriendRequests, acceptFriendRequest } from '../utils/social';

const FriendRequests = ({ username }) => {
    const { theme } = useTheme();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadRequests = async () => {
            if (!username) return;
            setLoading(true);
            try {
                const data = await getPendingFriendRequests(username);
                setRequests(data);
            } catch (error) {
                console.error("Error loading friend requests:", error);
            } finally {
                setLoading(false);
            }
        };

        loadRequests();
    }, [username]);

    const handleAccept = async (reqId) => {
        try {
            await acceptFriendRequest(reqId);
            // Remove from list
            setRequests(prev => prev.filter(r => r.id !== reqId));
        } catch (error) {
            console.error("Error accepting request:", error);
        }
    };

    if (loading) {
        return <div className="text-center py-4 opacity-50 text-xs">Loading requests...</div>;
    }

    if (requests.length === 0) {
        return null;
    }

    return (
        <div className={`mb-6 p-4 rounded-2xl border ${theme === 'dark' ? 'bg-neutral-800/50 border-neutral-700' : 'bg-slate-50 border-slate-100'}`}>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                Friend Requests ({requests.length})
            </h3>
            <div className="space-y-2">
                {requests.map(req => (
                    <div key={req.id} className={`flex items-center justify-between p-2 rounded-xl border ${theme === 'dark' ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs ring-2 ring-white dark:ring-neutral-800">
                                {req.user1.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-bold text-sm">{req.user1}</span>
                        </div>
                        <button
                            onClick={() => handleAccept(req.id)}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition-colors"
                        >
                            Accept
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FriendRequests;
