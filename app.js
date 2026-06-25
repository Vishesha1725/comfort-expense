const STORAGE_KEYS = {
  entries: 'comfortDailyLog_entries',
  budget: 'comfortDailyLog_budget'
};

const CATEGORIES = {
  expense: ['Food', 'Groceries', 'Transport', 'Rent', 'Bills', 'WiFi', 'Shopping', 'Health', 'Family', 'Entertainment', 'Beauty', 'Subscriptions', 'Other'],
  income: ['Salary', 'Refund', 'Transfer In', 'Gift', 'Freelance', 'Other Income']
};

const DEFAULT_BUDGET = {
  income: 80000,
  rent: 23000,
  mom: 10000,
  transport: 5000,
  electricity: 5000,
  wifi: 500,
  appliances: 2000,
  comfort: 12000
};

const SAMPLE_DATA = [
  { id: crypto.randomUUID(), date: dayOffset(-6), title: 'Salary Credit', type: 'income', category: 'Salary', amount: 65000, mood: 'Calm', note: 'Monthly fellowship' },
  { id: crypto.randomUUID(), date: dayOffset(-6), title: 'Rent', type: 'expense', category: 'Rent', amount: 23000, mood: 'Necessary', note: '' },
  { id: crypto.randomUUID(), date: dayOffset(-5), title: 'Zepto', type: 'expense', category: 'Groceries', amount: 640, mood: 'Necessary', note: '' },
  { id: crypto.randomUUID(), date: dayOffset(-5), title: 'Zomato', type: 'expense', category: 'Food', amount: 388, mood: 'Worth it', note: '' },
  { id: crypto.randomUUID(), date: dayOffset(-4), title: 'Metro + Cab', type: 'expense', category: 'Transport', amount: 260, mood: 'Necessary', note: '' },
  { id: crypto.randomUUID(), date: dayOffset(-4), title: 'Transfer to Mom', type: 'expense', category: 'Family', amount: 10000, mood: 'Calm', note: '' },
  { id: crypto.randomUUID(), date: dayOffset(-3), title: 'Airtel WiFi', type: 'expense', category: 'WiFi', amount: 499, mood: 'Necessary', note: '' },
  { id: crypto.randomUUID(), date: dayOffset(-3), title: 'Nykaa', type: 'expense', category: 'Beauty', amount: 899, mood: 'Worth it', note: '' },
  { id: crypto.randomUUID(), date: dayOffset(-2), title: 'Blinkit', type: 'expense', category: 'Groceries', amount: 311, mood: 'Necessary', note: '' },
  { id: crypto.randomUUID(), date: dayOffset(-2), title: 'Cafe Meet', type: 'expense', category: 'Food', amount: 420, mood: 'Worth it', note: '' },
  { id: crypto.randomUUID(), date: dayOffset(-1), title: 'Electricity Bill', type: 'expense', category: 'Bills', amount: 2800, mood: 'Necessary', note: '' },
  { id: crypto.randomUUID(), date: dayOffset(-1), title: 'Amazon Refund', type: 'income', category: 'Refund', amount: 650, mood: 'Calm', note: '' },
  { id: crypto.randomUUID(), date: dayOffset(0), title: 'Urban Company', type: 'expense', category: 'Other', amount: 749, mood: 'Worth it', note: '' },
  { id: crypto.randomUUID(), date: dayOffset(0), title: 'YouTube Subscription', type: 'expense', category: 'Subscriptions', amount: 149, mood: 'Annoying', note: '' }
];

