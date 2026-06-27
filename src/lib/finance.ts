import { levelNames } from '../data/defaults';
import type { Entry, Mission, RiskCategory, Settings } from '../types';

export const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Math.round(value || 0));

export const monthKey = (date = new Date()) => date.toISOString().slice(0, 7);

export function currentMonthEntries(entries: Entry[]) {
  const key = monthKey();
  return entries.filter((entry) => entry.date.startsWith(key));
}

export function isWifiActive(settings: Settings, date = new Date()) {
  return monthKey(date) >= settings.wifiStartMonth;
}

export function fixedProtected(settings: Settings) {
  return settings.rent + settings.furnitureRent + (isWifiActive(settings) ? settings.wifiAmount : 0);
}

export function totals(entries: Entry[], settings: Settings) {
  const month = currentMonthEntries(entries);
  const incomeLogged = month.filter((e) => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
  const variableSpent = month.filter((e) => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
  const saved = month.filter((e) => e.type === 'saving').reduce((sum, e) => sum + e.amount, 0);
  const momSaved = month.filter((e) => e.type === 'saving' && e.category === 'Mom Bucket').reduce((sum, e) => sum + e.amount, 0);
  const income = settings.inHandSalary + settings.otherIncome + incomeLogged;
  const remainingSavings = Math.max(settings.savingsTarget - saved, 0);
  const protectedMom = settings.protectMomBucket ? Math.max(settings.momBucketTarget - momSaved, 0) : 0;
  const fixed = fixedProtected(settings);
  const left = income - fixed - variableSpent - saved;
  const daysRemaining = Math.max(daysLeftInMonth(), 1);
  const safePerDay = (income - fixed - remainingSavings - protectedMom - variableSpent) / daysRemaining;
  return {
    income,
    incomeLogged,
    fixed,
    variableSpent,
    saved,
    momSaved,
    left,
    remainingSavings,
    protectedMom,
    safePerDay,
    projectedBalance: income - fixed - settings.savingsTarget - protectedMom - variableSpent,
    daysRemaining,
  };
}

export function daysLeftInMonth(date = new Date()) {
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return end - date.getDate() + 1;
}

export function riskCategories(entries: Entry[], settings: Settings): RiskCategory[] {
  const month = currentMonthEntries(entries).filter((e) => e.type === 'expense');
  const spent = (match: (entry: Entry) => boolean) => month.filter(match).reduce((sum, e) => sum + e.amount, 0);
  const food = spent((e) => ['Food', 'Groceries'].includes(e.category));
  const shopping = spent((e) => e.category === 'Shopping');
  const transport = spent((e) => e.category === 'Transport');
  const bills = fixedProtected(settings);
  const chaos = spent((e) => ['Impulse', 'Regret'].includes(e.label));
  const make = (id: string, name: string, amount: number, limit: number, action: string): RiskCategory => {
    const ratio = limit ? amount / limit : 0;
    const status = ratio >= 1.25 ? 'Boss' : ratio >= 1 ? 'High' : ratio >= 0.75 ? 'Watch' : 'Safe';
    return { id, name, amount, limit, status, action };
  };
  return [
    make('food', 'Snack Risk', food, settings.categoryLimits.food, 'No Food App Day'),
    make('shopping', 'Shopping Risk', shopping, settings.categoryLimits.shopping, 'Cart Lock'),
    make('transport', 'Transport Risk', transport, settings.categoryLimits.transport, 'Metro Mode'),
    make('bills', 'Bills Risk', bills, fixedProtected(settings), 'Auto Protect'),
    make('chaos', 'Chaos Risk', chaos, settings.categoryLimits.other, '24h Pause'),
  ];
}

export function levelFromXp(xp: number) {
  const level = Math.min(Math.floor(xp / 1000) + 1, 10);
  return { level, name: levelNames[level - 1], progress: (xp % 1000) / 10 };
}

export function missions(entries: Entry[], settings: Settings, xp: number): Mission[] {
  const today = new Date().toISOString().slice(0, 10);
  const month = currentMonthEntries(entries);
  const todayEntries = entries.filter((e) => e.date === today);
  const smartSave = month.filter((e) => e.type === 'saving').reduce((sum, e) => sum + e.amount, 0);
  const impulse = todayEntries.filter((e) => e.label === 'Impulse' || e.label === 'Regret').length;
  const food = month.filter((e) => e.type === 'expense' && ['Food', 'Groceries'].includes(e.category)).reduce((s, e) => s + e.amount, 0);
  const missionList: Mission[] = [
    { id: 'log', name: 'Log Today', cadence: 'daily', progress: Math.min(todayEntries.length, 1), target: 1, xp: 25 },
    { id: 'safe', name: 'Stay Under Safe / Day', cadence: 'daily', progress: totals(entries, settings).safePerDay >= 0 ? 1 : 0, target: 1, xp: 30 },
    { id: 'impulse', name: 'No Impulse', cadence: 'daily', progress: impulse ? 0 : 1, target: 1, xp: 25 },
    { id: 'saving', name: 'Add Saving', cadence: 'daily', progress: todayEntries.some((e) => e.type === 'saving') ? 1 : 0, target: 1, xp: 25 },
    { id: 'foodapp', name: 'No Food App', cadence: 'daily', progress: todayEntries.some((e) => e.category === 'Food') ? 0 : 1, target: 1, xp: 25 },
    { id: 'streak', name: '5-Day Streak', cadence: 'weekly', progress: Math.min(new Set(month.map((e) => e.date)).size, 5), target: 5, xp: 100 },
    { id: 'save2k', name: 'Save ₹2,000', cadence: 'weekly', progress: Math.min(smartSave, 2000), target: 2000, xp: 100 },
    { id: 'foodlimit', name: 'Food Apps Under Limit', cadence: 'weekly', progress: food <= settings.categoryLimits.food ? 1 : 0, target: 1, xp: 100 },
    { id: 'shopimpulse', name: 'No Impulse Shopping', cadence: 'weekly', progress: month.some((e) => e.category === 'Shopping' && e.label === 'Impulse') ? 0 : 1, target: 1, xp: 100 },
    { id: 'transportlimit', name: 'Transport Under Limit', cadence: 'weekly', progress: riskCategories(entries, settings)[2].status === 'Safe' ? 1 : 0, target: 1, xp: 100 },
  ];
  return missionList.map((m) => ({ ...m, progress: Math.max(0, m.progress + (xp < 0 ? 0 : 0)) }));
}
