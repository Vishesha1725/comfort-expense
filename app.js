const STORAGE = {
  entries: 'comfortVibe_entries',
  budget: 'comfortVibe_budget',
  goals: 'comfortVibe_goals',
  theme: 'comfortVibe_theme'
};

const categoryMap = {
  expense: [
    'Food', 'Groceries', 'Transport', 'Rent', 'Electricity', 'WiFi', 'Shopping', 'Mom', 'Office Breakfast', 'Zomato', 'Zepto', 'Blinkit', 'Health', 'Beauty', 'Subscriptions', 'Travel', 'Other'
  ],
  income: ['Salary', 'Refund', 'Transfer In', 'Gift', 'Freelance', 'Other Income']
};

const categoryIcons = {
  Food: '🍜', Groceries: '🛒', Transport: '🚕', Rent: '🏠', Electricity: '💡', WiFi: '📶', Shopping: '🛍️', Mom: '💌',
  'Office Breakfast': '☕', Zomato: '🍕', Zepto: '⚡', Blinkit: '🥤', Health: '💊', Beauty: '💅', Subscriptions: '🎧', Travel: '✈️', Other: '✨',
  Salary: '💼', Refund: '↩️', 'Transfer In': '💸', Gift: '🎁', Freelance: '💻', 'Other Income': '🌟'
};

const themeCopy = {
  candy: {
    className: 'theme-candy',
    sideTitle: 'Candy Pop Mode',
    sideText: 'Bubble cards, pink-purple-blue gradients, spend bubbles, money mood, confetti, and cute category cards.',
    eyebrow: 'Candy Pop Budget Tracker',
    title: 'Track money without making it feel like punishment',
    copy: 'Log your day, see what felt worth it, and build a savings streak that feels satisfying.',
    categoryLabel: 'Cute category cards',
    categoryTitle: 'Your spending candy jar'
  },
  mumbai: {
    className: 'theme-mumbai',
    sideTitle: 'Mumbai Girl Mode',
    sideText: 'Thane rent, cab/metro, office breakfast, Zomato, Zepto, Blinkit, mom contribution, and first salary goals.',
    eyebrow: 'Mumbai Girl Budget Tracker',
    title: 'Track your Thane life, office days, food orders, and savings',
    copy: 'A personal daily tracker for rent, transport, electricity, mom contribution, office food, Zepto, Zomato, and first salary goals.',
    categoryLabel: 'Mumbai daily life cards',
    categoryTitle: 'Your city spending map'
  },
  pet: {
    className: 'theme-pet',
    sideTitle: 'Finance Tamagotchi Mode',
    sideText: 'Your money pet gets happy when you log daily, sleepy if you skip, and stressed when expenses go overboard.',
    eyebrow: 'Finance Pet Tracker',
    title: 'Keep your money pet happy by logging and saving daily',
    copy: 'Every entry gives XP. Saving money makes your pet happier. Overspending makes it stressed. Simple, silly, useful.',
    categoryLabel: 'Pet care money cards',
    categoryTitle: 'Feed your pet better money habits'
  },
  scrapbook: {
    className: 'theme-scrapbook',
    sideTitle: 'Sticker Scrapbook Mode',
    sideText: 'Daily entries feel like stickers with washi tape, colorful tags, spend feelings, and weekly scrapbook summaries.',
    eyebrow: 'Sticker Scrapbook Tracker',
    title: 'Make your money log feel like a colorful daily journal',
    copy: 'Add each spend as a sticker, tag it as worth it or regret, and see your week as a scrapbook instead of boring rows.',
    categoryLabel: 'Sticker category board',
    categoryTitle: 'Your money scrapbook'
  }
};

const defaultBudget = {
  income: 65000,
  rent: 23000,
  mom: 10000,
  transport: 5000,
  electricity: 5000,
  wifi: 500,
  appliances: 2000,
  fun: 12000
};

const defaultGoals = [
  { id: uid(), title: 'Emergency Fund', target: 50000, saved: 8000 },
  { id: uid(), title: 'Travel Fund', target: 30000, saved: 4500 },
  { id: uid(), title: 'Gifts for Parents', target: 10000, saved: 2000 },
  { id: uid(), title: 'Meta Glasses Fund', target: 80000, saved: 5000 }
];

