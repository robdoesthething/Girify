import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { approveFeedback, deleteFeedback, FeedbackItem, rejectFeedback } from '../utils/social';

interface AdminFeedbackProps {
  feedback: FeedbackItem[];
  onRefresh: () => void;
  notify: (msg: string, type: 'success' | 'error') => void;
  confirm: (message: string, title?: string, isDangerous?: boolean) => Promise<boolean>;
}

const AdminFeedback: React.FC<AdminFeedbackProps> = ({ feedback, onRefresh, notify, confirm }) => {
  const { theme } = useTheme();
  const [rewardAmount, setRewardAmount] = useState<Record<string, number>>({});

  const getReward = (id: string) => rewardAmount[id] || 50;

  const handleApprove = async (id: string) => {
    try {
      const amount = getReward(id);
      await approveFeedback(id, amount);
      notify(`Approved with ${amount} Giuros reward`, 'success');
      onRefresh();
    } catch {
      notify('Approval failed', 'error');
    }
  };

  const handleReject = async (id: string) => {
    if (!(await confirm('Reject this feedback?', 'Reject Feedback', true))) {
      return;
    }
    try {
      await rejectFeedback(id);
      notify('Feedback rejected', 'success');
      onRefresh();
    } catch {
      notify('Rejection failed', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm('Delete this feedback permanently?', 'Delete Feedback', true))) {
      return;
    }
    try {
      await deleteFeedback(id);
      notify('Feedback deleted', 'success');
      onRefresh();
    } catch {
      notify('Deletion failed', 'error');
    }
  };

  const formatDate = (date: unknown) => {
    if (!date) {
      return '-';
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = date as any;
    if (typeof d.toDate === 'function') {
      return d.toDate().toLocaleDateString();
    }
    if (d.seconds) {
      return new Date(d.seconds * 1000).toLocaleDateString();
    }
    return new Date(d as string | number | Date).toLocaleDateString();
  };

  const getStatusStyle = (status: string) => {
    if (status === 'approved') {
      return 'bg-emerald-100 text-emerald-600';
    }
    if (status === 'rejected') {
      return 'bg-rose-100 text-rose-600';
    }
    return 'bg-yellow-100 text-yellow-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black">Feedback Management</h2>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-lg font-bold hover:bg-slate-300 dark:hover:bg-slate-700"
        >
          Refesh
        </button>
      </div>

      <div
        className={`rounded-2xl overflow-hidden border ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}
      >
        <table className="w-full text-left">
          <thead className={theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}>
            <tr>
              <th className="p-4 text-xs uppercase opacity-50">User</th>
              <th className="p-4 text-xs uppercase opacity-50 w-1/2">Message</th>
              <th className="p-4 text-xs uppercase opacity-50">Status</th>
              <th className="p-4 text-xs uppercase opacity-50">Reward</th>
              <th className="p-4 text-xs uppercase opacity-50">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {feedback.map(item => (
              <tr
                key={item.id}
                className={theme === 'dark' ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}
              >
                <td className="p-4">
                  <div className="font-bold">{item.username}</div>
                  <div className="text-xs opacity-50">{formatDate(item.createdAt)}</div>
                </td>
                <td className="p-4 text-sm whitespace-pre-wrap">{item.text}</td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold uppercase ${getStatusStyle(item.status)}`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="p-4">
                  {item.status === 'pending' && (
                    <input
                      type="number"
                      value={getReward(item.id)}
                      onChange={e =>
                        setRewardAmount(prev => ({
                          ...prev,
                          [item.id]: parseInt(e.target.value, 10),
                        }))
                      }
                      className="w-20 p-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-center"
                    />
                  )}
                  {item.status === 'approved' && (
                    <span className="font-bold text-yellow-500">{item.reward || 50} 🪙</span>
                  )}
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    {item.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(item.id)}
                          className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded hover:bg-emerald-500 hover:text-white transition-colors text-xs font-bold"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(item.id)}
                          className="px-3 py-1 bg-rose-500/10 text-rose-500 rounded hover:bg-rose-500 hover:text-white transition-colors text-xs font-bold"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="px-3 py-1 bg-slate-500/10 text-slate-500 rounded hover:bg-slate-500 hover:text-white transition-colors text-xs font-bold"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {feedback.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center opacity-50">
                  No feedback found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminFeedback;
