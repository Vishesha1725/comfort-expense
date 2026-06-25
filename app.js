const STORAGE_KEYS = {
  entries: 'scrapbook_entries_v1',
  settings: 'scrapbook_settings_v1',
  goals: 'scrapbook_goals_v1'
};

const DEFAULT_SETTINGS = {
  grossSalary: 66000,
  inHandSalary: 60000,
  otherFixedIncome: 0,
  monthlySavingsTarget: 8000,
  fixed: {
    rent: 23000,
    mom: 10000,
    transport: 5000,
    electricity: 5000,
    wifi: 500,
    appliances: 2000,
    groceries: 7000,
    comfort: 9000
  }
};

const DEFAULT_GOALS = [
  { name: 'Travel Fund', target: 30000, saved: 0 },
  { name: 'Gifts for Parents', target: 12000, saved: 0 },
  { name: 'Meta Glasses Fund', target: 70000, saved: 0 },
  { name: 'Emergency Fund', target: 60000, saved: 0 },
  { name: 'First Salary Treats', target: 6000, saved: 0 }
];

const CATEGORY_MAP = {
  expense: ['Food Delivery', 'Office Food', 'Groceries', 'Transport', 'Rent', 'Electricity', 'WiFi', 'Appliances', 'Mom', 'Shopping', 'Health', 'Beauty', 'Travel', 'Other'],
  income: ['Salary', 'Refund', 'Transfer In', 'Other Income'],
  saving: DEFAULT_GOALS.map(goal => goal.name),
  breakfast: ['Office Breakfast']
};

const MOOD_EMOJIS = {
  Happy: '😊',
  Calm: '🙂',
  Guilty: '😬',
  Excited: '🤩',
  Tired: '😮‍💨',
  Smart: '✨'
};

const state = {
  entries: load(STORAGE_KEYS.entries, []),
  settings: load(STORAGE_KEYS.settings, DEFAULT_SETTINGS),
  goals: load(STORAGE_KEYS.goals, DEFAULT_GOALS)
};

const el = {};

function $(id) { return document.getElementById(id); }
function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

function load(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? clone(fallback);
  } catch {
    return clone(fallback);
  }
}

function saveAll() {
  localStorage.setItem(STORAGE_KEYS.entries, JSON.stringify(state.entries));
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(state.settings));
  localStorage.setItem(STORAGE_KEYS.goals, JSON.stringify(state.goals));
}

function initElements() {
  [
    'sampleBtn','exportBtn','importInput','clearBtn','entryForm','entryDate','entryType','entryCategory','entryAmount','entryTitle','entryMood','entryFeeling','entryColor','entryNote',
    'goalForm','goalName','goalAmount','searchInput','filterType','incomeForm','fixedForm','grossSalaryInput','inHandSalaryInput','otherIncomeInput','monthlySavingsTargetInput',
    'fixedRentInput','fixedMomInput','fixedTransportInput','fixedElectricityInput','fixedWifiInput','fixedAppliancesInput','fixedGroceriesInput','fixedComfortInput','toast'
  ].forEach(id => el[id] = $(id));
  el.navBtns = document.querySelectorAll('.nav-btn');
  el.screens = document.querySelectorAll('.screen');
}

function attachEvents() {
  el.navBtns.forEach(btn => btn.addEventListener('click', () => switchScreen(btn.dataset.screen, btn)));
  el.entryType.addEventListener('change', populateCategoryOptions);
  el.entryForm.addEventListener('submit', handleEntrySubmit);
  el.goalForm.addEventListener('submit', handleGoalSubmit);
  el.incomeForm.addEventListener('submit', handleIncomeSubmit);
  el.fixedForm.addEventListener('submit', handleFixedSubmit);
  el.sampleBtn.addEventListener('click', loadSampleData);
  el.exportBtn.addEventListener('click', exportBackup);
  el.importInput.addEventListener('change', importBackup);
  el.clearBtn.addEventListener('click', clearData);
  el.searchInput.addEventListener('input', renderHistory);
  el.filterType.addEventListener('change', renderHistory);
  document.querySelectorAll('.quick-btn').forEach(btn => {
    btn.addEventListener('click', () => addEntry({
      id: crypto.randomUUID(),
      date: todayKey(),
      type: btn.dataset.type,
      category: btn.dataset.category,
      title: btn.dataset.title,
      amount: Number(btn.dataset.amount),
      mood: quickMoodFromFeeling(btn.dataset.feeling),
      feeling: btn.dataset.feeling,
      color: btn.dataset.type === 'saving' ? 'green' : 'yellow',
      note: 'Quick add'
    }));
  });
}

