import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AnimatePresence, motion } from 'framer-motion';
import { Archive, Download, Home, ListChecks, Plus, Search, Settings, ShieldAlert, Terminal, Trash2, Upload, Vault } from 'lucide-react';
import './styles.css';
import { categories, characters, inventoryItems } from './data/defaults';
import { formatMoney, levelFromXp, missions, riskCategories, totals } from './lib/finance';
import { useMoneyStore } from './store';
import type { Entry, EntryLabel, EntryType, Settings as AppSettings } from './types';

type Page = 'Home' | 'Add Entry' | 'Finance Terminal' | 'Risk' | 'Missions' | 'Vault' | 'Inventory' | 'Settings' | 'History';

const nav: { page: Page; icon: React.ElementType; short: string }[] = [
  { page: 'Home', icon: Home, short: 'Home' },
  { page: 'Add Entry', icon: Plus, short: 'Add' },
  { page: 'Finance Terminal', icon: Terminal, short: 'Terminal' },
  { page: 'Risk', icon: ShieldAlert, short: 'Risk' },
  { page: 'Missions', icon: ListChecks, short: 'Missions' },
  { page: 'Vault', icon: Vault, short: 'Vault' },
  { page: 'Inventory', icon: Archive, short: 'Items' },
  { page: 'Settings', icon: Settings, short: 'Settings' },
  { page: 'History', icon: Search, short: 'History' },
];

