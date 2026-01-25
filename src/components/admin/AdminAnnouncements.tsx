import { AnimatePresence, motion } from 'framer-motion';
import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAdminCRUD } from '../../hooks/useAdminCRUD';
import { Announcement, createAnnouncement, deleteAnnouncement } from '../../utils/social/news';
import { themeClasses } from '../../utils/themeUtils';
import FormInput from '../FormInput';

interface AdminAnnouncementsProps {
  announcements: Announcement[];
  onRefresh: () => void;
  notify: (msg: string, type: 'success' | 'error' | 'info') => void;
  confirm: (message: string, title?: string, isDangerous?: boolean) => Promise<boolean>;
}

const AdminAnnouncements: React.FC<AdminAnnouncementsProps> = ({
  announcements,
  onRefresh,
  notify,
  confirm,
}) => {
  const { theme } = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [formData, setFormData] = useState<any>({
    title: '',
    body: '',
    priority: 'normal',
    targetAudience: 'all',
    isActive: true,
    daysToLive: 7,
  });

  const { isCreating, setIsCreating, handleDelete, handleCreate } = useAdminCRUD({
    notify,
    confirm,
    refreshFn: onRefresh,
    deleteFn: deleteAnnouncement,
    createFn: async data => {
      const publishDate = new Date();
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + parseInt(data.daysToLive, 10));

      await createAnnouncement({
        title: data.title,
        body: data.body,
        publishDate,
        expiryDate,
        priority: data.priority,
        targetAudience: data.targetAudience,
        isActive: data.isActive,
      });
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.body) {
      notify('Missing title or body', 'error');
      return;
    }
    handleCreate(formData);
    // Reset form after successful create (handled by hook implies close, but we need to clear state)
    // Actually hook sets isCreating false. We should reset form when opening dialog or success.
    setFormData({
      title: '',
      body: '',
      priority: 'normal',
      targetAudience: 'all',
      isActive: true,
      daysToLive: 7,
    });
  };

  const formatDate = (date: unknown) => {
    if (!date) {
      return '-';
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = date as any;
    if (d.toDate && typeof d.toDate === 'function') {
      return d.toDate().toLocaleDateString();
    }
    return new Date(d as string | number | Date).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black">Announcements</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-bold shadow-lg shadow-sky-500/20 transition-all"
        >
          + New Announcement
        </button>
      </div>

      <div
        className={`rounded-2xl overflow-hidden border ${themeClasses(theme, 'border-slate-700', 'border-slate-200')}`}
      >
        <table className="w-full text-left">
          <thead className={themeClasses(theme, 'bg-slate-800', 'bg-slate-100')}>
            <tr>
              <th className="p-4 text-xs uppercase opacity-50">Date</th>
              <th className="p-4 text-xs uppercase opacity-50">Title</th>
              <th className="p-4 text-xs uppercase opacity-50">Priority</th>
              <th className="p-4 text-xs uppercase opacity-50">Audience</th>
              <th className="p-4 text-xs uppercase opacity-50">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {announcements.map(item => (
              <tr
                key={item.id}
                className={themeClasses(theme, 'hover:bg-slate-800/50', 'hover:bg-slate-50')}
              >
                <td className="p-4 text-sm font-mono opacity-70">{formatDate(item.publishDate)}</td>
                <td className="p-4">
                  <div className="font-bold">{item.title}</div>
                  <div className="text-xs opacity-50 line-clamp-1">{item.body}</div>
                </td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                      item.priority === 'urgent'
                        ? 'bg-rose-100 text-rose-600'
                        : item.priority === 'high'
                          ? 'bg-orange-100 text-orange-600'
                          : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.priority}
                  </span>
                </td>
                <td className="p-4 text-xs font-bold uppercase opacity-60">
                  {item.targetAudience}
                </td>
                <td className="p-4">
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="px-3 py-1 bg-rose-500/10 text-rose-500 rounded hover:bg-rose-500 hover:text-white transition-colors text-xs font-bold"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {announcements.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center opacity-50">
                  No announcements found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`w-full max-w-lg p-6 rounded-3xl shadow-2xl ${themeClasses(theme, 'bg-slate-800', 'bg-white')}`}
            >
              <h3 className="text-2xl font-black mb-6">New Announcement</h3>
              <form onSubmit={onSubmit} className="space-y-4">
                <FormInput
                  id="announce-title"
                  label="Title"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Headline"
                />

                <div>
                  <label
                    htmlFor="announce-body"
                    className="text-xs uppercase font-bold opacity-50 block mb-1"
                  >
                    Content
                  </label>
                  <textarea
                    id="announce-body"
                    value={formData.body}
                    onChange={e => setFormData({ ...formData, body: e.target.value })}
                    className="w-full p-3 h-32 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                    placeholder="Message body..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="announce-priority"
                      className="text-xs uppercase font-bold opacity-50 block mb-1"
                    >
                      Priority
                    </label>
                    <select
                      id="announce-priority"
                      value={formData.priority}
                      onChange={e => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <FormInput
                    id="announce-days"
                    label="Duration (Days)"
                    type="number"
                    value={formData.daysToLive}
                    onChange={e => setFormData({ ...formData, daysToLive: e.target.value })}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="flex-1 py-3 font-bold opacity-60 hover:opacity-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold shadow-lg"
                  >
                    Publish
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminAnnouncements;
