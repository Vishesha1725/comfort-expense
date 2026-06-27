import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { defaultGoals, defaultSettings } from './data/defaults';
import type { Entry, EntryLabel, EntryType, Goal, Settings } from './types';

type State = {
  entries: Entry[];
  settings: Settings;
  goals: Goal[];
  xp: number;
  addEntry: (entry: Omit<Entry, 'id'>) => void;
  deleteEntry: (id: string) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  addSavingToGoal: (goalId: string, amount: number) => void;
  resetMonth: () => void;
  resetAll: () => void;
  importData: (data: Partial<Pick<State, 'entries' | 'settings' | 'goals' | 'xp'>>) => void;
};

const id = () => crypto.randomUUID();

function entryXp(type: EntryType, label: EntryLabel) {
  let score = 20;
  if (type === 'saving') score += 50;
  if (label === 'Smart') score += 20;
  if (label === 'Necessary') score += 10;
  return score;
}

export const useMoneyStore = create<State>()(
  persist(
    (set) => ({
      entries: [],
      settings: defaultSettings,
      goals: defaultGoals,
      xp: 0,
      addEntry: (entry) =>
        set((state) => {
          const savedEntry = { ...entry, id: id() };
          const goals = entry.type === 'saving'
            ? state.goals.map((goal) =>
                goal.name === entry.category ? { ...goal, saved: goal.saved + entry.amount } : goal,
              )
            : state.goals;
          return {
            entries: [savedEntry, ...state.entries],
            goals,
            xp: state.xp + entryXp(entry.type, entry.label),
          };
        }),
      deleteEntry: (idToDelete) => set((state) => ({ entries: state.entries.filter((entry) => entry.id !== idToDelete) })),
      updateSettings: (patch) =>
        set((state) => ({
          settings: {
            ...state.settings,
            ...patch,
            categoryLimits: { ...state.settings.categoryLimits, ...(patch.categoryLimits ?? {}) },
          },
          goals: state.goals.map((goal) =>
            goal.id === 'mom' && patch.momBucketTarget !== undefined ? { ...goal, target: patch.momBucketTarget } : goal,
          ),
        })),
      addSavingToGoal: (goalId, amount) =>
        set((state) => {
          const goal = state.goals.find((item) => item.id === goalId);
          if (!goal) return {};
          const entry: Entry = {
            id: id(),
            type: 'saving',
            amount,
            category: goal.name,
            label: 'Smart',
            date: new Date().toISOString().slice(0, 10),
            title: goal.name,
          };
          return {
            entries: [entry, ...state.entries],
            goals: state.goals.map((item) => (item.id === goalId ? { ...item, saved: item.saved + amount } : item)),
            xp: state.xp + 70,
          };
        }),
      resetMonth: () =>
        set((state) => {
          const key = new Date().toISOString().slice(0, 7);
          return { entries: state.entries.filter((entry) => !entry.date.startsWith(key)) };
        }),
      resetAll: () => set({ entries: [], settings: defaultSettings, goals: defaultGoals, xp: 0 }),
      importData: (data) =>
        set((state) => ({
          entries: data.entries ?? state.entries,
          settings: data.settings ?? state.settings,
          goals: data.goals ?? state.goals,
          xp: data.xp ?? state.xp,
        })),
    }),
    { name: 'moneyquest-pixel-os' },
  ),
);
