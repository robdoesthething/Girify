/**
 * SelectedDistrictPreview Component
 *
 * Shows the selected district with team logo preview.
 */

import React from 'react';
import { DISTRICTS } from '../../../data/districts';

interface SelectedDistrictPreviewProps {
  districtId: string;
  t: (key: string) => string;
}

const SelectedDistrictPreview: React.FC<SelectedDistrictPreviewProps> = ({ districtId, t }) => {
  const d = DISTRICTS.find(dist => dist.id === districtId);
  if (!d) {
    return null;
  }

  return (
    <div className="mt-4 p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-4 animate-fadeIn">
      <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${d.color} p-0.5 shadow-lg`}>
        <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden border-2 border-white/20">
          <img src={d.logo} alt={d.teamName} className="w-full h-full object-cover" />
        </div>
      </div>
      <div>
        <p className="text-xs font-bold opacity-50 uppercase tracking-widest">
          {t('youAreJoining') || 'You are joining'}
        </p>
        <h3
          className={`text-xl font-black bg-gradient-to-r ${d.color} bg-clip-text text-transparent`}
        >
          {d.teamName}
        </h3>
      </div>
    </div>
  );
};

SelectedDistrictPreview.displayName = 'SelectedDistrictPreview';

export default SelectedDistrictPreview;