const el = {};
const state = {
  entries: load(STORAGE.entries, []),
  budget: load(STORAGE.budget, defaultBudget),
  goals: load(STORAGE.goals, defaultGoals),
  theme: localStorage.getItem(STORAGE.theme) || 'candy',
  dailyChart: null,
  categoryChart: null
};

function uid() {
  if (crypto && crypto.randomUUID) return crypto.randomUUID();
  return String(Date.now() + Math.random());
}

function init() {
  cacheEls();
  setupDates();
  fillCategoryOptions();
  fillFilters();
  fillBudgetForm();
  wireEvents();
  applyTheme(state.theme);
  renderAll();
}

function cacheEls() {
  const ids = [
    'sideNoteTitle','sideNoteText','heroEyebrow','heroTitle','heroCopy','categoryWorldLabel','categoryWorldTitle','mascotStatus','sampleBtn','exportBtn','importBackup','entryForm','dateInput','typeInput','categoryInput','amountInput','titleInput','feelingInput','noteInput','quickZomato','quickZepto','quickBreakfast','incomeValue','expenseValue','leftValue','streakValue','comfortScore','moodTitle','moodFill','moodTags','petTitle','levelPill','petMessage','xpFill','categoryCards','todayDiary','insightList','watchlist','scrapbookStickers','goalGrid','addGoalBtn','searchInput','filterType','filterCategory','historyBody','budgetForm','setupIncome','setupRent','setupMom','setupTransport','setupElectricity','setupWifi','setupAppliances','setupFun','thaneScoreTitle','thaneScoreDetails','clearAll','toast','confettiLayer'
  ];
  ids.forEach(id => el[id] = document.getElementById(id));
  el.themeBtns = document.querySelectorAll('.theme-btn');
  el.navLinks = document.querySelectorAll('.nav-link');
  el.pages = document.querySelectorAll('.page-section');
  el.jumpBtns = document.querySelectorAll('[data-jump]');
}

function setupDates() {
  el.dateInput.value = todayKey();
}

function wireEvents() {
  el.themeBtns.forEach(btn => btn.addEventListener('click', () => applyTheme(btn.dataset.theme)));
  el.navLinks.forEach(btn => btn.addEventListener('click', () => showSection(btn.dataset.section)));
  el.jumpBtns.forEach(btn => btn.addEventListener('click', () => showSection(btn.dataset.jump)));
  el.typeInput.addEventListener('change', fillCategoryOptions);
  el.entryForm.addEventListener('submit', addEntryFromForm);
  el.quickZomato.addEventListener('click', () => quickEntry('Zomato order', 'Zomato', 450, 'Worth it'));
  el.quickZepto.addEventListener('click', () => quickEntry('Zepto order', 'Zepto', 320, 'Necessary'));
  el.quickBreakfast.addEventListener('click', () => quickEntry('Office breakfast', 'Office Breakfast', 80, 'Necessary'));
  el.searchInput.addEventListener('input', renderHistory);
  el.filterType.addEventListener('change', renderHistory);
  el.filterCategory.addEventListener('change', renderHistory);
  el.budgetForm.addEventListener('submit', saveBudget);
  el.sampleBtn.addEventListener('click', loadSampleLife);
  el.exportBtn.addEventListener('click', exportBackup);
  el.importBackup.addEventListener('change', importBackup);
  el.addGoalBtn.addEventListener('click', addGoal);
  el.clearAll.addEventListener('click', clearAllData);
}

function applyTheme(theme) {
  state.theme = theme;
  localStorage.setItem(STORAGE.theme, theme);
  document.body.className = themeCopy[theme].className;
  el.themeBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.theme === theme));
  const copy = themeCopy[theme];
  el.sideNoteTitle.textContent = copy.sideTitle;
  el.sideNoteText.textContent = copy.sideText;
  el.heroEyebrow.textContent = copy.eyebrow;
  el.heroTitle.textContent = copy.title;
  el.heroCopy.textContent = copy.copy;
  el.categoryWorldLabel.textContent = copy.categoryLabel;
  el.categoryWorldTitle.textContent = copy.categoryTitle;
  setTimeout(renderCharts, 50);
}

