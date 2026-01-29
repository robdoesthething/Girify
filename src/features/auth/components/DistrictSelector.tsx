/**
 * DistrictSelector Component
 *
 * Grid display for selecting a district during registration.
 */

import React from 'react';
import { DISTRICTS } from '../../../data/districts';
import { themeClasses } from '../../../utils/themeUtils';

interface DistrictSelectorProps {
  theme: 'light' | 'dark';
  selectedDistrict: string;
  onSelect: (districtId: string) => void;
  showTeamName?: boolean;
  maxHeight?: string;
}

const DistrictSelector: React.FC<DistrictSelectorProps> = ({
  theme,
  selectedDistrict,
  onSelect,
  showTeamName = false,
  maxHeight = 'max-h-48',
}) => {
  return (
    <div className={`grid grid-cols-2 gap-2 ${maxHeight} overflow-y-auto pr-1 custom-scrollbar`}>
      {DISTRICTS.map(d => (
        <button
          key={d.id}
          type="button"
          onClick={() => onSelect(d.id)}
          className={`relative flex items-center gap-4 p-3 rounded-xl border-2 transition-all text-left group
            ${
              selectedDistrict === d.id
                ? `border-${d.color.split('-')[1]}-500 bg-${d.color.split('-')[1]}-500/10 active-district-ring`
                : `border-transparent ${themeClasses(theme, 'bg-slate-800 hover:bg-slate-700', 'bg-slate-100 hover:bg-slate-50')} hover:border-slate-300 dark:hover:border-slate-600`
            }
          `}
        >
          <img
            src={d.logo}
            alt={d.teamName}
            className="w-8 h-8 object-contain"
            style={{ imageRendering: 'pixelated' }}
          />
          <div className="flex-1 min-w-0">
            <p
              className={`text-[10px] font-black uppercase truncate ${selectedDistrict === d.id ? 'text-sky-500' : 'text-slate-500'}`}
            >
              {d.name}
            </p>
            {showTeamName && (
              <p
                className={`text-xs font-bold truncate ${themeClasses(theme, 'text-white', 'text-slate-800')}`}
              >
                {d.teamName.replace(d.name, '').trim() || d.teamName}
              </p>
            )}
          </div>

          {selectedDistrict === d.id && (
            <div className="absolute inset-0 rounded-xl border-2 border-sky-500 pointer-events-none shadow-[0_0_10px_rgba(14,165,233,0.3)]" />
          )}
        </button>
      ))}
    </div>
  );
};

DistrictSelector.displayName = 'DistrictSelector';

export default DistrictSelector;