function init() {
  initElements();
  if (!state.goals.length) state.goals = clone(DEFAULT_GOALS);
  attachEvents();
  populateCategoryOptions();
  populateGoalOptions();
  fillForms();
  el.entryDate.value = todayKey();
  render();
}

function switchScreen(screenId, activeBtn) {
  el.navBtns.forEach(btn => btn.classList.remove('active'));
  activeBtn.classList.add('active');
  el.screens.forEach(screen => screen.classList.remove('active-screen'));
  $(screenId).classList.add('active-screen');
}

function todayKey() { return new Date().toISOString().slice(0,10); }
function currentMonthKey() { return new Date().toISOString().slice(0,7); }
function currentMonthEntries() { return state.entries.filter(entry => entry.date.startsWith(currentMonthKey())); }
function last7DaysEntries() {
  const since = new Date();
  since.setDate(since.getDate() - 6);
  return state.entries.filter(entry => new Date(entry.date) >= new Date(since.toISOString().slice(0,10)));
}
function money(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
}
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function sum(list) { return list.reduce((acc, num) => acc + Number(num || 0), 0); }
function escapeHtml(text='') {
  return text.replace(/[&<>"']/g, ch => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[ch]));
}
function quickMoodFromFeeling(feeling) {
  return feeling === 'Smart' ? 'Smart' : feeling === 'Regret' ? 'Guilty' : feeling === 'Worth it' ? 'Happy' : 'Calm';
}

function populateCategoryOptions() {
  const type = el.entryType.value;
  el.entryCategory.innerHTML = CATEGORY_MAP[type].map(cat => `<option value="${cat}">${cat}</option>`).join('');
}

function populateGoalOptions() {
  el.goalName.innerHTML = state.goals.map(goal => `<option value="${goal.name}">${goal.name}</option>`).join('');
}

function fillForms() {
  el.grossSalaryInput.value = state.settings.grossSalary;
  el.inHandSalaryInput.value = state.settings.inHandSalary;
  el.otherIncomeInput.value = state.settings.otherFixedIncome;
  el.monthlySavingsTargetInput.value = state.settings.monthlySavingsTarget;
  el.fixedRentInput.value = state.settings.fixed.rent;
  el.fixedMomInput.value = state.settings.fixed.mom;
  el.fixedTransportInput.value = state.settings.fixed.transport;
  el.fixedElectricityInput.value = state.settings.fixed.electricity;
  el.fixedWifiInput.value = state.settings.fixed.wifi;
  el.fixedAppliancesInput.value = state.settings.fixed.appliances;
  el.fixedGroceriesInput.value = state.settings.fixed.groceries;
  el.fixedComfortInput.value = state.settings.fixed.comfort;
}

function handleEntrySubmit(event) {
  event.preventDefault();
  const entry = {
    id: crypto.randomUUID(),
    date: el.entryDate.value,
    type: el.entryType.value,
    category: el.entryCategory.value,
    amount: Number(el.entryAmount.value),
    title: el.entryTitle.value.trim(),
    mood: el.entryMood.value,
    feeling: el.entryFeeling.value,
    color: el.entryColor.value,
    note: el.entryNote.value.trim()
  };
  if (!entry.title || entry.amount < 0) {
    showToast('Please enter a valid title and amount.');
    return;
  }
  addEntry(entry);
  el.entryForm.reset();
  el.entryDate.value = todayKey();
  el.entryType.value = 'expense';
  populateCategoryOptions();
}

function addEntry(entry) {
  state.entries.unshift(entry);
  if (entry.type === 'saving') {
    const goal = state.goals.find(item => item.name === entry.category);
    if (goal) goal.saved += entry.amount;
  }
  saveAll();
  render();
  showToast('Sticker added to your scrapbook.');
}

function handleGoalSubmit(event) {
  event.preventDefault();
  const goalName = el.goalName.value;
  const amount = Number(el.goalAmount.value || 0);
  if (amount <= 0) {
    showToast('Add a valid saving amount.');
    return;
  }
  addEntry({
    id: crypto.randomUUID(),
    date: todayKey(),
    type: 'saving',
    category: goalName,
    title: `${goalName} saving`,
    amount,
    mood: 'Smart',
    feeling: 'Smart',
    color: 'green',
    note: 'Added from savings jar'
  });
  el.goalAmount.value = '';
}

function handleIncomeSubmit(event) {
  event.preventDefault();
  state.settings.grossSalary = Number(el.grossSalaryInput.value || 0);
  state.settings.inHandSalary = Number(el.inHandSalaryInput.value || 0);
  state.settings.otherFixedIncome = Number(el.otherIncomeInput.value || 0);
  state.settings.monthlySavingsTarget = Number(el.monthlySavingsTargetInput.value || 0);
  saveAll();
  render();
  showToast('Income setup saved.');
}

function handleFixedSubmit(event) {
  event.preventDefault();
  state.settings.fixed = {
    rent: Number(el.fixedRentInput.value || 0),
    mom: Number(el.fixedMomInput.value || 0),
    transport: Number(el.fixedTransportInput.value || 0),
    electricity: Number(el.fixedElectricityInput.value || 0),
    wifi: Number(el.fixedWifiInput.value || 0),
    appliances: Number(el.fixedAppliancesInput.value || 0),
    groceries: Number(el.fixedGroceriesInput.value || 0),
    comfort: Number(el.fixedComfortInput.value || 0)
  };
  saveAll();
  render();
  showToast('Fixed costs saved.');
}

function calculateStreak() {
  const uniqueDates = [...new Set(state.entries.map(entry => entry.date))].sort().reverse();
  if (!uniqueDates.length) return 0;
  let streak = 0;
  let cursor = new Date();
  while (true) {
    const key = cursor.toISOString().slice(0,10);
    if (uniqueDates.includes(key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function render() {
  fillForms();
  populateGoalOptions();
  const monthEntries = currentMonthEntries();
  const weeklyEntries = last7DaysEntries();
  const income = state.settings.inHandSalary + state.settings.otherFixedIncome + sum(monthEntries.filter(e => e.type === 'income').map(e => e.amount));
  const spent = sum(monthEntries.filter(e => e.type === 'expense' || e.type === 'breakfast').map(e => e.amount));
  const saved = sum(monthEntries.filter(e => e.type === 'saving').map(e => e.amount));
  const foodApps = sum(monthEntries.filter(e => /zomato|zepto|blinkit/i.test(e.title + ' ' + e.category)).map(e => e.amount));
  const moneyLeft = income - spent - saved;
  const streak = calculateStreak();
  const topLabel = mostCommon(monthEntries.map(e => e.feeling)) || '-';

  $('heroHeadline').textContent = scrapbookHeadline(moneyLeft, saved, streak);
  $('heroSubline').textContent = scrapbookSubline(monthEntries, moneyLeft, foodApps);
  $('moneyLeftHero').textContent = money(moneyLeft);
  $('weeklyVibeHero').textContent = weeklyVibe(weeklyEntries);
  $('streakHero').textContent = `${streak} days`;
  $('spentCard').textContent = money(spent);
  $('savedCard').textContent = money(saved);
  $('foodAppsCard').textContent = money(foodApps);
  $('topLabelCard').textContent = topLabel;
  $('incomeCard').textContent = money(state.settings.inHandSalary + state.settings.otherFixedIncome);
  $('monthSpentCard').textContent = money(spent);
  $('monthSavedCard').textContent = money(saved);
  $('stickerCountCard').textContent = String(monthEntries.length);

  renderMoodBoard(monthEntries);
  renderStickerBoards();
  renderCategoryCloud(monthEntries);
  renderInsights(monthEntries, weeklyEntries, income, spent, saved, moneyLeft, foodApps);
  renderWeeklySummary(weeklyEntries);
  renderMoodCollage(weeklyEntries);
  renderSavingsJar(saved);
  renderGoals();
  renderHistory();
}

function scrapbookHeadline(moneyLeft, saved, streak) {
  if (saved >= state.settings.monthlySavingsTarget && moneyLeft >= 0) return 'Your scrapbook is proud of you.';
  if (streak >= 4) return 'You are in your consistent journaling era.';
  if (moneyLeft < 0) return 'This page says: slow down a little.';
  return 'Your money journal is looking cute.';
}

function scrapbookSubline(entries, moneyLeft, foodApps) {
  if (!entries.length) return 'Add entries to turn your daily spending into colorful sticker memories.';
  if (moneyLeft < 0) return 'You overspent this month, so your next few stickers should be calmer and smarter.';
  if (foodApps > 5000) return 'Food apps are taking over a lot of space in your scrapbook.';
  return 'Keep mixing necessary, worth-it and smart stickers to build a balanced month.';
}

function weeklyVibe(entries) {
  const moods = entries.map(entry => entry.mood);
  const topMood = mostCommon(moods);
  if (!topMood) return 'quiet';
  return topMood.toLowerCase();
}

function mostCommon(list) {
  if (!list.length) return null;
  const counts = {};
  list.forEach(item => counts[item] = (counts[item] || 0) + 1);
  return Object.entries(counts).sort((a,b) => b[1] - a[1])[0][0];
}

function renderMoodBoard(entries) {
  const latest = entries[0];
  if (!latest) {
    $('moodStickerMain').textContent = '🙂 calm';
    $('labelStickerMain').textContent = 'necessary';
    $('categoryStickerMain').textContent = 'groceries';
    $('clusterNote').textContent = 'Your latest sticker will appear here.';
    return;
  }
  $('moodStickerMain').textContent = `${MOOD_EMOJIS[latest.mood] || '🙂'} ${latest.mood.toLowerCase()}`;
  $('labelStickerMain').textContent = latest.feeling.toLowerCase();
  $('categoryStickerMain').textContent = latest.category.toLowerCase();
  $('clusterNote').textContent = `${latest.title} — ${money(latest.amount)}`;
}

function stickerCard(entry) {
  return `
    <div class="sticker ${entry.color || 'pink'}">
      <div class="sticker-head">
        <div>
          <div class="sticker-title">${escapeHtml(entry.title)}</div>
          <div class="sticker-date">${formatDate(entry.date)}</div>
        </div>
        <div class="sticker-amount">${(entry.type === 'expense' || entry.type === 'breakfast') ? '-' : '+'}${money(entry.amount)}</div>
      </div>
      <div class="sticker-note">${entry.note ? escapeHtml(entry.note) : 'No note — just a cute sticker memory.'}</div>
      <div class="sticker-tags">
        <span class="sticker-chip">${MOOD_EMOJIS[entry.mood] || '🙂'} ${entry.mood}</span>
        <span class="sticker-chip">${entry.feeling}</span>
        <span class="sticker-chip">${entry.category}</span>
      </div>
    </div>
  `;
}

function renderStickerBoards() {
  const recent = state.entries.slice(0, 6);
  $('recentStickerBoard').innerHTML = recent.length ? recent.map(stickerCard).join('') : emptyState('No stickers yet', 'Your recent sticker page will appear here.');
  const today = state.entries.filter(entry => entry.date === todayKey());
  $('todayStickerBoard').innerHTML = today.length ? today.map(stickerCard).join('') : emptyState('Nothing logged today', 'Add today’s spend as your first sticker.');
}

function renderCategoryCloud(entries) {
  const expenseEntries = entries.filter(entry => entry.type === 'expense' || entry.type === 'breakfast');
  const totals = {};
  expenseEntries.forEach(entry => totals[entry.category] = (totals[entry.category] || 0) + entry.amount);
  const items = Object.entries(totals).sort((a,b) => b[1]-a[1]).slice(0, 8);
  $('categoryCloud').innerHTML = items.length ? items.map(([category, value], index) => `
    <div class="cloud-item">
      <div class="cloud-label ${cloudColor(index)}">${category}</div>
      <div class="cloud-value">${money(value)}</div>
    </div>
  `).join('') : emptyState('No category tags yet', 'Once you add spends, category tags will show up here.');
}

function cloudColor(index) {
  const colors = ['tag pink','tag yellow','tag blue','tag green','tag lavender'];
  return colors[index % colors.length];
}

function renderInsights(monthEntries, weeklyEntries, income, spent, saved, moneyLeft, foodApps) {
  const regretCount = monthEntries.filter(e => e.feeling === 'Regret' || e.feeling === 'Impulse').length;
  const breakfastSpend = sum(monthEntries.filter(e => e.type === 'breakfast').map(e => e.amount));
  const fixedTotal = sum(Object.values(state.settings.fixed)) - state.settings.fixed.comfort;
  const savingsRate = income ? Math.round((saved / income) * 100) : 0;
  const insights = [
    {
      tone: moneyLeft >= 0 ? 'good' : 'bad',
      title: 'Money-left note',
      text: moneyLeft >= 0 ? `You still have ${money(moneyLeft)} left this month.` : `You are over budget by ${money(Math.abs(moneyLeft))}.`
    },
    {
      tone: saved >= state.settings.monthlySavingsTarget ? 'good' : saved > 0 ? 'warn' : 'bad',
      title: 'Savings note',
      text: `You saved ${money(saved)} this month, which is ${savingsRate}% of your active income.`
    },
    {
      tone: regretCount <= 2 ? 'good' : 'warn',
      title: 'Regret / impulse note',
      text: `${regretCount} entries are tagged Regret or Impulse.`
    },
    {
      tone: foodApps <= 5000 ? 'good' : 'warn',
      title: 'Food app note',
      text: `Zomato, Zepto and Blinkit together are ${money(foodApps)} this month.`
    },
    {
      tone: breakfastSpend <= 1500 ? 'good' : 'warn',
      title: 'Breakfast leakage',
      text: `Breakfast and snack spending is ${money(breakfastSpend)}.`
    },
    {
      tone: fixedTotal <= income * 0.75 ? 'warn' : 'bad',
      title: 'Fixed-cost pressure',
      text: `Fixed recurring base is ${money(fixedTotal)} out of ${money(income)}.`
    }
  ];
  $('insightList').innerHTML = insights.map(item => `
    <div class="insight-card ${item.tone}">
      <h4>${item.title}</h4>
      <p>${item.text}</p>
    </div>
  `).join('');
}

function renderWeeklySummary(entries) {
  const spent = sum(entries.filter(e => e.type === 'expense' || e.type === 'breakfast').map(e => e.amount));
  const saved = sum(entries.filter(e => e.type === 'saving').map(e => e.amount));
  const topMood = mostCommon(entries.map(e => e.mood)) || '-';
  const topCategory = mostCommon(entries.filter(e => e.type === 'expense' || e.type === 'breakfast').map(e => e.category)) || '-';
  $('weeklySummaryGrid').innerHTML = [
    ['Week spent', money(spent)],
    ['Week saved', money(saved)],
    ['Top mood', `${MOOD_EMOJIS[topMood] || ''} ${topMood}`.trim()],
    ['Top category', topCategory]
  ].map(([label, value]) => `
    <div class="summary-box">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `).join('');

  const dayMap = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0,10);
    dayMap[key] = [];
  }
  entries.forEach(entry => { if (dayMap[entry.date]) dayMap[entry.date].push(entry); });
  $('weeklyDayBoard').innerHTML = Object.entries(dayMap).map(([date, dayEntries]) => {
    const spend = sum(dayEntries.filter(e => e.type === 'expense' || e.type === 'breakfast').map(e => e.amount));
    const dayMood = mostCommon(dayEntries.map(e => e.mood)) || 'Quiet';
    return `
      <div class="day-summary">
        <h4>${formatDate(date)}</h4>
        <p>${dayEntries.length} stickers · ${money(spend)}</p>
        <p>${MOOD_EMOJIS[dayMood] || '📝'} ${dayMood}</p>
      </div>
    `;
  }).join('');
}

function renderMoodCollage(entries) {
  const moods = countValues(entries.map(e => e.mood));
  const labels = countValues(entries.map(e => e.feeling));
  const cards = [
    ['Mood sticker leader', mostCommon(entries.map(e => e.mood)) ? `${MOOD_EMOJIS[mostCommon(entries.map(e => e.mood))]} ${mostCommon(entries.map(e => e.mood))}` : 'No mood yet'],
    ['Label leader', mostCommon(entries.map(e => e.feeling)) || 'No label yet'],
    ['Mood mix', objectToLine(moods) || 'No moods yet'],
    ['Label mix', objectToLine(labels) || 'No labels yet']
  ];
  $('moodCollage').innerHTML = cards.map(([title, text], index) => `
    <div class="mood-card">
      <h4>${title}</h4>
      <p>${text}</p>
    </div>
  `).join('');
}

function countValues(list) {
  return list.reduce((acc, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {});
}

function objectToLine(obj) {
  return Object.entries(obj).map(([key, value]) => `${key} ${value}`).join(' · ');
}

function renderSavingsJar(saved) {
  const target = state.settings.monthlySavingsTarget || 1;
  const pct = Math.max(0, Math.min(100, Math.round(saved / target * 100)));
  $('jarFill').style.height = `${pct}%`;
  $('jarSaved').textContent = money(saved);
  $('jarTarget').textContent = money(target);
  $('jarPercent').textContent = `${pct}%`;
}

function renderGoals() {
  $('goalGrid').innerHTML = state.goals.map(goal => {
    const pct = Math.min(100, Math.round(goal.saved / goal.target * 100));
    return `
      <div class="goal-card">
        <h4>${goal.name}</h4>
        <p>Target: ${money(goal.target)}</p>
        <p><strong>${money(goal.saved)}</strong> saved</p>
        <div class="goal-progress"><div class="goal-progress-bar" style="width:${pct}%"></div></div>
        <p>${pct}% complete</p>
      </div>
    `;
  }).join('');
}

function renderHistory() {
  const q = el.searchInput.value.trim().toLowerCase();
  const type = el.filterType.value;
  const rows = state.entries.filter(entry => {
    const matchesSearch = !q || entry.title.toLowerCase().includes(q) || entry.category.toLowerCase().includes(q) || (entry.note || '').toLowerCase().includes(q);
    const matchesType = type === 'all' || entry.type === type;
    return matchesSearch && matchesType;
  });
  $('historyBody').innerHTML = rows.length ? rows.map(entry => `
    <tr>
      <td>${formatDate(entry.date)}</td>
      <td>${escapeHtml(entry.title)}<div class="muted">${escapeHtml(entry.note || '')}</div></td>
      <td>${entry.category}</td>
      <td>${entry.type}</td>
      <td>${MOOD_EMOJIS[entry.mood] || '🙂'} ${entry.mood}</td>
      <td>${entry.feeling}</td>
      <td>${(entry.type === 'expense' || entry.type === 'breakfast') ? '-' : '+'}${money(entry.amount)}</td>
      <td><button class="delete-btn" onclick="deleteEntry('${entry.id}')">Delete</button></td>
    </tr>
  `).join('') : '<tr><td colspan="8">No entries found.</td></tr>';
}

function deleteEntry(id) {
  const entry = state.entries.find(item => item.id === id);
  if (entry && entry.type === 'saving') {
    const goal = state.goals.find(item => item.name === entry.category);
    if (goal) goal.saved = Math.max(0, goal.saved - entry.amount);
  }
  state.entries = state.entries.filter(item => item.id !== id);
  saveAll();
  render();
  showToast('Sticker removed.');
}
window.deleteEntry = deleteEntry;

function emptyState(title, text) {
  return `<div class="summary-box"><strong>${title}</strong><p>${text}</p></div>`;
}

function loadSampleData() {
  state.settings = clone(DEFAULT_SETTINGS);
  state.goals = clone(DEFAULT_GOALS);
  state.entries = [
    sampleEntry(-7, 'income', 'Salary', 60000, 'Salary credited', 'Smart', 'Smart', 'green', 'Fresh month, fresh start'),
    sampleEntry(-7, 'expense', 'Rent', 23000, 'Rent payment', 'Calm', 'Necessary', 'yellow', 'Big fixed payment done'),
    sampleEntry(-6, 'expense', 'Mom', 10000, 'Mom contribution', 'Happy', 'Necessary', 'pink', 'Felt good doing this'),
    sampleEntry(-6, 'expense', 'Groceries', 540, 'Zepto order', 'Calm', 'Necessary', 'blue', 'Needed basics'),
    sampleEntry(-5, 'breakfast', 'Office Breakfast', 90, 'Coffee and snack', 'Happy', 'Worth it', 'yellow', 'Office craving'),
    sampleEntry(-5, 'expense', 'Food Delivery', 360, 'Zomato dinner', 'Happy', 'Worth it', 'pink', 'Comfort food'),
    sampleEntry(-4, 'expense', 'Transport', 250, 'Metro and cab', 'Tired', 'Necessary', 'blue', 'Long commute day'),
    sampleEntry(-4, 'saving', 'Travel Fund', 1500, 'Travel fund saving', 'Smart', 'Smart', 'green', 'Tiny step for travel'),
    sampleEntry(-3, 'expense', 'Shopping', 699, 'Little treat', 'Guilty', 'Regret', 'lavender', 'Not really needed'),
    sampleEntry(-2, 'expense', 'Groceries', 420, 'Blinkit order', 'Calm', 'Necessary', 'green', 'Essentials restock'),
    sampleEntry(-1, 'saving', 'Emergency Fund', 1000, 'Emergency jar', 'Smart', 'Smart', 'green', 'Slow and steady'),
    sampleEntry(0, 'expense', 'Office Food', 120, 'Office snack', 'Happy', 'Worth it', 'yellow', 'Small bite')
  ];
  state.entries.filter(entry => entry.type === 'saving').forEach(entry => {
    const goal = state.goals.find(goal => goal.name === entry.category);
    if (goal) goal.saved += entry.amount;
  });
  saveAll();
  populateGoalOptions();
  fillForms();
  render();
  showToast('Sample scrapbook loaded.');
}

function sampleEntry(offset, type, category, amount, title, mood, feeling, color, note) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return {
    id: crypto.randomUUID(),
    date: d.toISOString().slice(0,10),
    type, category, amount, title, mood, feeling, color, note
  };
}

function exportBackup() {
  const blob = new Blob([JSON.stringify({ entries: state.entries, settings: state.settings, goals: state.goals }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'sticker-scrapbook-backup.json';
  link.click();
  URL.revokeObjectURL(url);
}

function importBackup(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      state.entries = Array.isArray(parsed.entries) ? parsed.entries : [];
      state.settings = parsed.settings || clone(DEFAULT_SETTINGS);
      state.goals = parsed.goals || clone(DEFAULT_GOALS);
      saveAll();
      populateGoalOptions();
      fillForms();
      render();
      showToast('Backup imported.');
    } catch {
      showToast('Could not import this file.');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function clearData() {
  if (!confirm('Reset all scrapbook data?')) return;
  state.entries = [];
  state.settings = clone(DEFAULT_SETTINGS);
  state.goals = clone(DEFAULT_GOALS);
  saveAll();
  populateGoalOptions();
  fillForms();
  render();
  showToast('Scrapbook reset.');
}

function showToast(message) {
  el.toast.textContent = message;
  el.toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => el.toast.classList.remove('show'), 2300);
}

init();