function showSection(id) {
  el.pages.forEach(p => p.classList.toggle('active-section', p.id === id));
  el.navLinks.forEach(btn => btn.classList.toggle('active', btn.dataset.section === id));
}

function fillCategoryOptions() {
  const type = el.typeInput.value;
  el.categoryInput.innerHTML = categoryMap[type].map(c => `<option value="${c}">${categoryIcons[c] || ''} ${c}</option>`).join('');
}

function fillFilters() {
  const all = [...new Set([...categoryMap.expense, ...categoryMap.income])];
  el.filterCategory.innerHTML = `<option value="all">All categories</option>` + all.map(c => `<option value="${c}">${c}</option>`).join('');
}

function fillBudgetForm() {
  el.setupIncome.value = state.budget.income;
  el.setupRent.value = state.budget.rent;
  el.setupMom.value = state.budget.mom;
  el.setupTransport.value = state.budget.transport;
  el.setupElectricity.value = state.budget.electricity;
  el.setupWifi.value = state.budget.wifi;
  el.setupAppliances.value = state.budget.appliances;
  el.setupFun.value = state.budget.fun;
}

function addEntryFromForm(e) {
  e.preventDefault();
  const amount = Number(el.amountInput.value);
  if (!amount || amount <= 0 || !el.titleInput.value.trim()) {
    toast('Add a title and valid amount.');
    return;
  }
  const entry = {
    id: uid(),
    date: el.dateInput.value,
    type: el.typeInput.value,
    category: el.categoryInput.value,
    amount,
    title: el.titleInput.value.trim(),
    feeling: el.feelingInput.value,
    note: el.noteInput.value.trim(),
    createdAt: Date.now()
  };
  state.entries.unshift(entry);
  persistEntries();
  el.entryForm.reset();
  el.dateInput.value = todayKey();
  el.typeInput.value = 'expense';
  fillCategoryOptions();
  renderAll();
  if (entry.type === 'income' || entry.feeling === 'Happy save') confetti();
  toast('Entry added to your daily log.');
}

function quickEntry(title, category, amount, feeling) {
  el.dateInput.value = todayKey();
  el.typeInput.value = 'expense';
  fillCategoryOptions();
  el.categoryInput.value = category;
  el.titleInput.value = title;
  el.amountInput.value = amount;
  el.feelingInput.value = feeling;
  el.noteInput.focus();
  showSection('log');
  toast('Quick entry ready. Edit amount if needed.');
}

function saveBudget(e) {
  e.preventDefault();
  state.budget = {
    income: Number(el.setupIncome.value || 0),
    rent: Number(el.setupRent.value || 0),
    mom: Number(el.setupMom.value || 0),
    transport: Number(el.setupTransport.value || 0),
    electricity: Number(el.setupElectricity.value || 0),
    wifi: Number(el.setupWifi.value || 0),
    appliances: Number(el.setupAppliances.value || 0),
    fun: Number(el.setupFun.value || 0)
  };
  localStorage.setItem(STORAGE.budget, JSON.stringify(state.budget));
  renderAll();
  toast('Setup saved.');
}

function renderAll() {
  renderDashboardNumbers();
  renderMoodAndPet();
  renderCharts();
  renderCategoryCards();
  renderTodayDiary();
  renderInsights();
  renderWatchlist();
  renderScrapbook();
  renderGoals();
  renderHistory();
  renderThaneScore();
}

function currentMonthEntries() {
  const month = todayKey().slice(0, 7);
  return state.entries.filter(e => e.date && e.date.startsWith(month));
}

function renderDashboardNumbers() {
  const m = currentMonthEntries();
  const income = total(m.filter(e => e.type === 'income'));
  const expense = total(m.filter(e => e.type === 'expense'));
  el.incomeValue.textContent = money(income);
  el.expenseValue.textContent = money(expense);
  el.leftValue.textContent = money(income - expense);
  el.streakValue.textContent = `${streak()} days`;
}

