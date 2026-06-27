import type { Character, Goal, InventoryItem, Settings } from '../types';

export const defaultSettings: Settings = {
  grossSalary: 66000,
  inHandSalary: 60000,
  otherIncome: 0,
  rent: 23000,
  furnitureRent: 2000,
  wifiAmount: 499,
  wifiStartMonth: '2026-09',
  savingsTarget: 10000,
  momBucketTarget: 5000,
  protectMomBucket: false,
  categoryLimits: {
    food: 4000,
    shopping: 6000,
    transport: 3500,
    other: 5000,
  },
};

export const levelNames = [
  'Rookie Tracker',
  'Coin Scout',
  'Budget Fighter',
  'Spend Slayer',
  'Savings Knight',
  'Cash Strategist',
  'Risk Hunter',
  'Money Mage',
  'Wealth Guardian',
  'Finance Legend',
];

export const defaultGoals: Goal[] = [
  { id: 'emergency', name: 'Emergency Fund', saved: 0, target: 25000 },
  { id: 'travel', name: 'Travel Fund', saved: 0, target: 30000 },
  { id: 'meta', name: 'Meta Glasses Fund', saved: 0, target: 35000 },
  { id: 'treats', name: 'First Salary Treats', saved: 0, target: 6000 },
  { id: 'mom', name: 'Mom Bucket', saved: 0, target: 5000, mom: true },
];

export const characters: Character[] = [
  { id: 'girl', name: 'Pixel Girl Avatar', unlocked: true, condition: 'Start' , kind: 'hero'},
  { id: 'mochi', name: 'Mochi', unlocked: true, condition: 'Start', kind: 'pet' },
  { id: 'panda', name: 'Panda Pockets', unlocked: true, condition: 'Start', kind: 'helper' },
  { id: 'penny', name: 'Penny', unlocked: false, condition: 'Log 5 entries', kind: 'helper' },
  { id: 'snack', name: 'Snack Monster', unlocked: false, condition: 'Food risk high', kind: 'risk' },
  { id: 'shop', name: 'Shopping Goblin', unlocked: false, condition: 'Shopping risk high', kind: 'risk' },
  { id: 'cab', name: 'Cab Beast', unlocked: false, condition: 'Transport watch', kind: 'risk' },
  { id: 'bill', name: 'Bill Dragon', unlocked: false, condition: 'Bills active', kind: 'risk' },
  { id: 'owl', name: 'Budget Owl', unlocked: false, condition: 'Level 4', kind: 'helper' },
  { id: 'streak', name: 'Streak Squirrel', unlocked: false, condition: '5-day streak', kind: 'helper' },
];

export const inventoryItems: InventoryItem[] = [
  { id: 'coin', name: 'Coin Pouch', unlocked: true, condition: 'Start' },
  { id: 'shield', name: 'Shield', unlocked: false, condition: 'Safe / Day kept' },
  { id: 'suitcase', name: 'Pixel Suitcase', unlocked: false, condition: 'Travel save' },
  { id: 'visor', name: 'Smart Visor', unlocked: false, condition: 'Smart label x3' },
  { id: 'house', name: 'House Token', unlocked: true, condition: 'Rent protected' },
  { id: 'router', name: 'Router Token', unlocked: false, condition: 'WiFi active' },
  { id: 'sofa', name: 'Sofa Token', unlocked: true, condition: 'Furniture protected' },
  { id: 'panda', name: 'Panda Badge', unlocked: true, condition: 'Panda active' },
  { id: 'snack', name: 'Snack Shield', unlocked: false, condition: 'No Food App' },
  { id: 'fire', name: 'Streak Fire', unlocked: false, condition: '5-day streak' },
];

export const categories = ['Food', 'Transport', 'Groceries', 'Shopping', 'Saving', 'Rent', 'Furniture', 'WiFi'];
