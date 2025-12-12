import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { CheckCircle, Circle, BrainCircuit, RotateCcw, Lock } from 'lucide-react';
import { generateSmartTasks } from '../services/gemini';

interface TaskBoardProps {
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
  isLocked: boolean; // Once checked off, maybe lock editing? Or allow flexible editing until day end.
}

const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, onTasksChange, isLocked }) => {
  const [goalInput, setGoalInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAiInput, setShowAiInput] = useState(false);

  const toggleTask = (id: string) => {
    const newTasks = tasks.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    onTasksChange(newTasks);
  };

  const updateTaskText = (id: string, text: string) => {
    const newTasks = tasks.map(t => 
      t.id === id ? { ...t, text } : t
    );
    onTasksChange(newTasks);
  };

  const handleAiGenerate = async () => {
    if (!goalInput.trim()) return;
    setIsGenerating(true);
    const result = await generateSmartTasks(goalInput);
    
    // Map AI result strings to existing task objects
    const newTasks = tasks.map((t, index) => ({
      ...t,
      text: result.tasks[index] || t.text,
      completed: false // Reset completion if regenerating
    }));
    
    onTasksChange(newTasks);
    setIsGenerating(false);
    setShowAiInput(false);
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const isAllComplete = completedCount === 5;

  return (
    <div className="bg-card rounded-2xl p-6 shadow-xl border border-slate-700 w-full max-w-xl mx-auto">
      
      {/* Header / AI Control */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">The Power List</h2>
          <p className="text-slate-400 text-sm">Complete 5 critical tasks to win.</p>
        </div>
        <button 
          onClick={() => setShowAiInput(!showAiInput)}
          className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors text-sm font-medium"
        >
          <BrainCircuit size={18} />
          <span>AI Suggest</span>
        </button>
      </div>

      {/* AI Input Overlay */}
      {showAiInput && (
        <div className="mb-6 bg-slate-900/50 p-4 rounded-xl border border-indigo-500/30 animate-in fade-in slide-in-from-top-2">
          <label className="block text-xs uppercase tracking-wider text-indigo-400 font-semibold mb-2">
            What is your main goal right now?
          </label>
          <div className="flex gap-2">
            <input 
              type="text"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              placeholder="e.g. Lose 10lbs, Launch MVP, Read a book..."
              className="flex-1 bg-slate-800 border-none rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none placeholder-slate-500"
              onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
            />
            <button 
              onClick={handleAiGenerate}
              disabled={isGenerating}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isGenerating ? 'Thinking...' : 'Generate'}
            </button>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="h-2 w-full bg-slate-800 rounded-full mb-8 overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ease-out ${isAllComplete ? 'bg-win' : 'bg-indigo-500'}`}
          style={{ width: `${(completedCount / 5) * 100}%` }}
        />
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {tasks.map((task, index) => (
          <div 
            key={task.id} 
            className={`group flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 
              ${task.completed 
                ? 'bg-win/10 border-win/30' 
                : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
              }`}
          >
            <button
              onClick={() => toggleTask(task.id)}
              className={`flex-shrink-0 transition-all duration-200 focus:outline-none rounded-full
                ${task.completed ? 'text-win scale-110' : 'text-slate-500 hover:text-slate-400'}`}
            >
              {task.completed ? (
                <CheckCircle size={28} weight="fill" className="fill-current" />
              ) : (
                <Circle size={28} />
              )}
            </button>

            <div className="flex-1">
              <input
                type="text"
                value={task.text}
                onChange={(e) => updateTaskText(task.id, e.target.value)}
                placeholder={`Critical Task #${index + 1}`}
                className={`w-full bg-transparent border-none outline-none text-lg font-medium placeholder-slate-600 transition-colors
                  ${task.completed ? 'text-slate-400 line-through' : 'text-slate-100'}
                `}
                readOnly={task.completed} // Optional: Lock text when checked
              />
            </div>

            {task.completed && (
               <div className="text-win text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                 Done
               </div>
            )}
          </div>
        ))}
      </div>

      {/* Status Footer */}
      <div className="mt-8 text-center">
        {completedCount === 5 ? (
          <div className="animate-bounce text-win font-black text-3xl uppercase tracking-tighter drop-shadow-lg">
            W I N &nbsp; T H E &nbsp; D A Y
          </div>
        ) : (
          <div className="text-slate-500 font-medium">
            {5 - completedCount} tasks left to win today.
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskBoard;