const sampleEntries: Omit<Entry, 'id'>[] = [
  { type: 'expense', amount: 320, category: 'Food', label: 'Worth It', date: today(), title: 'Lunch' },
  { type: 'expense', amount: 180, category: 'Transport', label: 'Necessary', date: today(), title: 'Metro' },
  { type: 'saving', amount: 1500, category: 'Emergency Fund', label: 'Smart', date: today(), title: 'Auto save' },
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function pct(value: number, total: number) {
  return Math.min(100, total ? (value / total) * 100 : 0);
}

function App() {
  const [page, setPage] = useState<Page>('Home');
  const { entries, settings, goals, xp, addEntry, updateSettings, deleteEntry, addSavingToGoal, resetMonth, resetAll, importData } = useMoneyStore();
  const stat = totals(entries, settings);
  const lvl = levelFromXp(xp);

  const exportJson = () => download('moneyquest-backup.json', JSON.stringify({ entries, settings, goals, xp }, null, 2), 'application/json');
  const exportCsv = () => {
    const rows = [['Date', 'Type', 'Amount', 'Category', 'Label', 'Title', 'Note'], ...entries.map((e) => [e.date, e.type, e.amount, e.category, e.label, e.title, e.note ?? ''])];
    download('moneyquest-history.csv', rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n'), 'text/csv');
  };
  const summary = () => {
    download('moneyquest-month-summary.txt', [
      `Income: ${formatMoney(stat.income)}`,
      `Fixed Protected: ${formatMoney(stat.fixed)}`,
      `Variable Spent: ${formatMoney(stat.variableSpent)}`,
      `Money Left: ${formatMoney(stat.left)}`,
      `Safe / Day: ${formatMoney(stat.safePerDay)}`,
    ].join('\n'), 'text/plain');
  };

  return (
    <div className="app-shell">
      <Decor />
      <aside className="side-nav pixel-panel">
        <div className="brand"><span>MQ</span><div><b>MoneyQuest</b><small>Pixel OS</small></div></div>
        <div className="level-card"><small>LV {lvl.level}</small><b>{lvl.name}</b><Progress value={lvl.progress} /></div>
        <nav>{nav.map(({ page: item, icon: Icon, short }) => <button key={item} className={page === item ? 'active' : ''} onClick={() => setPage(item)} title={item}><Icon size={18} />{short}</button>)}</nav>
      </aside>

      <main>
        <header className="topbar">
          <div><h1>{page}</h1><span>{formatMoney(stat.left)} left</span></div>
          <div className="top-actions">
            <button onClick={() => sampleEntries.forEach(addEntry)}>Load Sample</button>
            <button onClick={exportJson}><Download size={16} />Backup</button>
            <label><Upload size={16} />Import<input hidden type="file" accept="application/json" onChange={(e) => readImport(e, importData)} /></label>
            <button onClick={exportCsv}>CSV</button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.section className={`page-stage ${page === 'Settings' ? 'settings-stage' : ''}`} key={page} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            {page === 'Home' && <HomePage entries={entries} settings={settings} xp={xp} />}
            {page === 'Add Entry' && <AddEntry />}
            {page === 'Finance Terminal' && <TerminalPage entries={entries} settings={settings} />}
            {page === 'Risk' && <RiskPage entries={entries} settings={settings} />}
            {page === 'Missions' && <MissionsPage entries={entries} settings={settings} xp={xp} />}
            {page === 'Vault' && <VaultPage />}
            {page === 'Inventory' && <InventoryPage xp={xp} entries={entries} settings={settings} />}
            {page === 'Settings' && <SettingsPage settings={settings} updateSettings={updateSettings} summary={summary} resetMonth={resetMonth} resetAll={resetAll} />}
            {page === 'History' && <HistoryPage entries={entries} deleteEntry={deleteEntry} exportCsv={exportCsv} resetMonth={resetMonth} resetAll={resetAll} />}
          </motion.section>
        </AnimatePresence>
      </main>

      <nav className="bottom-nav">{nav.map(({ page: item, icon: Icon, short }) => <button key={item} className={page === item ? 'active' : ''} onClick={() => setPage(item)} aria-label={item}><Icon size={18} /><span>{short}</span></button>)}</nav>
    </div>
  );

  function download(name: string, content: string, type: string) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }
}

function Decor() {
  return <div className="decor" aria-hidden>{['leaf a', 'leaf b', 'leaf c', 'flower a', 'flower b', 'coin a', 'coin b'].map((c) => <i key={c} className={c} />)}</div>;
}

function HomePage({ entries, settings, xp }: { entries: Entry[]; settings: AppSettings; xp: number }) {
  const stat = totals(entries, settings);
  const lvl = levelFromXp(xp);
  const cards = [
    ['Money Left', formatMoney(stat.left)],
    ['Safe / Day', formatMoney(stat.safePerDay)],
    ['XP', `${xp % 1000}/1000`],
    ['Level', `${lvl.level}`],
    ['Risk', riskCategories(entries, settings).some((r) => r.status === 'Boss' || r.status === 'High') ? 'High' : 'Safe'],
    ['Vault', formatMoney(stat.saved)],
    ['Fixed', formatMoney(stat.fixed)],
    ['Mom Bucket', settings.protectMomBucket ? 'Protected' : 'Not Fixed'],
  ];
  return <div className="home-board pixel-panel">
    <div className="board-stats">{cards.map(([label, value]) => <Metric key={label} label={label} value={value} />)}</div>
    <div className="avatar-zone">
      <motion.div className="girl" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 3 }}><i /></motion.div>
      <motion.div className="mochi" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 2.3 }} />
      <motion.div className="panda" animate={{ rotate: [-2, 2, -2] }} transition={{ repeat: Infinity, duration: 2.8 }} />
      <span className="float-item coin" /><span className="float-item bag" /><span className="float-item shield" /><span className="float-item router" />
    </div>
    <div className="xp-line"><span>XP</span><Progress value={lvl.progress} /><b>{lvl.name}</b></div>
  </div>;
}

