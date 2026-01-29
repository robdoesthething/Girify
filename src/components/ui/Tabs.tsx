import { motion } from 'framer-motion';
import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { themeClasses } from '../../utils/themeUtils';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  fullWidth?: boolean;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, fullWidth = false }) => {
  const { theme } = useTheme();

  return (
    <div
      className={`
      flex p-1 rounded-xl mb-6 space-x-1
      ${themeClasses(theme, 'bg-slate-800', 'bg-slate-100')}
      ${fullWidth ? 'w-full' : 'inline-flex'}
    `}
    >
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              relative flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all
              ${fullWidth ? 'flex-1' : ''}
              ${
                isActive
                  ? themeClasses(theme, 'text-white', 'text-slate-900')
                  : themeClasses(
                      theme,
                      'text-slate-400 hover:text-slate-300',
                      'text-slate-500 hover:text-slate-700'
                    )
              }
            `}
          >
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className={`absolute inset-0 rounded-lg shadow-sm ${themeClasses(theme, 'bg-slate-700', 'bg-white')}`}
                transition={{ type: 'spring', duration: 0.5 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {tab.icon}
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