function renderMoodAndPet() {
  const m = currentMonthEntries();
  const score = comfortScore();
  el.comfortScore.textContent = score;
  el.moodFill.style.width = `${score}%`;

  const expense = total(m.filter(e => e.type === 'expense'));
  const income = total(m.filter(e => e.type === 'income')) || state.budget.income;
  const oops = m.filter(e => ['Oops spend', 'Regret'].includes(e.feeling)).length;
  const worthIt = m.filter(e => e.feeling === 'Worth it').length;
  const daily = avgDailySpend(m);

  el.moodTitle.textContent = score >= 80 ? 'Sparkly and controlled' : score >= 60 ? 'Cute but careful' : score >= 40 ? 'Slightly chaotic' : 'Money pet is stressed';
  el.moodTags.innerHTML = [
    `Income ${money(income)}`,
    `Expense ${money(expense)}`,
    `Oops ${oops}`,
    `Worth it ${worthIt}`,
    `Avg/day ${money(daily)}`
  ].map(t => `<span class="tag">${t}</span>`).join('');

  const level = Math.max(1, Math.floor(state.entries.length / 7) + 1);
  const xp = Math.min(100, (state.entries.length % 7) * (100 / 7));
  el.levelPill.textContent = `Level ${level}`;
  el.xpFill.style.width = `${xp}%`;
  el.petTitle.textContent = score >= 75 ? 'Your pet is happy' : score >= 50 ? 'Your pet is alert' : 'Your pet needs care';
  el.petMessage.textContent = petMessage(score, streak(), expense, income);
  el.mascotStatus.textContent = `Money mood: ${score >= 75 ? 'happy' : score >= 50 ? 'watchful' : 'stressed'}`;
}

function petMessage(score, streakDays, expense, income) {
  if (!state.entries.length) return 'Log your first entry to wake up your finance pet.';
  if (score >= 80 && streakDays >= 3) return 'Your pet is thriving because you are logging and staying controlled.';
  if (expense > income) return 'Your pet is stressed because expenses crossed income. Slow down for a bit.';
  if (streakDays === 0) return 'Your pet is sleepy. Add today’s entry to restart the streak.';
  if (score >= 60) return 'Your pet is okay. Keep an eye on food delivery and shopping.';
  return 'Your pet needs a low-spend day and fewer impulse entries.';
}

function renderCharts() {
  const m = currentMonthEntries();
  const style = getComputedStyle(document.body);
  const colors = [style.getPropertyValue('--a').trim(), style.getPropertyValue('--b').trim(), style.getPropertyValue('--c').trim(), style.getPropertyValue('--d').trim(), '#34d399', '#f472b6', '#fb923c', '#60a5fa'];
  const trend = lastSevenDays(m);
  const split = categorySplit(m.filter(e => e.type === 'expense'));

  if (state.dailyChart) state.dailyChart.destroy();
  state.dailyChart = new Chart(document.getElementById('dailyChart'), {
    type: 'bar',
    data: { labels: trend.labels, datasets: [{ label: 'Spend', data: trend.values, backgroundColor: colors.map(c => c || '#ff5bbd'), borderRadius: 16 }] },
    options: chartOptions()
  });

  if (state.categoryChart) state.categoryChart.destroy();
  state.categoryChart = new Chart(document.getElementById('categoryChart'), {
    type: 'doughnut',
    data: { labels: split.labels, datasets: [{ data: split.values, backgroundColor: colors, borderWidth: 0 }] },
    options: { responsive: true, plugins: { legend: { labels: { color: style.getPropertyValue('--text').trim(), font: { weight: 'bold' } } } } }
  });
}

function chartOptions() {
  const style = getComputedStyle(document.body);
  return {
    responsive: true,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => money(ctx.raw) } } },
    scales: {
      x: { grid: { display: false }, ticks: { color: style.getPropertyValue('--muted').trim(), font: { weight: 'bold' } } },
      y: { grid: { color: 'rgba(100,70,130,0.08)' }, ticks: { color: style.getPropertyValue('--muted').trim(), callback: v => `₹${v}` } }
    }
  };
}

