export interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export interface DayRecord {
  date: string; // ISO Date string YYYY-MM-DD
  tasks: Task[];
  status: 'WIN' | 'LOSS' | 'IN_PROGRESS';
  notes?: string;
}

export interface AppState {
  currentDate: string; // YYYY-MM-DD
  history: Record<string, DayRecord>; // Map date to record
  streak: number;
  bestStreak: number;
}

export type ViewMode = 'DASHBOARD' | 'HISTORY' | 'ANALYTICS';
