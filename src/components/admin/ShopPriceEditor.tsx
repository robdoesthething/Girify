import React from 'react';
import { ShopItem } from '../../utils/shop';
import { themeClasses } from '../../utils/themeUtils';

interface ShopPriceEditorProps {
  items: ShopItem[];
  onUpdatePrice: (item: ShopItem, newPrice: number) => void;
  theme: 'light' | 'dark';
}

const ShopPriceEditor: React.FC<ShopPriceEditorProps> = ({ items, onUpdatePrice, theme }) => {
  const handleEdit = (item: ShopItem) => {
    // eslint-disable-next-line no-alert
    const newPriceStr = window.prompt(`Enter new price for ${item.name}:`);
    if (newPriceStr !== null) {
      const newPriceValue = parseInt(newPriceStr, 10);
      if (!isNaN(newPriceValue) && newPriceValue >= 0) {
        onUpdatePrice(item, newPriceValue);
      }
    }
  };

  return (
    <div
      className={`p-6 rounded-2xl border ${themeClasses(theme, 'bg-slate-800 border-slate-700', 'bg-white border-slate-200')}`}
    >
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span>📉</span> Sinks (Shop Prices)
      </h3>
      <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
        {items
          ?.sort((a, b) => (a.cost || 0) - (b.cost || 0))
          .map(item => (
            <div
              key={item.id}
              className="flex justify-between items-center bg-slate-100 dark:bg-slate-700/50 p-2 rounded-lg group"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{item.emoji || '📦'}</span>
                <div className="flex flex-col">
                  <span className="font-bold text-sm">{item.name}</span>
                  <span className="text-[10px] opacity-60 uppercase">{item.type}</span>
                </div>
              </div>
              <button
                onClick={() => handleEdit(item)}
                className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                title="Click to edit price"
              >
                <span className="font-mono font-bold text-red-400">-{item.cost || 0}</span>
                <span className="opacity-0 group-hover:opacity-100 text-xs">✏️</span>
              </button>
            </div>
          ))}
        {(!items || items.length === 0) && (
          <p className="opacity-50 text-center text-sm">No shop items found.</p>
        )}
      </div>
    </div>
  );
};

export default ShopPriceEditor;