function renderCategoryCards() {
  const m = currentMonthEntries().filter(e => e.type === 'expense');
  const keyCats = state.theme === 'mumbai'
    ? ['Rent','Transport','Electricity','WiFi','Mom','Office Breakfast','Zomato','Zepto','Blinkit','Travel','Groceries','Shopping']
    : state.theme === 'pet'
      ? ['Food','Groceries','Transport','Shopping','Subscriptions','Health','Other','Mom','Rent','Zomato','Zepto','Blinkit']
      : state.theme === 'scrapbook'
        ? ['Food','Shopping','Mom','Travel','Beauty','Zomato','Zepto','Blinkit','Rent','Transport','Groceries','Other']
        : ['Food','Rent','Shopping','Mom','Travel','Zomato','Zepto','Blinkit','Groceries','Transport','Beauty','Subscriptions'];
  el.categoryCards.innerHTML = keyCats.map((cat, i) => {
    const amt = total(m.filter(e => e.category === cat));
    return `<div class="category-card" style="--rot:${i % 2 ? '1.4deg' : '-1.2deg'}"><span class="emoji">${categoryIcons[cat] || '✨'}</span><strong>${cat}</strong><small>${money(amt)}</small></div>`;
  }).join('');
}

function renderTodayDiary() {
  const items = state.entries.filter(e => e.date === todayKey()).slice(0, 8);
  if (!items.length) {
    el.todayDiary.innerHTML = `<div class="diary-item"><div><strong>No entries today</strong><small>Add one quick entry to start the day.</small></div><span class="tag">Fresh page</span></div>`;
    return;
  }
  el.todayDiary.innerHTML = items.map(e => `<div class="diary-item"><div><strong>${escapeHtml(e.title)}</strong><small>${categoryIcons[e.category] || ''} ${e.category} · ${e.feeling}</small></div><span class="${e.type === 'expense' ? 'amount-exp' : 'amount-inc'}">${e.type === 'expense' ? '-' : '+'}${money(e.amount)}</span></div>`).join('');
}

function renderInsights() {
  const m = currentMonthEntries();
  const income = total(m.filter(e => e.type === 'income')) || state.budget.income;
  const expense = total(m.filter(e => e.type === 'expense'));
  const fixed = total(m.filter(e => ['Rent','Electricity','WiFi','Transport','Mom'].includes(e.category)));
  const fun = total(m.filter(e => ['Food','Shopping','Beauty','Subscriptions','Zomato','Zepto','Blinkit','Travel','Other'].includes(e.category)));
  const top = topCategory(m);
  const score = comfortScore();
  const oops = m.filter(e => ['Oops spend','Regret'].includes(e.feeling));
  const biggest = [...m.filter(e => e.type === 'expense')].sort((a,b) => b.amount - a.amount)[0];
  const savingsRate = income ? ((income - expense) / income) * 100 : 0;

  const insights = [
    { tone: score >= 75 ? 'good' : score >= 50 ? 'warn' : 'bad', title: 'Comfort score', text: `Your score is ${score}/100. ${score >= 75 ? 'You are doing fine.' : score >= 50 ? 'You are okay, but a few categories need attention.' : 'This month looks tight.'}` },
    { tone: fun <= state.budget.fun ? 'good' : 'warn', title: 'Fun budget check', text: `Fun and flexible spending is ${money(fun)} against your monthly fun budget of ${money(state.budget.fun)}.` },
    { tone: fixed <= income * 0.6 ? 'good' : 'warn', title: 'Fixed cost pressure', text: `Rent, electricity, WiFi, transport, and mom contribution together are ${money(fixed)}.` },
    { tone: savingsRate >= 20 ? 'good' : savingsRate >= 10 ? 'warn' : 'bad', title: 'Savings pace', text: `Your current savings rate is ${Math.round(savingsRate)}%.` },
    { tone: top ? 'warn' : 'good', title: 'Biggest category', text: top ? `${top.category} is the biggest bucket at ${money(top.amount)}.` : 'No expenses yet.' },
    { tone: oops.length <= 2 ? 'good' : 'warn', title: 'Oops spend tracker', text: `${oops.length} entries were marked as Oops spend or Regret this month.` },
    { tone: biggest && biggest.amount > 5000 ? 'warn' : 'good', title: 'Largest single spend', text: biggest ? `${biggest.title} was your largest spend at ${money(biggest.amount)}.` : 'No expenses yet.' }
  ];
  el.insightList.innerHTML = insights.map(card).join('');
}

