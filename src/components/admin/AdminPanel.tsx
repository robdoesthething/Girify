import { AnimatePresence } from 'framer-motion';
import React, { useState } from 'react';
import { Button, Card, Heading, Spinner, Tabs } from '../../components/ui';
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
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'users', label: 'Users' },
  { id: 'teams', label: 'Teams' },
  { id: 'gamemaster', label: 'Game Master' },
  { id: 'achievements', label: 'Achievements' },
  { id: 'content', label: 'Content' },
  { id: 'shop', label: 'Shop' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'announcements', label: 'Announcements' },
  { id: 'giuros', label: 'Giuros' },
  { id: 'config', label: 'Config' },
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

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'gamemaster':
        return <AdminGameMaster onNotify={notify} confirm={confirm} />;
      case 'teams':
        return <AdminTeams />;
      case 'achievements':
        return <AdminAchievements onNotify={notify} confirm={confirm} />;
      case 'content':
        return <AdminContent onNotify={notify} confirm={confirm} />;
      case 'giuros':
        return <AdminGiuros users={users} shopItems={shopItems} theme={theme} />;
      case 'shop':
        return (
          <AdminShop items={shopItems} onRefresh={fetchData} notify={notify} confirm={confirm} />
        );
      case 'feedback':
        return (
          <AdminFeedback
            feedback={feedback}
            onRefresh={fetchData}
            notify={notify}
            confirm={confirm}
          />
        );
      case 'announcements':
        return (
          <AdminAnnouncements
            announcements={announcements}
            onRefresh={fetchData}
            notify={notify}
            confirm={confirm}
          />
        );
      case 'config':
        return <AdminConfig onNotify={notify} />;
      case 'users':
        return (
          <AdminUsersTab
            users={users}
            onRefresh={fetchData}
            onView={setViewingUser}
            onEdit={setEditingUser}
          />
        );
      case 'dashboard':
      default:
        return (
          <div className="space-y-8">
            <Heading variant="h2">Overview</Heading>
            {metrics ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <MetricCard title="Total Users" value={metrics.totalUsers} color="text-sky-500" />
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
              <div className="py-12 flex justify-center">
                <Spinner />
              </div>
            )}

            {/* Data Tools */}
            <Card className="p-6">
              <Heading variant="h4" className="mb-4">
                Data Tools
              </Heading>
              <div className="flex items-center gap-4 flex-wrap">
                <Button
                  onClick={handleMigration}
                  className="bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20"
                >
                  ⚠️ Fix Usernames (Lowercase)
                </Button>
                <Button
                  onClick={handleCleanupUser}
                  className="bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20"
                >
                  🗑️ Cleanup No-Email Users
                </Button>
                {migrationStatus && (
                  <span className="font-mono text-sm opacity-70 bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded">
                    {migrationStatus}
                  </span>
                )}
              </div>
            </Card>
          </div>
        );
    }
  };

  return (
    <div
      className={`fixed inset-0 pt-16 flex flex-col ${themeClasses(theme, 'bg-slate-900 text-white', 'bg-slate-50 text-slate-900')}`}
    >
      <div
        className={`px-6 py-4 border-b ${themeClasses(theme, 'border-slate-800 bg-slate-900', 'border-slate-200 bg-white')}`}
      >
        <div className="flex items-center justify-between mb-4">
          <Heading variant="h3" className="text-sky-500 mb-0">
            Girify Admin
          </Heading>
        </div>
        <div className="overflow-x-auto pb-2 scrollbar-hide">
          <Tabs tabs={ADMIN_TABS} activeTab={activeTab} onChange={id => setActiveTab(id)} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 pb-20">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="w-full max-w-7xl mx-auto">{renderContent()}</div>
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
