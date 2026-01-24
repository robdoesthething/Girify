import { AnimatePresence } from 'framer-motion';
import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAdminData } from '../../hooks/useAdminData';
import { useConfirm } from '../../hooks/useConfirm';
import { useNotification } from '../../hooks/useNotification';
import { UserProfile } from '../../types/user';
import { themeClasses } from '../../utils/themeUtils';
import { ConfirmDialog } from '../ConfirmDialog';

// Child components
import AdminAchievements from './AdminAchievements';
import AdminAnnouncements from './AdminAnnouncements';
import AdminConfig from './AdminConfig';
import AdminContent from './AdminContent';
import AdminFeedback from './AdminFeedback';
import AdminGameMaster from './AdminGameMaster';
import AdminGiuros from './AdminGiuros';
import AdminShop from './AdminShop';
import AdminTeams from './AdminTeams';
import AdminUsersTab from './AdminUsersTab';
import EditUserModal from './EditUserModal';
import MetricCard from './MetricCard';
import ViewUserModal from './ViewUserModal';

const ADMIN_TABS = [
  'dashboard',
  'users',
  'teams',
  'gamemaster',
  'achievements',
  'content',
  'shop',
  'feedback',
  'announcements',
  'giuros',
  'config',
];

const AdminPanel: React.FC = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [viewingUser, setViewingUser] = useState<UserProfile | null>(null);
  const { notify } = useNotification();
  const { confirm, confirmConfig, handleClose } = useConfirm();

  const { state, actions } = useAdminData(notify, confirm);
  const { users, feedback, announcements, shopItems, metrics, loading, migrationStatus } = state;
  const { fetchData, handleMigration, handleCleanupUser, handleUpdateUser } = actions;

  return (
    <div
      className={`fixed inset-0 pt-16 flex ${themeClasses(theme, 'bg-slate-900 text-white', 'bg-slate-50 text-slate-900')}`}
    >
      {/* Sidebar */}
      <div
        className={`w-48 shrink-0 p-4 border-r flex flex-col ${themeClasses(theme, 'border-slate-800 bg-slate-900', 'border-slate-200 bg-white')}`}
      >
        <h1 className="text-xl font-black mb-6 text-sky-500">Girify Admin</h1>
        <nav className="flex flex-col gap-2">
          {ADMIN_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-left px-3 py-2 rounded-lg font-bold text-sm transition-all ${
                activeTab === tab
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 opacity-60 hover:opacity-100'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 h-full overflow-y-scroll p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
          </div>
        ) : (
          <div className="w-full pb-16">
            {activeTab === 'gamemaster' && <AdminGameMaster onNotify={notify} confirm={confirm} />}
            {activeTab === 'teams' && <AdminTeams />}
            {activeTab === 'achievements' && (
              <AdminAchievements onNotify={notify} confirm={confirm} />
            )}
            {activeTab === 'content' && <AdminContent onNotify={notify} confirm={confirm} />}
            {activeTab === 'giuros' && (
              <AdminGiuros users={users} shopItems={shopItems} theme={theme} />
            )}
            {activeTab === 'shop' && (
              <AdminShop
                items={shopItems}
                onRefresh={fetchData}
                notify={notify}
                confirm={confirm}
              />
            )}
            {activeTab === 'feedback' && (
              <AdminFeedback
                feedback={feedback}
                onRefresh={fetchData}
                notify={notify}
                confirm={confirm}
              />
            )}
            {activeTab === 'announcements' && (
              <AdminAnnouncements
                announcements={announcements}
                onRefresh={fetchData}
                notify={notify}
                confirm={confirm}
              />
            )}
            {activeTab === 'config' && <AdminConfig onNotify={notify} />}

            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                <h2 className="text-3xl font-black">Overview</h2>
                {metrics ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <MetricCard
                      title="Total Users"
                      value={metrics.totalUsers}
                      color="text-sky-500"
                    />
                    <MetricCard
                      title="New (24h)"
                      value={metrics.newUsers24h}
                      color="text-emerald-500"
                    />
                    <MetricCard
                      title="Active (24h)"
                      value={metrics.activeUsers24h}
                      color="text-purple-500"
                    />
                    <MetricCard
                      title="Games (24h)"
                      value={metrics.gamesPlayed24h}
                      color="text-orange-500"
                    />
                    <MetricCard title="Feedback" value={feedback.length} color="text-pink-500" />
                    <MetricCard
                      title="Items"
                      value={shopItems.all?.length || 0}
                      color="text-yellow-500"
                    />
                  </div>
                ) : (
                  <div className="py-12 text-center opacity-50">Loading metrics...</div>
                )}

                {/* Data Tools */}
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
                  <h3 className="text-xl font-bold mb-4">Data Tools</h3>
                  <div className="flex items-center gap-4 flex-wrap">
                    <button
                      onClick={handleMigration}
                      className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all shadow-lg shadow-orange-500/20"
                    >
                      ⚠️ Fix Usernames (Lowercase)
                    </button>
                    <button
                      onClick={handleCleanupUser}
                      className="px-6 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold transition-all shadow-lg shadow-rose-500/20"
                    >
                      🗑️ Cleanup No-Email Users
                    </button>
                    {migrationStatus && (
                      <span className="font-mono text-sm opacity-70 bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded">
                        {migrationStatus}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <AdminUsersTab
                users={users}
                onRefresh={fetchData}
                onView={setViewingUser}
                onEdit={setEditingUser}
              />
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {editingUser && (
          <EditUserModal user={editingUser} setUser={setEditingUser} onSave={handleUpdateUser} />
        )}
        <ConfirmDialog
          isOpen={!!confirmConfig}
          title={confirmConfig?.title || ''}
          message={confirmConfig?.message || ''}
          isDangerous={confirmConfig?.isDangerous}
          onConfirm={() => handleClose(true)}
          onCancel={() => handleClose(false)}
        />
      </AnimatePresence>

      <AnimatePresence>
        {viewingUser && <ViewUserModal user={viewingUser} onClose={() => setViewingUser(null)} />}
      </AnimatePresence>
    </div>
  );
};

export default AdminPanel;