function renderWatchlist() {
  const m = currentMonthEntries().filter(e => e.type === 'expense');
  const watch = ['Zomato','Zepto','Blinkit','Office Breakfast','Transport'];
  el.watchlist.innerHTML = watch.map(cat => {
    const rows = m.filter(e => e.category === cat || e.title.toLowerCase().includes(cat.toLowerCase()));
    return `<div class="watch-card"><div><h4>${categoryIcons[cat] || '✨'} ${cat}</h4><p>${rows.length} entries this month</p></div><strong>${money(total(rows))}</strong></div>`;
  }).join('');
}

function renderScrapbook() {
  const week = state.entries.filter(e => daysAgo(e.date) <= 7).slice(0, 8);
  if (!week.length) {
    el.scrapbookStickers.innerHTML = `<div class="sticker" style="--rot:-1deg"><strong>Blank page</strong><span>Add entries to fill your weekly scrapbook.</span></div>`;
    return;
  }
  el.scrapbookStickers.innerHTML = week.map((e, i) => `<div class="sticker" style="--rot:${i % 2 ? '1.5deg' : '-1.5deg'}"><strong>${categoryIcons[e.category] || '✨'} ${escapeHtml(e.title)}</strong><span>${e.feeling} · ${e.type === 'expense' ? '-' : '+'}${money(e.amount)}</span></div>`).join('');
}

function renderGoals() {
  el.goalGrid.innerHTML = state.goals.map(goal => {
    const pct = Math.min(100, goal.target ? (goal.saved / goal.target) * 100 : 0);
    return `<div class="goal-card"><div class="jar"><div class="jar-fill" style="height:${pct}%"></div></div><h4>${escapeHtml(goal.title)}</h4><p>${money(goal.saved)} saved of ${money(goal.target)}</p><input type="number" min="0" value="${goal.saved}" onchange="updateGoal('${goal.id}', this.value)"></div>`;
  }).join('');
}

function updateGoal(id, value) {
  const goal = state.goals.find(g => g.id === id);
  if (!goal) return;
  goal.saved = Number(value || 0);
  localStorage.setItem(STORAGE.goals, JSON.stringify(state.goals));
  renderGoals();
  confetti();
  toast('Savings jar updated.');
}
window.updateGoal = updateGoal;

function addGoal() {
  const title = prompt('Goal name?');
  if (!title) return;
  const target = Number(prompt('Target amount?') || 0);
  state.goals.push({ id: uid(), title, target, saved: 0 });
  localStorage.setItem(STORAGE.goals, JSON.stringify(state.goals));
  renderGoals();
}

function renderHistory() {
  const search = el.searchInput.value.trim().toLowerCase();
  const type = el.filterType.value;
  const category = el.filterCategory.value;
  const rows = state.entries.filter(e => {
    const matchSearch = !search || e.title.toLowerCase().includes(search) || (e.note || '').toLowerCase().includes(search);
    const matchType = type === 'all' || e.type === type;
    const matchCat = category === 'all' || e.category === category;
    return matchSearch && matchType && matchCat;
  });
  if (!rows.length) {
    el.historyBody.innerHTML = `<tr><td colspan="6">No entries found.</td></tr>`;
    return;
  }
  el.historyBody.innerHTML = rows.map(e => `<tr><td>${formatDate(e.date)}</td><td><strong>${escapeHtml(e.title)}</strong><br><small>${escapeHtml(e.note || '')}</small></td><td><span class="badge">${categoryIcons[e.category] || ''} ${e.category}</span></td><td>${e.feeling}</td><td class="${e.type === 'expense' ? 'amount-exp' : 'amount-inc'}">${e.type === 'expense' ? '-' : '+'}${money(e.amount)}</td><td><button class="delete" onclick="deleteEntry('${e.id}')">Delete</button></td></tr>`).join('');
}

function deleteEntry(id) {
  state.entries = state.entries.filter(e => e.id !== id);
  persistEntries();
  renderAll();
  toast('Entry deleted.');
}
window.deleteEntry = deleteEntry;

