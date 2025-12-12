import React from 'react';
import { DayRecord } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

interface StatsViewProps {
  history: Record<string, DayRecord>;
  streak: number;
  bestStreak: number;
}

const StatsView: React.FC<StatsViewProps> = ({ history, streak, bestStreak }) => {
  const records = Object.values(history) as DayRecord[];
  const totalWins = records.filter(r => r.status === 'WIN').length;
  const totalLosses = records.filter(r => r.status === 'LOSS').length;

  const pieData = [
    { name: 'Wins', value: totalWins },
    { name: 'Losses', value: totalLosses },
  ];
  const COLORS = ['#22c55e', '#ef4444'];

  // Calculate weekly performance (last 7 days)
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      const record = history[iso];
      let val = 0; // 0 = nothing, 1 = loss, 2 = win
      if (record?.status === 'WIN') val = 5;
      else if (record?.tasks) val = record.tasks.filter(t => t.completed).length;
      
      days.push({
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        completed: val
      });
    }
    return days;
  };

  const barData = getLast7Days();

  return (
    <div className="grid grid-cols-1 gap-6 w-full max-w-xl mx-auto">
      
      {/* Streak Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card p-4 rounded-xl border border-slate-700 text-center">
            <div className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Current Streak</div>
            <div className="text-4xl font-black text-white flex justify-center items-baseline gap-1">
                {streak} <span className="text-sm font-medium text-slate-500">days</span>
            </div>
        </div>
        <div className="bg-card p-4 rounded-xl border border-slate-700 text-center">
            <div className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Best Streak</div>
            <div className="text-4xl font-black text-yellow-500 flex justify-center items-baseline gap-1">
                {bestStreak} <span className="text-sm font-medium text-slate-500">days</span>
            </div>
        </div>
      </div>

      {/* Win Ratio */}
      <div className="bg-card p-6 rounded-xl border border-slate-700 h-64 flex flex-col items-center justify-center">
        <h3 className="text-white font-bold mb-4">Win / Loss Ratio</h3>
        {totalWins + totalLosses === 0 ? (
            <div className="text-slate-500">No data yet.</div>
        ) : (
            <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                data={pieData}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
                >
                {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
                </Pie>
                <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                />
            </PieChart>
            </ResponsiveContainer>
        )}
      </div>

      {/* Last 7 Days Tasks */}
      <div className="bg-card p-6 rounded-xl border border-slate-700 h-64">
         <h3 className="text-white font-bold mb-4">Last 7 Days (Tasks Completed)</h3>
         <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
                <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={[0, 5]} />
                <Tooltip 
                    cursor={{fill: '#334155'}}
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="completed" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
         </ResponsiveContainer>
      </div>

    </div>
  );
};

export default StatsView;