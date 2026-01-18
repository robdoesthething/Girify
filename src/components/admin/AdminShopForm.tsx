import { motion } from 'framer-motion';
import React from 'react';
import { ShopItem, ShopItemType } from '../../utils/shop';

interface AdminShopFormProps {
  editingItem: Partial<ShopItem>;
  isCreating: boolean;
  theme: string;
  onSave: (e: React.FormEvent) => void;
  onCancel: () => void;
  onChange: (updates: Partial<ShopItem>) => void;
}

const AdminShopForm: React.FC<AdminShopFormProps> = ({
  editingItem,
  isCreating,
  theme,
  onSave,
  onCancel,
  onChange,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={`w-full max-w-lg p-6 rounded-3xl shadow-2xl ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}
      >
        <h3 className="text-2xl font-black mb-6">{isCreating ? 'New Item' : 'Edit Item'}</h3>
        <form onSubmit={onSave} className="space-y-4">
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
                onChange={e => onChange({ id: e.target.value })}
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
                onChange={e => onChange({ type: e.target.value as ShopItemType })}
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
              onChange={e => onChange({ name: e.target.value })}
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
                onChange={e => onChange({ cost: parseInt(e.target.value, 10) })}
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
                onChange={e => onChange({ emoji: e.target.value })}
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
              onChange={e => onChange({ image: e.target.value })}
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
                onChange={e => onChange({ cssClass: e.target.value })}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs"
                placeholder="ring-4 ring-orange-500"
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
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
  );
};

export default AdminShopForm;
