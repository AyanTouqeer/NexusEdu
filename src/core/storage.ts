import { UserState } from '../types';

const STORAGE_KEY = 'nexus_edu_state';

const defaultState: UserState = {
  points: 0,
  level: 1,
  sessions: [],
  achievements: [
    { id: '1', title: 'First Steps', description: 'Complete your first lesson.', icon: 'Zap' },
    { id: '2', title: 'Sync Master', description: 'Successfully sync 5 offline sessions.', icon: 'RefreshCw' },
    { id: '3', title: 'Context Pro', description: 'Translate 3 complex topics into games.', icon: 'Gamepad2' },
  ]
};

export const storage = {
  getState: (): UserState => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : defaultState;
  },
  saveState: (state: UserState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },
  resetState: () => {
    localStorage.removeItem(STORAGE_KEY);
  }
};