function dayOffset(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

const state = {
  entries: loadEntries(),
  budget: loadBudget(),
  trendChart: null,
  categoryChart: null
};

const el = {
  navBtns: document.querySelectorAll('.nav-btn'),
  sections: document.querySelectorAll('.section'),
  entryForm: document.getElementById('entryForm'),
  entryDate: document.getElementById('entryDate'),
  entryType: document.getElementById('entryType'),
  entryCategory: document.getElementById('entryCategory'),
  entryAmount: document.getElementById('entryAmount'),
  entryTitle: document.getElementById('entryTitle'),
  entryMood: document.getElementById('entryMood'),
  entryNote: document.getElementById('entryNote'),
  quickExpenseBtn: document.getElementById('quickExpenseBtn'),
  budgetForm: document.getElementById('budgetForm'),
  budgetIncome: document.getElementById('budgetIncome'),
  budgetRent: document.getElementById('budgetRent'),
  budgetMom: document.getElementById('budgetMom'),
  budgetTransport: document.getElementById('budgetTransport'),
  budgetElectricity: document.getElementById('budgetElectricity'),
  budgetWifi: document.getElementById('budgetWifi'),
  budgetAppliances: document.getElementById('budgetAppliances'),
  budgetComfort: document.getElementById('budgetComfort'),
  incomeTotal: document.getElementById('incomeTotal'),
  expenseTotal: document.getElementById('expenseTotal'),
  netTotal: document.getElementById('netTotal'),
  streakValue: document.getElementById('streakValue'),
  comfortScore: document.getElementById('comfortScore'),
  comfortRing: document.getElementById('comfortRing'),
  dashboardInsights: document.getElementById('dashboardInsights'),
  insightBoard: document.getElementById('insightBoard'),
  historyTableBody: document.getElementById('historyTableBody'),
  searchInput: document.getElementById('searchInput'),
  filterType: document.getElementById('filterType'),
  filterCategory: document.getElementById('filterCategory'),
  todaySnapshot: document.getElementById('todaySnapshot'),
  moodFill: document.getElementById('moodFill'),
  moodSummary: document.getElementById('moodSummary'),
  challengeText: document.getElementById('challengeText'),
  budgetHealth: document.getElementById('budgetHealth'),
  seedDataBtn: document.getElementById('seedDataBtn'),
  exportBtn: document.getElementById('exportBtn'),
  importInput: document.getElementById('importInput'),
  clearBtn: document.getElementById('clearBtn'),
  toast: document.getElementById('toast')
};

init();

function init() {
  el.entryDate.value = new Date().toISOString().slice(0, 10);
  populateCategoryOptions();
  fillBudgetInputs();
  populateFilterCategories();
  attachEvents();
  applyTilt();
  render();
}

function attachEvents() {
  el.entryType.addEventListener('change', populateCategoryOptions);
  el.entryForm.addEventListener('submit', handleEntrySubmit);
  el.quickExpenseBtn.addEventListener('click', quickAddExpense);
  el.budgetForm.addEventListener('submit', handleBudgetSubmit);
  el.searchInput.addEventListener('input', renderHistory);
  el.filterType.addEventListener('change', renderHistory);
  el.filterCategory.addEventListener('change', renderHistory);
  el.seedDataBtn.addEventListener('click', loadSampleData);
  el.exportBtn.addEventListener('click', exportBackup);
  el.importInput.addEventListener('change', importBackup);
  el.clearBtn.addEventListener('click', clearAllData);
  el.navBtns.forEach(btn => btn.addEventListener('click', () => switchSection(btn.dataset.target, btn)));
}

function switchSection(targetId, activeBtn) {
  el.sections.forEach(section => section.classList.add('hidden'));
  document.getElementById(targetId).classList.remove('hidden');
  el.navBtns.forEach(btn => btn.classList.remove('active'));
  activeBtn.classList.add('active');
}

function populateCategoryOptions() {
  const type = el.entryType.value;
  const categories = CATEGORIES[type];
  el.entryCategory.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join('');
}

function populateFilterCategories() {
  const all = [...new Set([...CATEGORIES.expense, ...CATEGORIES.income])];
  el.filterCategory.innerHTML = '<option value="all">All categories</option>' + all.map(c => `<option value="${c}">${c}</option>`).join('');
}

function handleEntrySubmit(e) {
  e.preventDefault();
  const entry = {
    id: crypto.randomUUID(),
    date: el.entryDate.value,
    type: el.entryType.value,
    category: el.entryCategory.value,
    amount: Number(el.entryAmount.value),
    title: el.entryTitle.value.trim(),
    mood: el.entryMood.value,
    note: el.entryNote.value.trim()
  };

  if (!entry.title || !entry.amount || entry.amount <= 0) {
    showToast('Please fill title and amount properly.');
    return;
  }

  state.entries.unshift(entry);
  saveEntries();
  el.entryForm.reset();
  el.entryDate.value = new Date().toISOString().slice(0, 10);
  el.entryType.value = 'expense';
  populateCategoryOptions();
  render();
  showToast('Entry added successfully.');
}

function quickAddExpense() {
  el.entryDate.value = new Date().toISOString().slice(0, 10);
  el.entryType.value = 'expense';
  populateCategoryOptions();
  el.entryTitle.focus();
  showToast('Ready for a quick expense entry.');
}

function handleBudgetSubmit(e) {
  e.preventDefault();
  state.budget = {
    income: Number(el.budgetIncome.value || 0),
    rent: Number(el.budgetRent.value || 0),
    mom: Number(el.budgetMom.value || 0),
    transport: Number(el.budgetTransport.value || 0),
    electricity: Number(el.budgetElectricity.value || 0),
    wifi: Number(el.budgetWifi.value || 0),
    appliances: Number(el.budgetAppliances.value || 0),
    comfort: Number(el.budgetComfort.value || 0)
  };
  saveBudget();
  render();
  showToast('Budget saved.');
}

function fillBudgetInputs() {
  el.budgetIncome.value = state.budget.income;
  el.budgetRent.value = state.budget.rent;
  el.budgetMom.value = state.budget.mom;
  el.budgetTransport.value = state.budget.transport;
  el.budgetElectricity.value = state.budget.electricity;
  el.budgetWifi.value = state.budget.wifi;
  el.budgetAppliances.value = state.budget.appliances;
  el.budgetComfort.value = state.budget.comfort;
}

function render() {
  const monthEntries = getCurrentMonthEntries();
  const income = sum(monthEntries.filter(e => e.type === 'income').map(e => e.amount));
  const expenses = sum(monthEntries.filter(e => e.type === 'expense').map(e => e.amount));
  const net = income - expenses;
  const comfortScore = calculateComfortScore(monthEntries, state.budget);

  el.incomeTotal.textContent = formatCurrency(income);
  el.expenseTotal.textContent = formatCurrency(expenses);
  el.netTotal.textContent = formatCurrency(net);
  el.streakValue.textContent = `${calculateStreak()} days`;
  el.comfortScore.textContent = comfortScore;
  updateComfortRing(comfortScore);

  renderCharts(monthEntries);
  renderTodaySnapshot();
  renderDashboardInsights(monthEntries, income, expenses, net, comfortScore);
  renderInsightBoard(monthEntries, income, expenses, net);
  renderHistory();
  renderMoodSummary();
  renderBudgetHealth(monthEntries);
  renderChallenge(monthEntries);
}

function renderCharts(monthEntries) {
  const trendData = getDailyTrend(monthEntries, 7);
  const categoryData = getCategoryBreakdown(monthEntries.filter(e => e.type === 'expense'));

  if (state.trendChart) state.trendChart.destroy();
  state.trendChart = new Chart(document.getElementById('trendChart'), {
    type: 'line',
    data: {
      labels: trendData.labels,
      datasets: [{
        label: 'Daily spend',
        data: trendData.values,
        borderColor: '#6ee7ff',
        backgroundColor: 'rgba(110,231,255,0.18)',
        tension: 0.35,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: '#ff7bd5'
      }]
    },
    options: chartOptions('Daily spend')
  });

  if (state.categoryChart) state.categoryChart.destroy();
  state.categoryChart = new Chart(document.getElementById('categoryChart'), {
    type: 'doughnut',
    data: {
      labels: categoryData.labels,
      datasets: [{
        data: categoryData.values,
        backgroundColor: ['#7c5cff','#22c3ff','#ff7bd5','#36d399','#f8b84e','#ff8c42','#8892ff','#00b7a8','#e879f9','#94a3b8']
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: '#eef2ff' } } }
    }
  });
}

