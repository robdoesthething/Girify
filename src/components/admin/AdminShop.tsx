import { AnimatePresence, motion } from 'framer-motion';
import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  createShopItem,
  deleteShopItem,
  ShopItem,
  ShopItemType,
  updateShopItem,
} from '../../utils/shop';

interface AdminShopProps {
  items: { all: ShopItem[] };
  onRefresh: () => void;
  notify: (msg: string, type: 'success' | 'error') => void;
  confirm: (message: string, title?: string, isDangerous?: boolean) => Promise<boolean>;
}

const AdminShop: React.FC<AdminShopProps> = ({ items, onRefresh, notify, confirm }) => {
  const { theme } = useTheme();
  const [editingItem, setEditingItem] = useState<Partial<ShopItem> | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) {
      return;
    }

    try {
      if (isCreating) {
        if (!editingItem.id || !editingItem.type || !editingItem.cost) {
          notify('Missing required fields', 'error');
          return;
        }
        await createShopItem(editingItem as ShopItem);
        notify('Item created', 'success');
      } else {
        await updateShopItem(editingItem.id!, editingItem);
        notify('Item updated', 'success');
      }
      setEditingItem(null);
      setIsCreating(false);
      onRefresh();
    } catch {
      notify('Operation failed', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm('Are you sure you want to delete this item?', 'Delete Item', true))) {
      return;
    }
    try {
      await deleteShopItem(id);
      notify('Item deleted', 'success');
      onRefresh();
    } catch {
      notify('Delete failed', 'error');
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
        <h2 className="text-3xl font-black">Shop Management</h2>
        <button
          onClick={() => {
            setEditingItem({ type: 'avatar', cost: 100 });
            setIsCreating(true);
          }}
          className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-bold shadow-lg shadow-sky-500/20 transition-all"
        >
          + Add Item
        </button>
      </div>

      <div
        className={`rounded-2xl overflow-hidden border ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}
      >
        <table className="w-full text-left">
          <thead className={theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}>
            <tr>
              <th className="p-4 text-xs uppercase opacity-50">Preview</th>
              <th className="p-4 text-xs uppercase opacity-50">ID / Name</th>
              <th className="p-4 text-xs uppercase opacity-50">Type</th>
              <th className="p-4 text-xs uppercase opacity-50">Cost</th>
              <th className="p-4 text-xs uppercase opacity-50">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {items.all.map(item => (
              <tr
                key={item.id}
                className={theme === 'dark' ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}
              >
                <td className="p-4">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-10 h-10 object-contain rounded-md bg-slate-100 dark:bg-slate-800"
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
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setIsCreating(false);
                      }}
                      className="px-3 py-1 bg-sky-500/10 text-sky-500 rounded hover:bg-sky-500 hover:text-white transition-colors text-xs font-bold"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="px-3 py-1 bg-rose-500/10 text-rose-500 rounded hover:bg-rose-500 hover:text-white transition-colors text-xs font-bold"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`w-full max-w-lg p-6 rounded-3xl shadow-2xl ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}
            >
              <h3 className="text-2xl font-black mb-6">{isCreating ? 'New Item' : 'Edit Item'}</h3>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="shop-item-id"
                      className="text-xs uppercase font-bold opacity-50 block mb-1"
                    >
                      ID (Unique)
                    </label>
                    <input
                      id="shop-item-id"
                      value={editingItem.id || ''}
                      onChange={e => setEditingItem({ ...editingItem, id: e.target.value })}
                      disabled={!isCreating}
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                      placeholder="e.g. avatar_fox"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="shop-item-type"
                      className="text-xs uppercase font-bold opacity-50 block mb-1"
                    >
                      Type
                    </label>
                    <select
                      id="shop-item-type"
                      value={editingItem.type || 'avatar'}
                      onChange={e =>
                        setEditingItem({ ...editingItem, type: e.target.value as ShopItemType })
                      }
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                    >
                      <option value="avatar">Avatar</option>
                      <option value="frame">Frame</option>
                      <option value="title">Title</option>
                      <option value="special">Special</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="shop-item-name"
                    className="text-xs uppercase font-bold opacity-50 block mb-1"
                  >
                    Name
                  </label>
                  <input
                    id="shop-item-name"
                    value={editingItem.name || ''}
                    onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                    placeholder="Display Name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs uppercase font-bold opacity-50 block mb-1">
                      Cost (Giuros)
                    </label>
                    <input
                      id="shop-item-cost"
                      type="number"
                      value={editingItem.cost || 0}
                      onChange={e =>
                        setEditingItem({ ...editingItem, cost: parseInt(e.target.value, 10) })
                      }
                      aria-label="Cost in Giuros"
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-yellow-500 font-bold outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase font-bold opacity-50 block mb-1">
                      Emoji (Optional)
                    </label>
                    <input
                      id="shop-item-emoji"
                      value={editingItem.emoji || ''}
                      onChange={e => setEditingItem({ ...editingItem, emoji: e.target.value })}
                      aria-label="Emoji Icon"
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                      placeholder="🦊"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="shop-item-image"
                    className="text-xs uppercase font-bold opacity-50 block mb-1"
                  >
                    Image URL (Optional)
                  </label>
                  <input
                    id="shop-item-image"
                    value={editingItem.image || ''}
                    onChange={e => setEditingItem({ ...editingItem, image: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                    placeholder="/images/avatars/..."
                  />
                </div>

                {editingItem.type === 'frame' && (
                  <div>
                    <label className="text-xs uppercase font-bold opacity-50 block mb-1">
                      CSS Class (for Frames)
                    </label>
                    <input
                      value={editingItem.cssClass || ''}
                      onChange={e => setEditingItem({ ...editingItem, cssClass: e.target.value })}
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs"
                      placeholder="ring-4 ring-orange-500"
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="flex-1 py-3 font-bold opacity-60 hover:opacity-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold shadow-lg"
                  >
                    {isCreating ? 'Create Item' : 'Save Changes'}
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

export default AdminShop;
