import { AnimatePresence } from 'framer-motion';
import React from 'react';
import { Button, Card, Heading } from '../../components/ui';
import { useTheme } from '../../context/ThemeContext';
import { useAdminCRUD } from '../../hooks/useAdminCRUD';
import {
  createShopItem,
  deleteShopItem,
  ShopItem,
  syncWithLocal,
  updateShopItem,
} from '../../utils/shop';
import { themeClasses } from '../../utils/themeUtils';
import AdminShopForm from './AdminShopForm';

interface AdminShopProps {
  items: { all: ShopItem[] };
  onRefresh: () => void;
  notify: (msg: string, type: 'success' | 'error' | 'info') => void;
  confirm: (message: string, title?: string, isDangerous?: boolean) => Promise<boolean>;
}

const AdminShop: React.FC<AdminShopProps> = ({ items, onRefresh, notify, confirm }) => {
  const { theme } = useTheme();
  const {
    editingItem,
    setEditingItem,
    isCreating,
    loading,
    handleCreate,
    handleUpdate,
    handleDelete,
    startEdit,
    startCreate,
    cancelEdit,
  } = useAdminCRUD<ShopItem>({
    createFn: createShopItem,
    updateFn: updateShopItem,
    deleteFn: deleteShopItem,
    refreshFn: onRefresh,
    notify,
    confirm,
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) {
      return;
    }

    if (isCreating) {
      if (!editingItem.id || !editingItem.type || !editingItem.cost) {
        notify('Missing required fields', 'error');
        return;
      }
      handleCreate(editingItem);
    } else {
      handleUpdate(editingItem.id!, editingItem);
    }
  };

  const getTypeStyle = (type: string) => {
    if (type === 'avatar') {
      return 'bg-purple-100 text-purple-600';
    }
    if (type === 'frame') {
      return 'bg-orange-100 text-orange-600';
    }
    return 'bg-slate-100 text-slate-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Heading variant="h2" className="mb-0">
          Shop Management
        </Heading>
        <div className="flex gap-4">
          <Button
            variant="ghost"
            onClick={async () => {
              if (
                await confirm(
                  'This will overwrite Firestore shop items with local cosmetics.json data. Continue?',
                  'Sync Shop Items',
                  true
                )
              ) {
                try {
                  notify('Syncing...', 'success');
                  const { updated, errors } = await syncWithLocal();
                  notify(
                    `Synced ${updated} items. Errors: ${errors}`,
                    errors > 0 ? 'error' : 'success'
                  );
                  onRefresh();
                } catch {
                  notify('Sync failed', 'error');
                }
              }
            }}
            className="text-indigo-500 hover:text-indigo-600 bg-indigo-500/10 hover:bg-indigo-500/20"
          >
            ↻ Sync Local
          </Button>
          <Button
            variant="primary"
            onClick={startCreate}
            className="bg-sky-500 hover:bg-sky-600 text-white shadow-sky-500/20"
          >
            + Add Item
          </Button>
        </div>
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className={themeClasses(theme, 'bg-slate-800', 'bg-slate-100')}>
              <tr>
                <th className="p-4 text-xs uppercase opacity-50">Preview</th>
                <th className="p-4 text-xs uppercase opacity-50">ID / Name</th>
                <th className="p-4 text-xs uppercase opacity-50">Type</th>
                <th className="p-4 text-xs uppercase opacity-50">Cost</th>
                <th className="p-4 text-xs uppercase opacity-50">Actions</th>
              </tr>
            </thead>
            <tbody
              className={`divide-y divide-slate-200 dark:divide-slate-700 ${loading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              {items.all.map(item => (
                <tr
                  key={item.id}
                  className={themeClasses(theme, 'hover:bg-slate-800/50', 'hover:bg-slate-50')}
                >
                  <td className="p-4">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-10 h-10 object-contain rounded-md"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    ) : (
                      <span className="text-2xl">{item.emoji || '📦'}</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="font-bold">{item.name || item.id}</div>
                    <div className="text-xs opacity-50 font-mono">{item.id}</div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold uppercase ${getTypeStyle(item.type)}`}
                    >
                      {item.type}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-yellow-500">{item.cost} 🪙</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(item)}
                        className="text-sky-500 hover:text-white hover:bg-sky-500 h-7 text-xs"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        className="text-rose-500 hover:text-white hover:bg-rose-500 h-7 text-xs"
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <AnimatePresence>
        {(editingItem || isCreating) && (
          <AdminShopForm
            editingItem={editingItem || { type: 'avatar', cost: 100 }}
            isCreating={isCreating}
            theme={theme}
            onSave={handleSave}
            onCancel={cancelEdit}
            onChange={updates => setEditingItem({ ...editingItem, ...updates })}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminShop;
