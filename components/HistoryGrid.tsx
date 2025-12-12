import React from 'react';
import { DayRecord } from '../types';
import { ChevronLeft, ChevronRight, Trophy, XCircle } from 'lucide-react';

interface HistoryGridProps {
  history: Record<string, DayRecord>;
  currentDate: string;
}

const HistoryGrid: React.FC<HistoryGridProps> = ({ history, currentDate }) => {
  const today = new Date();
  const [viewDate, setViewDate] = React.useState(today);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: days }, (_, i) => i + 1);
  };

  const changeMonth = (delta: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1));
  };

  const days = getDaysInMonth(viewDate);
  const monthName = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Helpers to calculate stats for this month
  let wins = 0;
  let losses = 0;
  
  days.forEach(day => {
    const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const record = history[dateStr];
    if (record?.status === 'WIN') wins++;
    if (record?.status === 'LOSS') losses++;
  });

  return (
    <div className="bg-card rounded-2xl p-6 shadow-xl border border-slate-700 w-full max-w-xl mx-auto h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          History
        </h2>
        <div className="flex items-center gap-2 bg-slate-900 rounded-lg p-1">
          <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-semibold w-32 text-center text-slate-200 select-none">
            {monthName}
          </span>
          <button onClick={() => changeMonth(1)} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-6">
        {['S','M','T','W','T','F','S'].map(d => (
          <div key={d} className="text-center text-slate-500 text-xs font-bold mb-2">{d}</div>
        ))}
        
        {/* Empty cells for start of month */}
        {Array.from({ length: new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay() }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {days.map(day => {
            const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const record = history[dateStr];
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            
            let bgClass = 'bg-slate-800/50 border-slate-700 text-slate-500';
            let content = <span className="text-sm">{day}</span>;

            if (record) {
                if (record.status === 'WIN') {
                    bgClass = 'bg-win border-win text-white shadow-[0_0_10px_rgba(34,197,94,0.4)]';
                    content = <span className="font-black text-lg">W</span>;
                } else if (record.status === 'LOSS') {
                    bgClass = 'bg-loss border-loss text-white';
                    content = <span className="font-black text-lg">L</span>;
                } else if (isToday) {
                    bgClass = 'bg-indigo-600 border-indigo-500 text-white animate-pulse';
                    content = <span className="font-bold">{day}</span>;
                }
            } else if (isToday) {
                 bgClass = 'bg-indigo-900/50 border-indigo-500 text-indigo-200';
            }

            return (
                <div 
                    key={day} 
                    className={`aspect-square rounded-lg border flex items-center justify-center transition-all ${bgClass}`}
                >
                    {content}
                </div>
            )
        })}
      </div>

      <div className="flex justify-around border-t border-slate-700 pt-4">
        <div className="flex flex-col items-center">
            <span className="text-xs text-slate-500 uppercase tracking-wider">Wins</span>
            <span className="text-2xl font-black text-win">{wins}</span>
        </div>
        <div className="flex flex-col items-center">
            <span className="text-xs text-slate-500 uppercase tracking-wider">Losses</span>
            <span className="text-2xl font-black text-loss">{losses}</span>
        </div>
        <div className="flex flex-col items-center">
            <span className="text-xs text-slate-500 uppercase tracking-wider">Win Rate</span>
            <span className="text-2xl font-black text-white">
                {wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0}%
            </span>
        </div>
      </div>
    </div>
  );
};

export default HistoryGrid;
