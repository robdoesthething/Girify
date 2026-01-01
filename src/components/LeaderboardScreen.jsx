import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { getLeaderboard } from '../utils/leaderboard';
import PublicProfileModal from './PublicProfileModal';

const LeaderboardScreen = ({ onClose, currentUser }) => {
    const { theme } = useTheme();
    const [scores, setScores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('all'); // 'all', 'monthly', 'weekly', 'daily'
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        loadScores();
    }, [period]);

    const loadScores = async () => {
        setLoading(true);
        setScores([]); // Clear previous scores while loading

        try {
            // Race against a 5-second timeout to prevent infinite loading
            const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 5000));
            const dataPromise = getLeaderboard(period);

            const data = await Promise.race([dataPromise, timeoutPromise]);

            if (data === null) {
                console.warn("Leaderboard fetch timed out");
                setScores([]);
            } else {
                setScores(data);
            }
        } catch (error) {
            console.error("Failed to load scores:", error);
            setScores([]);
        } finally {
            setLoading(false);
        }
    };

    const TABS = [
        { id: 'all', label: 'All Time' },
        { id: 'monthly', label: 'Monthly' },
        { id: 'weekly', label: 'Weekly' },
        { id: 'daily', label: 'Daily' }
    ];

    return (
        <>
            <div className="fixed inset-0 z-[8000] flex flex-col pt-16 pb-6 px-4 md:px-8 overflow-hidden pointer-events-auto bg-slate-50 dark:bg-slate-900 backdrop-blur-md">
                {/* Header */}
                <div className="flex justify-between items-center max-w-2xl mx-auto w-full mb-6 shrink-0">
                    <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Leaderboard</h2>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-full transition-colors text-slate-900 dark:text-white hover:bg-black/5 dark:hover:bg-white/10`}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="max-w-2xl mx-auto w-full flex p-1 mb-6 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setPeriod(tab.id)}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all
                                ${period === tab.id
                                    ? 'bg-white dark:bg-slate-700 shadow-sm text-sky-500'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}
                            `}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto max-w-2xl mx-auto w-full space-y-3 pb-8">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-50">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mb-4"></div>
                            <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Loading rankings...</p>
                        </div>
                    ) : scores.length === 0 ? (
                        <div className="text-center py-20 opacity-50">
                            <p className="text-lg font-bold mb-2 text-slate-700 dark:text-slate-300">No records found</p>
                            <p className="text-sm text-slate-500">Be the first to set a record in this period!</p>
                        </div>
                    ) : (
                        scores.map((s, index) => {
                            // Safely parse date
                            let dateStr = 'Unknown';
                            try {
                                if (s.timestamp && s.timestamp.seconds) {
                                    dateStr = new Date(s.timestamp.seconds * 1000).toLocaleDateString();
                                } else if (s.timestamp) {
                                    dateStr = new Date(s.timestamp).toLocaleDateString();
                                }
                            } catch (e) {
                                dateStr = 'Unknown';
                            }

                            return (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    key={s.id || index}
                                    onClick={() => setSelectedUser(s.username)}
                                    className={`flex items-center p-4 rounded-2xl border cursor-pointer hover:scale-[1.02] transition-transform
                                    ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700 text-white' : 'bg-white border-slate-100 text-slate-900'}
                                    ${index < 3 ? 'border-sky-500/30 shadow-sm' : ''}
                                `}
                                >
                                    <div className={`w-8 h-8 flex items-center justify-center rounded-full font-black text-sm mr-4
                                    ${index === 0 ? 'bg-yellow-400 text-yellow-900' :
                                            index === 1 ? 'bg-slate-300 text-slate-800' :
                                                index === 2 ? 'bg-amber-600 text-amber-100' :
                                                    'bg-slate-100 dark:bg-slate-700 text-slate-500'}
                                `}>
                                        {index + 1}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold truncate text-lg text-sky-500 hover:underline">{s.username}</p>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                                            {dateStr}
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-xl font-black text-sky-500">{s.score}</p>
                                        <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-tighter">{s.time}s</p>
                                    </div>
                                </motion.div>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Profile Modal */}
            <AnimatePresence>
                {selectedUser && (
                    <PublicProfileModal
                        username={selectedUser}
                        onClose={() => setSelectedUser(null)}
                        currentUser={currentUser}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default LeaderboardScreen;