function AddEntry() {
  const addEntry = useMoneyStore((s) => s.addEntry);
  const [type, setType] = useState<EntryType>('expense');
  const [more, setMore] = useState(false);
  const [saved, setSaved] = useState(false);
  const [category, setCategory] = useState(categories[0]);
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    addEntry({
      type,
      amount: Number(form.get('amount')),
      category,
      label: form.get('label') as EntryLabel,
      date: String(form.get('date')),
      title: String(form.get('title') || category),
      note: String(form.get('note') || ''),
    });
    event.currentTarget.reset();
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1400);
  }
  return <div className="form-wrap pixel-panel">
    <div className="type-row">{(['expense', 'income', 'saving'] as EntryType[]).map((item) => <button className={type === item ? 'active' : ''} onClick={() => setType(item)} key={item}>{title(item)}</button>)}</div>
    <form onSubmit={submit} className="entry-form">
      <label>Amount<input name="amount" type="number" min="1" required placeholder="₹0" /></label>
      <label>Category<select value={category} onChange={(e) => setCategory(e.target.value)}>{(type === 'saving' ? useMoneyStore.getState().goals.map((g) => g.name) : categories).map((c) => <option key={c}>{c}</option>)}</select></label>
      <label>Label<select name="label"><option>Necessary</option><option>Worth It</option><option>Smart</option><option>Impulse</option><option>Regret</option></select></label>
      <label>Date<input name="date" type="date" defaultValue={today()} required /></label>
      <label className="wide">Title<input name="title" placeholder="Short label" /></label>
      <div className="chips">{categories.map((chip) => <button key={chip} type="button" onClick={() => setCategory(chip)}>{chip}</button>)}</div>
      <button type="button" className="plain" onClick={() => setMore(!more)}>More</button>
      {more && <label className="wide">Note<textarea name="note" rows={3} /></label>}
      <button className="save" type="submit">Save</button>
    </form>
    {saved && <motion.div className="success" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>Saved +XP</motion.div>}
  </div>;
}

function TerminalPage({ entries, settings }: { entries: Entry[]; settings: AppSettings }) {
  const [show, setShow] = useState(false);
  const stat = totals(entries, settings);
  const rows = [
    ['Income', stat.income],
    ['Fixed Protected', stat.fixed],
    ['Savings Target', settings.savingsTarget],
    ['Variable Spent', stat.variableSpent],
    ['Mom Bucket', stat.protectedMom],
    ['Money Left', stat.left],
    ['Safe / Day', stat.safePerDay],
    ['Projected Balance', stat.projectedBalance],
  ];
  return <div className="terminal">
    <div className="metric-grid">{rows.map(([label, value]) => <Metric key={label} label={String(label)} value={formatMoney(Number(value))} />)}</div>
    <button className="formula" onClick={() => setShow(!show)}>Formula</button>
    {show && <div className="pixel-panel formula-box">Income - Active Fixed Costs - Remaining Savings Target - Optional Protected Mom Bucket - Variable Spending Already Logged ÷ Days Remaining</div>}
  </div>;
}

function RiskPage({ entries, settings }: { entries: Entry[]; settings: AppSettings }) {
  return <div className="risk-grid">{riskCategories(entries, settings).map((risk) => <motion.article whileHover={{ y: -4 }} key={risk.id} className={`risk-card pixel-panel ${risk.status.toLowerCase()}`}>
    <span className="monster" /><h3>{risk.name}</h3><b>{formatMoney(risk.amount)} / {formatMoney(risk.limit)}</b><em>{risk.status}</em><small>{risk.action}</small>
  </motion.article>)}</div>;
}

function MissionsPage({ entries, settings, xp }: { entries: Entry[]; settings: AppSettings; xp: number }) {
  const list = missions(entries, settings, xp);
  return <div className="two-col">
    {(['daily', 'weekly'] as const).map((cadence) => <div className="pixel-panel" key={cadence}><h2>{title(cadence)}</h2>{list.filter((m) => m.cadence === cadence).map((m) => <div className="mission" key={m.id}><div><b>{m.name}</b><small>{m.xp} XP</small></div><Progress value={pct(m.progress, m.target)} /><span>{m.progress >= m.target ? 'Done' : 'Pending'}</span></div>)}</div>)}
  </div>;
}

