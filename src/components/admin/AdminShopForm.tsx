import { motion } from 'framer-motion';
import React from 'react';
import { ShopItem, ShopItemType } from '../../utils/shop';
import { themeClasses } from '../../utils/themeUtils';

interface AdminShopFormProps {
  editingItem: Partial<ShopItem>;
  isCreating: boolean;
  theme: 'light' | 'dark';
  onSave: (e: React.FormEvent) => void;
  onCancel: () => void;
  onChange: (updates: Partial<ShopItem>) => void;
}

import FormInput from '../FormInput';

// ... existing imports

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
        className={`w-full max-w-lg p-6 rounded-3xl shadow-2xl ${themeClasses(theme, 'bg-slate-800', 'bg-white')}`}
      >
        <h3 className="text-2xl font-black mb-6">{isCreating ? 'New Item' : 'Edit Item'}</h3>
        <form onSubmit={onSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              id="shop-item-id"
              label="ID (Unique)"
              value={editingItem.id || ''}
              onChange={e => onChange({ id: e.target.value })}
              disabled={!isCreating}
              placeholder="e.g. avatar_fox"
              className="font-mono"
            />
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
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-sky-500 transition-all font-bold"
              >
                <option value="avatar">Avatar</option>
                <option value="frame">Frame</option>
                <option value="title">Title</option>
                <option value="special">Special</option>
              </select>
            </div>
          </div>

          <FormInput
            id="shop-item-name"
            label="Name"
            value={editingItem.name || ''}
            onChange={e => onChange({ name: e.target.value })}
            placeholder="Display Name"
          />

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              id="shop-item-cost"
              label="Cost (Giuros)"
              type="number"
              value={editingItem.cost || 0}
              onChange={e => onChange({ cost: parseInt(e.target.value, 10) })}
              className="font-mono text-yellow-500 font-bold"
            />
            <FormInput
              id="shop-item-emoji"
              label="Emoji (Optional)"
              value={editingItem.emoji || ''}
              onChange={e => onChange({ emoji: e.target.value })}
              className="text-center"
              placeholder="🦊"
            />
          </div>

          <FormInput
            id="shop-item-image"
            label="Image URL (Optional)"
            value={editingItem.image || ''}
            onChange={e => onChange({ image: e.target.value })}
            className="text-xs font-mono"
            placeholder="/images/avatars/..."
          />

          {editingItem.type === 'frame' && (
            <FormInput
              label="CSS Class (for Frames)"
              value={editingItem.cssClass || ''}
              onChange={e => onChange({ cssClass: e.target.value })}
              className="font-mono text-xs"
              placeholder="ring-4 ring-orange-500"
            />
          )}

          <div className="flex gap-4 pt-4">
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
