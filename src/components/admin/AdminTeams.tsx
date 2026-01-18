import React, { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { DISTRICTS } from '../../data/districts';
import { getAllUsers, getDistrictRankings } from '../../utils/social';

interface TeamStats {
  id: string;
  name: string;
  teamName: string;
  score: number;
  members: number;
  color: string;
  avgScore: number;
}

const AdminTeams: React.FC = () => {
  const { theme } = useTheme();
  const [stats, setStats] = useState<TeamStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<keyof TeamStats>('score');
  const [sortDesc, setSortDesc] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [districtDocs, allUsers] = await Promise.all([
        getDistrictRankings(),
        getAllUsers(10000), // Get many users to count accurately
      ]);

      const distMap = new Map<string, number>();
      districtDocs.forEach(d => distMap.set(d.id, d.score));

      const memberMap = new Map<string, number>();
      allUsers.forEach(u => {
        if (u.district) {
          memberMap.set(u.district, (memberMap.get(u.district) || 0) + 1);
        }
      });

      const teamStats: TeamStats[] = DISTRICTS.map(d => {
        const score = distMap.get(d.id) || 0;
        const members = memberMap.get(d.id) || 0;
        return {
          id: d.id,
          name: d.name,
          teamName: d.teamName,
          score,
          members,
          color: d.color,
          avgScore: members > 0 ? Math.round(score / members) : 0,
        };
      });

      setStats(teamStats);
    } catch (e) {
      console.error('Error loading team stats', e);
    } finally {
      setLoading(false);
    }
  };

  const sortedStats = [...stats].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];

    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortDesc ? valB.localeCompare(valA) : valA.localeCompare(valB);
    }

    // Numeric sort
    return sortDesc ? (valB as number) - (valA as number) : (valA as number) - (valB as number);
  });

  const handleSort = (field: keyof TeamStats) => {
    if (sortField === field) {
      setSortDesc(!sortDesc);
    } else {
      setSortField(field);
      setSortDesc(true);
    }
  };

  const SortIcon = ({ field }: { field: keyof TeamStats }) => {
    if (sortField !== field) {
      return <span className="opacity-20">↕</span>;
    }
    return <span>{sortDesc ? '↓' : '↑'}</span>;
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 animate-pulse">Loading team statistics...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black">District Teams</h2>
        <button
          onClick={loadData}
          className="px-4 py-2 text-sm bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
        >
          Refresh Data
        </button>
      </div>

      <div
        className={`rounded-xl border overflow-hidden ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead
              className={`text-xs uppercase font-bold ${theme === 'dark' ? 'bg-slate-900/50 text-slate-400' : 'bg-slate-50 text-slate-500'}`}
            >
              <tr>
                <th
                  className="px-6 py-4 cursor-pointer hover:bg-black/5"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    District <SortIcon field="name" />
                  </div>
                </th>
                <th
                  className="px-6 py-4 cursor-pointer hover:bg-black/5"
                  onClick={() => handleSort('teamName')}
                >
                  <div className="flex items-center gap-1">
                    Team <SortIcon field="teamName" />
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-right cursor-pointer hover:bg-black/5"
                  onClick={() => handleSort('members')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Members <SortIcon field="members" />
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-right cursor-pointer hover:bg-black/5"
                  onClick={() => handleSort('score')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Total Score <SortIcon field="score" />
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-right cursor-pointer hover:bg-black/5"
                  onClick={() => handleSort('avgScore')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Avg Score <SortIcon field="avgScore" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {sortedStats.map(team => (
                <tr key={team.id} className="hover:bg-black/5 transition-colors">
                  <td className="px-6 py-4 font-medium">{team.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {DISTRICTS.find(d => d.id === team.id)?.logo && (
                        <img
                          src={DISTRICTS.find(d => d.id === team.id)?.logo}
                          alt=""
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      )}
                      <span
                        className={`font-black bg-gradient-to-r ${team.color} bg-clip-text text-transparent`}
                      >
                        {team.teamName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono">
                    {team.members.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-sky-500">
                    {team.score.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right font-mono opacity-70">
                    {team.avgScore.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminTeams;