function VaultPage() {
  const { goals, addSavingToGoal } = useMoneyStore();
  const [goalId, setGoalId] = useState(goals[0]?.id ?? '');
  const [amount, setAmount] = useState('');
  return <div className="vault-page">
    <div className="goal-grid">{goals.map((g) => <article key={g.id} className="pixel-panel goal"><h3>{g.name}</h3>{g.mom && <small>Not Fixed · Optional Protect</small>}<b>{formatMoney(g.saved)} / {formatMoney(g.target)}</b><Progress value={pct(g.saved, g.target)} /><button onClick={() => { setGoalId(g.id); setAmount('1000'); }}>Add Saving</button></article>)}</div>
    <form className="pixel-panel add-save" onSubmit={(e) => { e.preventDefault(); addSavingToGoal(goalId, Number(amount)); setAmount(''); }}>
      <select value={goalId} onChange={(e) => setGoalId(e.target.value)}>{goals.map((g) => <option value={g.id} key={g.id}>{g.name}</option>)}</select>
      <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min="1" placeholder="Amount" required />
      <button>Add</button>
    </form>
  </div>;
}

function InventoryPage({ xp, entries, settings }: { xp: number; entries: Entry[]; settings: AppSettings }) {
  const lvl = levelFromXp(xp);
  const enrichedCharacters = characters.map((c) => ({ ...c, unlocked: c.unlocked || entries.length >= 5 || (c.id === 'owl' && lvl.level >= 4) }));
  const enrichedItems = inventoryItems.map((i) => ({ ...i, unlocked: i.unlocked || (i.id === 'router' && settings.wifiStartMonth <= new Date().toISOString().slice(0, 7)) || (i.id === 'visor' && entries.filter((e) => e.label === 'Smart').length >= 3) }));
  return <div className="two-col"><Inventory titleText="Characters" items={enrichedCharacters} /><Inventory titleText="Items" items={enrichedItems} /></div>;
}

function SettingsPage({ settings, updateSettings, summary, resetMonth, resetAll }: { settings: AppSettings; updateSettings: (settings: Partial<AppSettings>) => void; summary: () => void; resetMonth: () => void; resetAll: () => void }) {
  const [draft, setDraft] = useState(settings);
  const save = (event: React.FormEvent) => { event.preventDefault(); updateSettings(draft); };
  const set = (patch: Partial<AppSettings>) => setDraft((d) => ({ ...d, ...patch }));
  const setLimit = (patch: Partial<AppSettings['categoryLimits']>) => setDraft((d) => ({ ...d, categoryLimits: { ...d.categoryLimits, ...patch } }));
  return <form className="settings-grid" onSubmit={save}>
    <SettingsBox titleText="Income"><NumberInput label="Gross salary" value={draft.grossSalary} set={(v) => set({ grossSalary: v })} /><NumberInput label="In-hand salary" value={draft.inHandSalary} set={(v) => set({ inHandSalary: v })} /><NumberInput label="Other income" value={draft.otherIncome} set={(v) => set({ otherIncome: v })} /></SettingsBox>
    <SettingsBox titleText="Fixed Costs"><NumberInput label="Rent" value={draft.rent} set={(v) => set({ rent: v })} /><NumberInput label="Furniture rent" value={draft.furnitureRent} set={(v) => set({ furnitureRent: v })} /><NumberInput label="WiFi amount" value={draft.wifiAmount} set={(v) => set({ wifiAmount: v })} /><label>WiFi start month<input type="month" value={draft.wifiStartMonth} onChange={(e) => set({ wifiStartMonth: e.target.value })} /></label></SettingsBox>
    <SettingsBox titleText="Targets"><NumberInput label="Savings target" value={draft.savingsTarget} set={(v) => set({ savingsTarget: v })} /><NumberInput label="Mom bucket target" value={draft.momBucketTarget} set={(v) => set({ momBucketTarget: v })} /><label className="toggle"><input type="checkbox" checked={draft.protectMomBucket} onChange={(e) => set({ protectMomBucket: e.target.checked })} />Protect Mom Bucket</label></SettingsBox>
    <SettingsBox titleText="Category Limits"><NumberInput label="Food app limit" value={draft.categoryLimits.food} set={(v) => setLimit({ food: v })} /><NumberInput label="Shopping limit" value={draft.categoryLimits.shopping} set={(v) => setLimit({ shopping: v })} /><NumberInput label="Transport limit" value={draft.categoryLimits.transport} set={(v) => setLimit({ transport: v })} /><NumberInput label="Other limit" value={draft.categoryLimits.other} set={(v) => setLimit({ other: v })} /></SettingsBox>
    <div className="settings-actions"><button className="save">Save</button><button type="button" onClick={summary}>Summary</button><button type="button" onClick={resetMonth}>Reset Month</button><button type="button" className="danger" onClick={resetAll}>Reset All</button></div>
  </form>;
}