function renderThaneScore() {
  const m = currentMonthEntries();
  const income = total(m.filter(e => e.type === 'income')) || state.budget.income;
  const expense = total(m.filter(e => e.type === 'expense'));
  const fixedPlan = state.budget.rent + state.budget.mom + state.budget.transport + state.budget.electricity + state.budget.wifi + state.budget.appliances;
  const score = Math.max(0, Math.min(100, Math.round(100 - (fixedPlan / Math.max(income,1))*35 - (expense / Math.max(income,1))*35 + streak()*2)));
  el.thaneScoreTitle.textContent = `${score}/100`;
  el.thaneScoreDetails.innerHTML = [
    { tone: fixedPlan <= income * 0.65 ? 'good' : 'warn', title: 'Monthly fixed base', text: `Your planned fixed base is ${money(fixedPlan)}.` },
    { tone: expense <= income ? 'good' : 'bad', title: 'Logged spend pressure', text: `You have logged ${money(expense)} of expenses this month.` },
    { tone: 'good', title: 'Daily routine categories', text: 'Office breakfast, transport, Zomato, Zepto, Blinkit, rent, mom, electricity, and WiFi are available as categories.' }
  ].map(card).join('');
}

function card(item) {
  return `<div class="insight-card ${item.tone}"><h4>${item.title}</h4><p>${item.text}</p></div>`;
}

function loadSampleLife() {
  state.entries = sampleEntries();
  state.goals = JSON.parse(JSON.stringify(defaultGoals));
  persistEntries();
  localStorage.setItem(STORAGE.goals, JSON.stringify(state.goals));
  renderAll();
  confetti();
  toast('Sample life loaded.');
}

function sampleEntries() {
  const d = n => {
    const date = new Date();
    date.setDate(date.getDate() + n);
    return date.toISOString().slice(0,10);
  };
  return [
    e(d(-8),'income','Salary',65000,'Salary Credit','Calm','Fellowship salary'),
    e(d(-7),'expense','Rent',23000,'Thane Rent','Necessary','Monthly rent'),
    e(d(-7),'expense','Mom',10000,'Mom Contribution','Happy save','Sent home'),
    e(d(-6),'expense','Office Breakfast',80,'Office Breakfast','Necessary','Poha and chai'),
    e(d(-6),'expense','Zomato',466,'Zomato Dinner','Worth it','Long office day'),
    e(d(-5),'expense','Transport',280,'Metro and cab','Necessary','Commute'),
    e(d(-5),'expense','Zepto',305,'Zepto groceries','Necessary','Milk and snacks'),
    e(d(-4),'expense','Blinkit',750,'Blinkit stock-up','Oops spend','Too many snacks'),
    e(d(-4),'expense','Electricity',2900,'Electricity bill','Necessary','AC at night'),
    e(d(-3),'expense','WiFi',500,'Airtel WiFi','Necessary','Monthly WiFi'),
    e(d(-3),'expense','Shopping',1599,'Reliance Trends','Worth it','Office outfit'),
    e(d(-2),'income','Refund',445,'Amazon refund','Calm','Refund received'),
    e(d(-2),'expense','Beauty',857,'Little Joys order','Worth it','Self care'),
    e(d(-1),'expense','Food',200,'Benne Dosa','Worth it','Good snack'),
    e(d(-1),'expense','Subscriptions',299,'YouTube Premium','Annoying','Recurring'),
    e(d(0),'expense','Office Breakfast',90,'Office sandwich','Necessary','Breakfast'),
    e(d(0),'expense','Zomato',478,'Zomato lunch','Regret','Could have avoided')
  ];
}

function e(date, type, category, amount, title, feeling, note) {
  return { id: uid(), date, type, category, amount, title, feeling, note, createdAt: Date.now() };
}

