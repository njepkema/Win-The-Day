import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, DayRecord, Task, ViewMode } from './types';
import TaskBoard from './components/TaskBoard';
import HistoryGrid from './components/HistoryGrid';
import StatsView from './components/StatsView';
import { getDailyMotivation } from './services/gemini';
import { LayoutDashboard, Calendar, TrendingUp, Award, Settings, Download, Upload, X } from 'lucide-react';

// Initial dummy state
const INITIAL_TASKS: Task[] = Array.from({ length: 5 }).map((_, i) => ({
  id: `task-${i}`,
  text: '',
  completed: false
}));

const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<string>('');
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [history, setHistory] = useState<Record<string, DayRecord>>({});
  const [view, setView] = useState<ViewMode>('DASHBOARD');
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [motivation, setMotivation] = useState<string>("Loading motivation...");
  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load data from storage on mount
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setCurrentDate(today);

    loadFromStorage(today);

    // Initial AI motivation fetch
    fetchMotivation(0, 'IN_PROGRESS');
  }, []);

  const loadFromStorage = (today: string) => {
    const storedData = localStorage.getItem('win-the-day-data');
    if (storedData) {
      try {
        const parsed: AppState = JSON.parse(storedData);
        setHistory(parsed.history || {});
        setStreak(parsed.streak || 0);
        setBestStreak(parsed.bestStreak || 0);

        // Check if we have a record for today
        if (parsed.history && parsed.history[today]) {
          setTasks(parsed.history[today].tasks);
        } else {
          setTasks(INITIAL_TASKS);
        }
      } catch (e) {
        console.error("Failed to parse storage", e);
        setTasks(INITIAL_TASKS);
      }
    }
  };

  const fetchMotivation = async (s: number, status: 'WIN' | 'LOSS' | 'IN_PROGRESS') => {
      const quote = await getDailyMotivation(s, status);
      setMotivation(quote);
  };

  // Save logic and Win/Loss Calculation
  useEffect(() => {
    if (!currentDate) return;

    const completedCount = tasks.filter(t => t.completed).length;
    
    // Determine status
    let status: 'WIN' | 'LOSS' | 'IN_PROGRESS' = 'IN_PROGRESS';
    if (completedCount === 5) status = 'WIN';
    
    // Update History Record
    const newRecord: DayRecord = {
      date: currentDate,
      tasks: tasks,
      status: status
    };

    const newHistory = { ...history, [currentDate]: newRecord };
    
    // Calculate Streak based on history
    // Simple logic: count backwards from yesterday. 
    // If today is a WIN, add 1.
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    let checkDate = yesterday;
    
    let calculatedStreak = 0;
    
    // Check if yesterday was a win, keep going back
    while (true) {
        const iso = checkDate.toISOString().split('T')[0];
        if (newHistory[iso]?.status === 'WIN') {
            calculatedStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }

    // Add today if won
    if (status === 'WIN') {
        calculatedStreak++;
    }

    const newBest = Math.max(bestStreak, calculatedStreak);

    // Create state object for saving
    const newState: AppState = {
        currentDate,
        history: newHistory,
        streak: calculatedStreak,
        bestStreak: newBest
    };

    localStorage.setItem('win-the-day-data', JSON.stringify(newState));
    
    // Update local state
    setHistory(newHistory);
    setStreak(calculatedStreak);
    setBestStreak(newBest);

  }, [tasks, currentDate]); 

  const handleTasksChange = (newTasks: Task[]) => {
    setTasks(newTasks);
  };

  const handleExportData = () => {
    const data = localStorage.getItem('win-the-day-data');
    if (!data) return;
    
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `win-the-day-backup-${currentDate}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        // Validate JSON basically
        const parsed = JSON.parse(content);
        if (parsed.history) {
          localStorage.setItem('win-the-day-data', content);
          // Reload state
          loadFromStorage(currentDate);
          setShowSettings(false);
          alert('Data restored successfully!');
        } else {
          alert('Invalid backup file format.');
        }
      } catch (error) {
        console.error(error);
        alert('Failed to read backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-dark text-slate-100 flex flex-col pb-20 md:pb-0">
      
      {/* Top Bar */}
      <header className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <Award className={`text-win ${streak > 0 ? 'animate-pulse-fast' : ''}`} size={28} />
                <div>
                    <h1 className="font-black text-xl uppercase tracking-tighter leading-none">Win The Day</h1>
                    <p className="text-xs text-slate-400 font-medium">Streak: <span className="text-white">{streak}</span></p>
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                    <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider mb-1">Daily Focus</p>
                    <p className="text-sm font-medium text-slate-300 italic max-w-xs truncate">"{motivation}"</p>
                </div>
                <button 
                  onClick={() => setShowSettings(true)}
                  className="p-2 text-slate-400 hover:text-white transition-colors"
                >
                  <Settings size={20} />
                </button>
            </div>
        </div>
      </header>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card w-full max-w-sm rounded-2xl border border-slate-700 p-6 shadow-2xl relative">
            <button 
              onClick={() => setShowSettings(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-xl font-bold text-white mb-6">Data & Settings</h2>
            
            <div className="space-y-4">
              <button 
                onClick={handleExportData}
                className="w-full flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-700 text-white p-4 rounded-xl border border-slate-700 transition-all"
              >
                <Download size={20} className="text-indigo-400" />
                <span className="font-medium">Backup Data</span>
              </button>

              <div className="relative">
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImportData}
                  accept=".json"
                  className="hidden"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-700 text-white p-4 rounded-xl border border-slate-700 transition-all"
                >
                  <Upload size={20} className="text-win" />
                  <span className="font-medium">Restore Data</span>
                </button>
              </div>

              <div className="text-center text-xs text-slate-500 mt-4">
                <p>Your data is stored locally on this device.</p>
                <p>Export regularly to keep it safe.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-8">
            {view === 'DASHBOARD' && (
                <div className="animate-in fade-in zoom-in duration-300">
                    <TaskBoard tasks={tasks} onTasksChange={handleTasksChange} isLocked={false} />
                    {/* Mobile motivation */}
                    <div className="mt-8 text-center sm:hidden">
                        <p className="text-sm text-slate-500 italic">"{motivation}"</p>
                    </div>
                </div>
            )}
            
            {view === 'HISTORY' && (
                <div className="animate-in fade-in slide-in-from-right duration-300">
                    <HistoryGrid history={history} currentDate={currentDate} />
                </div>
            )}

            {view === 'ANALYTICS' && (
                <div className="animate-in fade-in slide-in-from-right duration-300">
                    <StatsView history={history} streak={streak} bestStreak={bestStreak} />
                </div>
            )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-slate-900 border-t border-slate-800 p-2 z-50 md:sticky md:bottom-auto">
        <div className="max-w-md mx-auto flex justify-around">
            <button 
                onClick={() => setView('DASHBOARD')}
                className={`flex flex-col items-center p-2 rounded-xl transition-all ${view === 'DASHBOARD' ? 'text-indigo-400 bg-indigo-900/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <LayoutDashboard size={24} />
                <span className="text-[10px] font-bold mt-1 uppercase">Today</span>
            </button>
            <button 
                onClick={() => setView('HISTORY')}
                className={`flex flex-col items-center p-2 rounded-xl transition-all ${view === 'HISTORY' ? 'text-indigo-400 bg-indigo-900/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <Calendar size={24} />
                <span className="text-[10px] font-bold mt-1 uppercase">History</span>
            </button>
            <button 
                onClick={() => setView('ANALYTICS')}
                className={`flex flex-col items-center p-2 rounded-xl transition-all ${view === 'ANALYTICS' ? 'text-indigo-400 bg-indigo-900/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <TrendingUp size={24} />
                <span className="text-[10px] font-bold mt-1 uppercase">Stats</span>
            </button>
        </div>
      </nav>

    </div>
  );
};

export default App;