function HistoryPage({ entries, deleteEntry, exportCsv, resetMonth, resetAll }: { entries: Entry[]; deleteEntry: (id: string) => void; exportCsv: () => void; resetMonth: () => void; resetAll: () => void }) {
  const [q, setQ] = useState('');
  const [type, setType] = useState('all');
  const filtered = useMemo(() => entries.filter((e) => (type === 'all' || e.type === type) && `${e.title} ${e.category} ${e.label}`.toLowerCase().includes(q.toLowerCase())), [entries, q, type]);
  return <div className="pixel-panel history">
    <div className="history-tools"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" /><select value={type} onChange={(e) => setType(e.target.value)}><option value="all">All</option><option value="expense">Expense</option><option value="income">Income</option><option value="saving">Saving</option></select><button onClick={exportCsv}>Export CSV</button><button onClick={resetMonth}>Reset Month</button><button className="danger" onClick={resetAll}>Reset All</button></div>
    <div className="history-list">{filtered.map((entry) => <div className="history-row" key={entry.id}><span>{entry.date}</span><b>{entry.title}</b><small>{entry.category}</small><em>{entry.type}</em><strong>{formatMoney(entry.amount)}</strong><button onClick={() => deleteEntry(entry.id)}><Trash2 size={16} /></button></div>)}</div>
  </div>;
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return <motion.article whileHover={{ y: -3 }} className="metric pixel-panel"><small>{label}</small><b>{value}</b></motion.article>;
}

function Progress({ value }: { value: number }) {
  return <div className="progress"><motion.i initial={{ width: 0 }} animate={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div>;
}

function Inventory({ titleText, items }: { titleText: string; items: { id: string; name: string; unlocked: boolean; condition: string }[] }) {
  return <div className="pixel-panel"><h2>{titleText}</h2><div className="inventory-grid">{items.map((item) => <article key={item.id} className={item.unlocked ? 'unlocked' : 'locked'}><span>{item.name.slice(0, 2)}</span><b>{item.name}</b><small>{item.unlocked ? 'Unlocked' : item.condition}</small></article>)}</div></div>;
}

function SettingsBox({ titleText, children }: { titleText: string; children: React.ReactNode }) {
  return <section className="pixel-panel settings-box"><h2>{titleText}</h2>{children}</section>;
}

function NumberInput({ label, value, set }: { label: string; value: number; set: (value: number) => void }) {
  return <label>{label}<input type="number" min="0" value={value} onChange={(e) => set(Number(e.target.value))} /></label>;
}

function title(value: string) {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}

function readImport(event: React.ChangeEvent<HTMLInputElement>, importData: ReturnType<typeof useMoneyStore.getState>['importData']) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      importData(JSON.parse(String(reader.result)));
    } catch {
      alert('Backup invalid');
    }
  };
  reader.readAsText(file);
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