function exportBackup() {
  const blob = new Blob([JSON.stringify({ entries: state.entries, budget: state.budget, goals: state.goals, theme: state.theme }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'comfort-vibe-tracker-backup.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importBackup(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      state.entries = Array.isArray(data.entries) ? data.entries : [];
      state.budget = data.budget || defaultBudget;
      state.goals = Array.isArray(data.goals) ? data.goals : defaultGoals;
      state.theme = data.theme || state.theme;
      persistEntries();
      localStorage.setItem(STORAGE.budget, JSON.stringify(state.budget));
      localStorage.setItem(STORAGE.goals, JSON.stringify(state.goals));
      fillBudgetForm();
      applyTheme(state.theme);
      renderAll();
      toast('Backup imported.');
    } catch {
      toast('Could not import this file.');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function clearAllData() {
  if (!confirm('Clear all tracker data from this browser?')) return;
  state.entries = [];
  state.budget = JSON.parse(JSON.stringify(defaultBudget));
  state.goals = JSON.parse(JSON.stringify(defaultGoals));
  persistEntries();
  localStorage.setItem(STORAGE.budget, JSON.stringify(state.budget));
  localStorage.setItem(STORAGE.goals, JSON.stringify(state.goals));
  fillBudgetForm();
  renderAll();
  toast('Data cleared.');
}

function comfortScore() {
  const m = currentMonthEntries();
  const income = total(m.filter(e => e.type === 'income')) || state.budget.income || 1;
  const expense = total(m.filter(e => e.type === 'expense'));
  const fun = total(m.filter(e => ['Food','Shopping','Beauty','Subscriptions','Zomato','Zepto','Blinkit','Travel','Other'].includes(e.category)));
  const oops = m.filter(e => ['Oops spend','Regret'].includes(e.feeling)).length;
  let score = 100;
  if (expense > income) score -= 32;
  if (expense > income * 0.85) score -= 14;
  if (fun > state.budget.fun) score -= 14;
  score -= Math.min(20, oops * 5);
  score += Math.min(10, streak() * 2);
  return Math.max(0, Math.min(100, Math.round(score)));
}

function streak() {
  const dates = new Set(state.entries.map(e => e.date));
  let count = 0;
  const cursor = new Date();
  while (dates.has(cursor.toISOString().slice(0,10))) {
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

function avgDailySpend(entries) {
  const expenses = entries.filter(e => e.type === 'expense');
  if (!expenses.length) return 0;
  const days = new Set(expenses.map(e => e.date)).size || 1;
  return total(expenses) / days;
}

function lastSevenDays(entries) {
  const labels = [], values = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = date.toISOString().slice(0,10);
    labels.push(date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }));
    values.push(total(entries.filter(e => e.type === 'expense' && e.date === key)));
  }
  return { labels, values };
}

function categorySplit(entries) {
  const map = {};
  entries.forEach(e => map[e.category] = (map[e.category] || 0) + e.amount);
  const rows = Object.entries(map).sort((a,b) => b[1] - a[1]).slice(0,8);
  return { labels: rows.map(r => r[0]), values: rows.map(r => r[1]) };
}

function topCategory(entries) {
  const split = categorySplit(entries.filter(e => e.type === 'expense'));
  return split.labels.length ? { category: split.labels[0], amount: split.values[0] } : null;
}

function daysAgo(dateStr) {
  const now = new Date(todayKey());
  const d = new Date(dateStr);
  return Math.floor((now - d) / (1000 * 60 * 60 * 24));
}

function total(entries) { return entries.reduce((sum, e) => sum + Number(e.amount || 0), 0); }
function todayKey() { return new Date().toISOString().slice(0,10); }
function formatDate(date) { return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }); }
function money(n) { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n || 0)); }
function persistEntries() { localStorage.setItem(STORAGE.entries, JSON.stringify(state.entries)); }
function load(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) || JSON.parse(JSON.stringify(fallback)); } catch { return JSON.parse(JSON.stringify(fallback)); } }
function escapeHtml(str = '') { return String(str).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\'': '&#39;', '"': '&quot;' }[c])); }

function toast(msg) {
  el.toast.textContent = msg;
  el.toast.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.toast.classList.remove('show'), 2200);
}

function confetti() {
  const colors = ['var(--a)','var(--b)','var(--c)','var(--d)','#34d399','#f472b6'];
  for (let i = 0; i < 42; i++) {
    const piece = document.createElement('span');
    piece.className = 'confetti';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = `${Math.random() * 0.25}s`;
    piece.style.transform = `rotate(${Math.random() * 180}deg)`;
    el.confettiLayer.appendChild(piece);
    setTimeout(() => piece.remove(), 1800);
  }
}

init();
