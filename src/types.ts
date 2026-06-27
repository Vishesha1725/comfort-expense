export type EntryType = 'expense' | 'income' | 'saving';
export type EntryLabel = 'Necessary' | 'Worth It' | 'Smart' | 'Impulse' | 'Regret';

export interface Entry {
  id: string;
  type: EntryType;
  amount: number;
  category: string;
  label: EntryLabel;
  date: string;
  title: string;
  note?: string;
}

export interface Settings {
  grossSalary: number;
  inHandSalary: number;
  otherIncome: number;
  rent: number;
  furnitureRent: number;
  wifiAmount: number;
  wifiStartMonth: string;
  savingsTarget: number;
  momBucketTarget: number;
  protectMomBucket: boolean;
  categoryLimits: {
    food: number;
    shopping: number;
    transport: number;
    other: number;
  };
}

export interface Goal {
  id: string;
  name: string;
  saved: number;
  target: number;
  mom?: boolean;
}

export interface Mission {
  id: string;
  name: string;
  cadence: 'daily' | 'weekly';
  progress: number;
  target: number;
  xp: number;
}

export interface Character {
  id: string;
  name: string;
  unlocked: boolean;
  condition: string;
  kind: 'hero' | 'pet' | 'helper' | 'risk';
}

export interface InventoryItem {
  id: string;
  name: string;
  unlocked: boolean;
  condition: string;
}

export interface RiskCategory {
  id: string;
  name: string;
  amount: number;
  limit: number;
  status: 'Safe' | 'Watch' | 'High' | 'Boss';
  action: string;
}