function chartOptions(label) {
  return {
    responsive: true,
    scales: {
      x: { ticks: { color: '#cfd8f7' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { ticks: { color: '#cfd8f7', callback: value => `₹${value}` }, grid: { color: 'rgba(255,255,255,0.05)' } }
    },
    plugins: { legend: { labels: { color: '#eef2ff' } }, tooltip: { callbacks: { label: ctx => `${label}: ${formatCurrency(ctx.raw)}` } } }
  };
}

function renderTodaySnapshot() {
  const today = new Date().toISOString().slice(0, 10);
  const todayEntries = state.entries.filter(e => e.date === today);
  const todayExpenses = sum(todayEntries.filter(e => e.type === 'expense').map(e => e.amount));
  const todayIncome = sum(todayEntries.filter(e => e.type === 'income').map(e => e.amount));
  const topToday = [...todayEntries.filter(e => e.type === 'expense')].sort((a,b) => b.amount-a.amount)[0];
  const count = todayEntries.length;

  el.todaySnapshot.innerHTML = [
    { label: 'Entries today', value: count },
    { label: 'Spent today', value: formatCurrency(todayExpenses) },
    { label: 'Income today', value: formatCurrency(todayIncome) },
    { label: 'Top spend', value: topToday ? `${topToday.title} · ${formatCurrency(topToday.amount)}` : 'No expenses yet' }
  ].map(item => `
    <div class="snapshot-card">
      <p>${item.label}</p>
      <strong>${item.value}</strong>
    </div>
  `).join('');
}

function renderDashboardInsights(monthEntries, income, expenses, net, comfortScore) {
  const insights = buildInsights(monthEntries, income, expenses, net, comfortScore).slice(0, 4);
  el.dashboardInsights.innerHTML = insights.map(renderInsightCard).join('');
}

function renderInsightBoard(monthEntries, income, expenses, net) {
  const comfortScore = calculateComfortScore(monthEntries, state.budget);
  const insights = buildInsights(monthEntries, income, expenses, net, comfortScore);
  el.insightBoard.innerHTML = insights.map(renderInsightCard).join('');
}

function renderInsightCard(item) {
  return `
    <div class="insight-item ${item.tone}">
      <h4>${item.title}</h4>
      <p>${item.text}</p>
    </div>
  `;
}

function buildInsights(monthEntries, income, expenses, net, comfortScore) {
  const fixedCategories = ['Rent', 'Bills', 'WiFi', 'Transport', 'Family'];
  const comfortCategories = ['Food', 'Shopping', 'Beauty', 'Entertainment', 'Subscriptions', 'Other'];
  const fixedSpend = sum(monthEntries.filter(e => e.type === 'expense' && fixedCategories.includes(e.category)).map(e => e.amount));
  const comfortSpend = sum(monthEntries.filter(e => e.type === 'expense' && comfortCategories.includes(e.category)).map(e => e.amount));
  const topCategory = getTopCategory(monthEntries);
  const avgDaily = averageDailySpend(monthEntries);
  const highestEntry = [...monthEntries.filter(e => e.type === 'expense')].sort((a,b) => b.amount-a.amount)[0];
  const savingsRate = income > 0 ? (net / income) * 100 : 0;

  const insights = [
    {
      tone: comfortScore >= 75 ? 'good' : comfortScore >= 50 ? 'warn' : 'bad',
      title: 'Comfort score',
      text: `Your current comfort score is ${comfortScore}/100. ${comfortScore >= 75 ? 'You are managing money quite smoothly.' : comfortScore >= 50 ? 'You are okay, but there is room to tighten a few areas.' : 'Spending pressure is high, so this month needs attention.'}`
    },
    {
      tone: fixedSpend <= (state.budget.income || income || 1) * 0.5 ? 'good' : 'warn',
      title: 'Fixed expense load',
      text: `Fixed-type spending is ${formatCurrency(fixedSpend)} this month. That is ${percent((fixedSpend / Math.max(state.budget.income || income || 1, 1)) * 100)} of your income reference.`
    },
    {
      tone: comfortSpend <= (state.budget.comfort || 1) ? 'good' : 'warn',
      title: 'Comfort spending',
      text: `Flexible fun spending is ${formatCurrency(comfortSpend)}. ${comfortSpend > (state.budget.comfort || 0) ? 'This is above your comfort budget.' : 'This is within your comfort budget.'}`
    },
    {
      tone: topCategory ? 'warn' : 'good',
      title: 'Top category',
      text: topCategory ? `${topCategory.label} is your biggest expense bucket at ${formatCurrency(topCategory.value)}.` : 'No expense categories yet.'
    },
    {
      tone: highestEntry && highestEntry.amount > 3000 ? 'warn' : 'good',
      title: 'Largest single spend',
      text: highestEntry ? `${highestEntry.title} was your biggest single spend at ${formatCurrency(highestEntry.amount)} on ${formatDate(highestEntry.date)}.` : 'No major spend recorded yet.'
    },
    {
      tone: savingsRate >= 20 ? 'good' : savingsRate >= 10 ? 'warn' : 'bad',
      title: 'Savings outlook',
      text: income > 0 ? `Your current savings rate is ${percent(savingsRate)}.` : 'Add income entries to track your savings rate properly.'
    },
    {
      tone: avgDaily <= 600 ? 'good' : avgDaily <= 1200 ? 'warn' : 'bad',
      title: 'Daily pace',
      text: `Average daily spend this month is ${formatCurrency(avgDaily)}.`
    }
  ];
  return insights;
}

function renderHistory() {
  const search = el.searchInput.value.trim().toLowerCase();
  const type = el.filterType.value;
  const category = el.filterCategory.value;

  const rows = state.entries.filter(entry => {
    const matchesSearch = !search || entry.title.toLowerCase().includes(search) || (entry.note || '').toLowerCase().includes(search);
    const matchesType = type === 'all' || entry.type === type;
    const matchesCategory = category === 'all' || entry.category === category;
    return matchesSearch && matchesType && matchesCategory;
  });

  if (!rows.length) {
    el.historyTableBody.innerHTML = `<tr><td colspan="7">No matching entries found.</td></tr>`;
    return;
  }

  el.historyTableBody.innerHTML = rows.map(entry => `
    <tr>
      <td>${formatDate(entry.date)}</td>
      <td>
        <strong>${escapeHtml(entry.title)}</strong>
        ${entry.note ? `<div class="muted">${escapeHtml(entry.note)}</div>` : ''}
      </td>
      <td>${entry.category}</td>
      <td><span class="badge ${entry.type}">${entry.type}</span></td>
      <td>${entry.mood || '-'}</td>
      <td class="${entry.type === 'expense' ? 'amount-expense' : 'amount-income'}">${entry.type === 'expense' ? '-' : '+'}${formatCurrency(entry.amount)}</td>
      <td><button class="delete-btn" onclick="deleteEntry('${entry.id}')">Delete</button></td>
    </tr>
  `).join('');
}

function deleteEntry(id) {
  state.entries = state.entries.filter(entry => entry.id !== id);
  saveEntries();
  render();
  showToast('Entry deleted.');
}
window.deleteEntry = deleteEntry;

function renderMoodSummary() {
  const monthEntries = getCurrentMonthEntries().filter(e => e.type === 'expense');
  const impulseCount = monthEntries.filter(e => e.mood === 'Impulse').length;
  const worthItCount = monthEntries.filter(e => e.mood === 'Worth it').length;
  const total = Math.max(monthEntries.length, 1);
  const healthyRatio = Math.max(0, ((worthItCount + monthEntries.filter(e => e.mood === 'Necessary' || e.mood === 'Calm').length) / total) * 100);

  el.moodFill.style.width = `${Math.min(100, healthyRatio)}%`;
  el.moodSummary.textContent = monthEntries.length
    ? `${impulseCount} impulse spends and ${worthItCount} worth-it spends logged this month.`
    : 'Start logging to see your money mood.';
}

function renderBudgetHealth(monthEntries) {
  const expense = sum(monthEntries.filter(e => e.type === 'expense').map(e => e.amount));
  const fixedPlan = state.budget.rent + state.budget.mom + state.budget.transport + state.budget.electricity + state.budget.wifi + state.budget.appliances;
  const comfortSpend = sum(monthEntries.filter(e => e.type === 'expense' && ['Food','Shopping','Beauty','Entertainment','Subscriptions','Other'].includes(e.category)).map(e => e.amount));

  const items = [
    {
      title: 'Planned fixed monthly base',
      text: `${formatCurrency(fixedPlan)} planned across rent, mom, transport, electricity, WiFi, and appliances.`,
      tone: fixedPlan <= state.budget.income * 0.65 ? 'good' : 'warn'
    },
    {
      title: 'Comfort budget check',
      text: `You have spent ${formatCurrency(comfortSpend)} against a comfort budget of ${formatCurrency(state.budget.comfort)}.`,
      tone: comfortSpend <= state.budget.comfort ? 'good' : 'warn'
    },
    {
      title: 'Monthly pressure',
      text: `Total monthly spend currently stands at ${formatCurrency(expense)}.`,
      tone: expense <= state.budget.income ? 'good' : 'bad'
    }
  ];

  el.budgetHealth.innerHTML = items.map(renderInsightCard).join('');
}

function renderChallenge(monthEntries) {
  const challenges = [
    'Try a no-random-spend day today.',
    'Cook or assemble one meal at home instead of ordering.',
    'Delay one non-essential purchase by 24 hours.',
    'Track every rupee you spend today with no gaps.',
    'Keep transport and snack spending below your usual average today.'
  ];
  const idx = monthEntries.length % challenges.length;
  el.challengeText.textContent = challenges[idx];
}

function getCurrentMonthEntries() {
  const now = new Date();
  const ym = now.toISOString().slice(0, 7);
  return state.entries.filter(e => e.date.startsWith(ym));
}

function calculateComfortScore(monthEntries, budget) {
  const income = sum(monthEntries.filter(e => e.type === 'income').map(e => e.amount)) || budget.income || 1;
  const fixedCategories = ['Rent', 'Bills', 'WiFi', 'Transport', 'Family'];
  const comfortCategories = ['Food', 'Shopping', 'Beauty', 'Entertainment', 'Subscriptions', 'Other'];
  const totalExpense = sum(monthEntries.filter(e => e.type === 'expense').map(e => e.amount));
  const comfortSpend = sum(monthEntries.filter(e => e.type === 'expense' && comfortCategories.includes(e.category)).map(e => e.amount));
  const fixedSpend = sum(monthEntries.filter(e => e.type === 'expense' && fixedCategories.includes(e.category)).map(e => e.amount));
  const savings = income - totalExpense;

  let score = 100;
  if (totalExpense > income) score -= 30;
  if (comfortSpend > budget.comfort && budget.comfort > 0) score -= 15;
  if (fixedSpend > income * 0.6) score -= 15;
  if (savings < income * 0.1) score -= 15;
  if (calculateStreak() >= 5) score += 5;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function updateComfortRing(score) {
  const circumference = 2 * Math.PI * 46;
  const offset = circumference - (score / 100) * circumference;
  el.comfortRing.style.strokeDasharray = `${circumference}`;
  el.comfortRing.style.strokeDashoffset = `${offset}`;
}

function calculateStreak() {
  const uniqueDates = [...new Set(state.entries.map(e => e.date))].sort().reverse();
  if (!uniqueDates.length) return 0;
  let streak = 0;
  let cursor = new Date();
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (uniqueDates.includes(key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function getDailyTrend(entries, days) {
  const labels = [];
  const values = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const total = sum(entries.filter(e => e.type === 'expense' && e.date === key).map(e => e.amount));
    labels.push(label);
    values.push(total);
  }
  return { labels, values };
}

function getCategoryBreakdown(entries) {
  const map = {};
  entries.forEach(e => { map[e.category] = (map[e.category] || 0) + e.amount; });
  const sorted = Object.entries(map).sort((a,b) => b[1]-a[1]).slice(0, 8);
  return { labels: sorted.map(([label]) => label), values: sorted.map(([,value]) => value) };
}

function getTopCategory(entries) {
  const breakdown = getCategoryBreakdown(entries.filter(e => e.type === 'expense'));
  if (!breakdown.labels.length) return null;
  return { label: breakdown.labels[0], value: breakdown.values[0] };
}

function averageDailySpend(entries) {
  const expenseEntries = entries.filter(e => e.type === 'expense');
  if (!expenseEntries.length) return 0;
  const uniqueDays = new Set(expenseEntries.map(e => e.date)).size;
  return sum(expenseEntries.map(e => e.amount)) / Math.max(uniqueDays, 1);
}

function loadSampleData() {
  state.entries = SAMPLE_DATA;
  saveEntries();
  render();
  showToast('Sample data loaded.');
}

function exportBackup() {
  const payload = { entries: state.entries, budget: state.budget };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'comfort-daily-log-backup.json';
  a.click();
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
      state.budget = parsed.budget || DEFAULT_BUDGET;
      saveEntries();
      saveBudget();
      fillBudgetInputs();
      render();
      showToast('Backup imported.');
    } catch {
      showToast('Could not import backup file.');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function clearAllData() {
  if (!confirm('Clear all entries and budget data?')) return;
  state.entries = [];
  state.budget = { ...DEFAULT_BUDGET };
  saveEntries();
  saveBudget();
  fillBudgetInputs();
  render();
  showToast('All data cleared.');
}

function loadEntries() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.entries)) || [];
  } catch {
    return [];
  }
}
function loadBudget() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.budget)) || { ...DEFAULT_BUDGET };
  } catch {
    return { ...DEFAULT_BUDGET };
  }
}
function saveEntries() { localStorage.setItem(STORAGE_KEYS.entries, JSON.stringify(state.entries)); }
function saveBudget() { localStorage.setItem(STORAGE_KEYS.budget, JSON.stringify(state.budget)); }

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value || 0);
}
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function sum(nums) { return nums.reduce((a,b) => a+b, 0); }
function percent(n) { return `${Math.round(n)}%`; }
function escapeHtml(str = '') {
  return str.replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\'': '&#39;', '"': '&quot;' }[c]));
}

function showToast(message) {
  el.toast.textContent = message;
  el.toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.toast.classList.remove('show'), 2200);
}

function applyTilt() {
  document.querySelectorAll('.card-3d').forEach(card => {
    card.addEventListener('mousemove', e => {
      if (window.innerWidth < 900) return;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const rotateY = ((x / rect.width) - 0.5) * 8;
      const rotateX = ((y / rect.height) - 0.5) * -8;
      card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}
