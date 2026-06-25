const STORAGE_KEYS = {
  entries: 'financeTamagotchi_entries_v1',
  settings: 'financeTamagotchi_settings_v1',
  goals: 'financeTamagotchi_goals_v1',
  xp: 'financeTamagotchi_xp_v1'
};

const DEFAULT_SETTINGS = {
  petName: 'Rupi',
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
  { name: 'Emergency Fund', target: 60000, saved: 0, accessory: 'shield', label: 'Guardian Shield', icon: '🛡️' },
  { name: 'Travel Fund', target: 30000, saved: 0, accessory: 'sunglasses', label: 'Vacation Glasses', icon: '🕶️' },
  { name: 'Gifts for Parents', target: 12000, saved: 0, accessory: 'bow', label: 'Gift Bow', icon: '🎀' },
  { name: 'Meta Glasses Fund', target: 70000, saved: 0, accessory: 'smartglasses', label: 'Smart Glasses', icon: '🪄' },
  { name: 'First Salary Treats', target: 6000, saved: 0, accessory: 'crown', label: 'Treat Crown', icon: '👑' }
];

const CATEGORY_MAP = {
  expense: ['Food Delivery', 'Office Food', 'Groceries', 'Transport', 'Rent', 'Electricity', 'WiFi', 'Appliances', 'Mom', 'Shopping', 'Health', 'Beauty', 'Travel', 'Other'],
  income: ['Salary', 'Refund', 'Transfer In', 'Other Income'],
  saving: DEFAULT_GOALS.map(g => g.name),
  breakfast: ['Office Breakfast']
};

const state = {
  entries: load(STORAGE_KEYS.entries, []),
  settings: load(STORAGE_KEYS.settings, DEFAULT_SETTINGS),
  goals: load(STORAGE_KEYS.goals, DEFAULT_GOALS),
  xp: load(STORAGE_KEYS.xp, 0)
};

const el = {};

function $(id) {
  return document.getElementById(id);
}

function initElements() {
  [
    'sampleBtn','exportBtn','importInput','clearBtn','entryForm','entryDate','entryType','entryCategory','entryAmount','entryTitle','entryFeeling','entryNote',
    'goalForm','goalName','goalAmount','searchInput','filterType','incomeForm','fixedForm','petNameInput','grossSalaryInput','inHandSalaryInput','otherIncomeInput','monthlySavingsTargetInput',
    'fixedRentInput','fixedMomInput','fixedTransportInput','fixedElectricityInput','fixedWifiInput','fixedAppliancesInput','fixedGroceriesInput','fixedComfortInput','toast'
  ].forEach(id => { el[id] = $(id); });
  el.navBtns = document.querySelectorAll('.nav-btn');
  el.screens = document.querySelectorAll('.screen');
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function load(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? clone(fallback);
  } catch {
    return clone(fallback);
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function saveAll() {
  save(STORAGE_KEYS.entries, state.entries);
  save(STORAGE_KEYS.settings, state.settings);
  save(STORAGE_KEYS.goals, state.goals);
  save(STORAGE_KEYS.xp, state.xp);
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function currentMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

function currentMonthEntries() {
  const monthKey = currentMonthKey();
  return state.entries.filter(entry => entry.date.startsWith(monthKey));
}

function money(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function sum(list) {
  return list.reduce((acc, val) => acc + Number(val || 0), 0);
}

function escapeHtml(str = '') {
  return str.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[ch]));
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
  el.clearBtn.addEventListener('click', clearAllData);
  el.searchInput.addEventListener('input', renderHistory);
  el.filterType.addEventListener('change', renderHistory);

  document.querySelectorAll('.quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      addEntry({
        id: crypto.randomUUID(),
        date: todayKey(),
        type: btn.dataset.type,
        category: btn.dataset.category,
        title: btn.dataset.title,
        amount: Number(btn.dataset.amount),
        feeling: btn.dataset.type === 'saving' ? 'Smart' : 'Necessary',
        note: 'Quick add'
      });
    });
  });
}

function switchScreen(screenId, activeBtn) {
  el.navBtns.forEach(btn => btn.classList.remove('active'));
  activeBtn.classList.add('active');
  el.screens.forEach(screen => screen.classList.remove('active-screen'));
  $(screenId).classList.add('active-screen');
}

function populateCategoryOptions() {
  const type = el.entryType.value;
  el.entryCategory.innerHTML = CATEGORY_MAP[type].map(cat => `<option value="${cat}">${cat}</option>`).join('');
}

function populateGoalOptions() {
  el.goalName.innerHTML = state.goals.map(goal => `<option value="${goal.name}">${goal.name}</option>`).join('');
}

function fillForms() {
  $('miniPetName').textContent = state.settings.petName;
  el.petNameInput.value = state.settings.petName;
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
    feeling: el.entryFeeling.value,
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
  state.xp += xpForEntry(entry);

  if (entry.type === 'saving') {
    const goal = state.goals.find(g => g.name === entry.category);
    if (goal) goal.saved += entry.amount;
  }

  saveAll();
  render();
  showToast(`Entry saved. +${xpForEntry(entry)} XP`);
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
    feeling: 'Smart',
    note: 'Added from goals section'
  });
  el.goalAmount.value = '';
}

function handleIncomeSubmit(event) {
  event.preventDefault();
  state.settings.petName = el.petNameInput.value.trim() || 'Rupi';
  state.settings.grossSalary = Number(el.grossSalaryInput.value || 0);
  state.settings.inHandSalary = Number(el.inHandSalaryInput.value || 0);
  state.settings.otherFixedIncome = Number(el.otherIncomeInput.value || 0);
  state.settings.monthlySavingsTarget = Number(el.monthlySavingsTargetInput.value || 0);
  saveAll();
  fillForms();
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

function render() {
  fillForms();
  const monthEntries = currentMonthEntries();
  const incomeEntries = monthEntries.filter(entry => entry.type === 'income');
  const expenseEntries = monthEntries.filter(entry => entry.type === 'expense' || entry.type === 'breakfast');
  const savingEntries = monthEntries.filter(entry => entry.type === 'saving');

  const income = state.settings.inHandSalary + state.settings.otherFixedIncome + sum(incomeEntries.map(entry => entry.amount));
  const spent = sum(expenseEntries.map(entry => entry.amount));
  const saved = sum(savingEntries.map(entry => entry.amount));
  const moneyLeft = income - spent - saved;
  const streak = calculateStreak();
  const petState = computePetState(monthEntries, income, spent, saved, moneyLeft, streak);

  renderHero(petState, moneyLeft, streak);
  renderStatCards(spent, saved, moneyLeft);
  renderPetMeters(petState);
  renderMoneySnapshot(monthEntries, income, spent, saved, moneyLeft);
  renderInsights(monthEntries, income, spent, saved, moneyLeft, petState);
  renderActivityBubbles(monthEntries);
  renderRecentEntries();
  renderGoals();
  renderAccessories();
  renderChallengeCards(monthEntries, income, spent, saved, moneyLeft, streak);
  renderAchievements(monthEntries, income, spent, saved, moneyLeft, streak);
  renderHistory();
}

function xpForEntry(entry) {
  if (entry.type === 'saving') return 40;
  if (entry.type === 'income') return 18;
  if (entry.type === 'breakfast') return 12;
  if (entry.feeling === 'Smart') return 20;
  if (entry.feeling === 'Impulse' || entry.feeling === 'Regret') return 10;
  return 15;
}

function calculateStreak() {
  const uniqueDates = [...new Set(state.entries.map(entry => entry.date))].sort().reverse();
  if (!uniqueDates.length) return 0;
  let streak = 0;
  let cursor = new Date();
  while (true) {
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

function getLevelInfo() {
  const level = Math.floor(state.xp / 100) + 1;
  const currentBase = Math.floor(state.xp / 100) * 100;
  const nextBase = currentBase + 100;
  const progress = Math.min(100, ((state.xp - currentBase) / 100) * 100);
  return { level, currentBase, nextBase, progress };
}

function computePetState(monthEntries, income, spent, saved, moneyLeft, streak) {
  const appSpends = sum(monthEntries.filter(entry => /zomato|zepto|blinkit/i.test(entry.title + ' ' + entry.category)).map(entry => entry.amount));
  const impulseCount = monthEntries.filter(entry => entry.feeling === 'Impulse' || entry.feeling === 'Regret').length;
  const todayLogged = monthEntries.some(entry => entry.date === todayKey());
  const fixedTotal = sum(Object.values(state.settings.fixed)) - state.settings.fixed.comfort;

  let happiness = 55;
  let energy = 58;
  let discipline = 52;
  let savingsPower = 40;
  let comfort = 55;

  if (saved >= state.settings.monthlySavingsTarget) {
    happiness += 20; savingsPower += 30; discipline += 12;
  } else if (saved > 0) {
    happiness += 8; savingsPower += Math.min(22, Math.round(saved / Math.max(state.settings.monthlySavingsTarget || 1, 1) * 25));
  }

  if (moneyLeft < 0) {
    happiness -= 26; energy -= 18; comfort -= 20;
  } else if (moneyLeft > income * 0.2) {
    happiness += 12; comfort += 10;
  }

  if (impulseCount > 3) {
    discipline -= 18; happiness -= 9;
  } else if (impulseCount === 0 && monthEntries.length > 0) {
    discipline += 10;
  }

  if (appSpends > 7000) {
    comfort -= 10; discipline -= 8;
  }

  if (streak >= 5) {
    energy += 20; discipline += 15;
  } else if (streak >= 2) {
    energy += 10;
  }

  if (!todayLogged) {
    energy -= 20;
  }

  if (fixedTotal > income * 0.75) {
    comfort -= 10;
  }

  happiness = clamp(happiness);
  energy = clamp(energy);
  discipline = clamp(discipline);
  savingsPower = clamp(savingsPower);
  comfort = clamp(comfort);

  let mood = 'happy';
  let faceEyes = '◕ ◕';
  let mouth = 'ᴗ';
  let headline = `${state.settings.petName} is doing okay`;
  let subline = 'Track daily to keep your pet bright and cheerful.';

  if (!todayLogged) {
    mood = 'sleepy';
    faceEyes = '— —';
    mouth = '﹏';
    headline = `${state.settings.petName} is sleepy`;
    subline = 'You skipped logging today. Open the app and feed your pet some data.';
  }

  if (saved >= state.settings.monthlySavingsTarget && moneyLeft >= 0) {
    mood = 'proud';
    faceEyes = '✦ ✦';
    mouth = 'ᴗ';
    headline = `${state.settings.petName} feels proud`;
    subline = 'Your saving habit is making your pet glow with confidence.';
  }

  if (saved > 0 && streak >= 3 && moneyLeft > income * 0.1) {
    mood = 'excited';
    faceEyes = '★ ★';
    mouth = 'ᵔ';
    headline = `${state.settings.petName} is excited`;
    subline = 'Consistent logging and savings are helping your pet level up fast.';
  }

  if (moneyLeft < 0 || impulseCount > 4) {
    mood = 'stressed';
    faceEyes = '• •';
    mouth = '︵';
    headline = `${state.settings.petName} is stressed`;
    subline = 'Overspending or too many impulse spends are upsetting your pet.';
  }

  return {
    mood,
    happiness,
    energy,
    discipline,
    savingsPower,
    comfort,
    headline,
    subline,
    faceEyes,
    mouth,
    todayLogged,
    appSpends,
    impulseCount,
    fixedTotal,
    score: Math.round((happiness + energy + discipline + savingsPower + comfort) / 5)
  };
}

function clamp(n) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function renderHero(petState, moneyLeft, streak) {
  const levelInfo = getLevelInfo();
  $('petHeadline').textContent = petState.headline;
  $('petSubline').textContent = petState.subline;
  $('miniPetMood').textContent = `Mood: ${capitalize(petState.mood)}`;
  $('levelBadge').textContent = levelInfo.level;
  $('xpLabel').textContent = `${state.xp} / ${levelInfo.nextBase}`;
  $('streakLabel').textContent = `${streak} days`;
  $('xpFill').style.width = `${levelInfo.progress}%`;

  const petStage = $('petStage');
  petStage.className = `pet-stage mood-${petState.mood}`;
  $('petEyes').textContent = petState.faceEyes;
  $('petMouth').textContent = petState.mouth;
  $('miniPetName').textContent = state.settings.petName;

  renderAccessoriesOnPet();
}

function renderAccessoriesOnPet() {
  const unlocked = getUnlockedAccessories();
  const top = $('petAccessoryTop');
  const left = $('petAccessoryLeft');
  const right = $('petAccessoryRight');
  top.className = 'pet-accessory acc-top hidden';
  left.className = 'pet-accessory acc-left hidden';
  right.className = 'pet-accessory acc-right hidden';
  top.textContent = '';
  left.textContent = '';
  right.textContent = '';

  if (unlocked.includes('crown')) {
    top.className = 'pet-accessory acc-top';
    top.textContent = '👑';
    top.style.fontSize = '2rem';
  } else if (unlocked.includes('bow')) {
    top.className = 'pet-accessory acc-top';
    top.textContent = '🎀';
    top.style.fontSize = '1.8rem';
  }

  if (unlocked.includes('smartglasses')) {
    left.className = 'pet-accessory acc-left';
    left.textContent = '🕶️';
    left.style.left = '50%';
    left.style.right = 'auto';
    left.style.top = '122px';
    left.style.transform = 'translateX(-50%)';
  } else if (unlocked.includes('sunglasses')) {
    left.className = 'pet-accessory acc-left';
    left.textContent = '😎';
    left.style.left = '50%';
    left.style.right = 'auto';
    left.style.top = '121px';
    left.style.transform = 'translateX(-50%)';
  }

  if (unlocked.includes('shield')) {
    right.className = 'pet-accessory acc-right';
    right.textContent = '🛡️';
    right.style.fontSize = '1.8rem';
  }
}

function renderStatCards(spent, saved, moneyLeft) {
  $('inHandSalaryCard').textContent = money(state.settings.inHandSalary + state.settings.otherFixedIncome);
  $('monthSpentCard').textContent = money(spent);
  $('monthSavedCard').textContent = money(saved);
  $('moneyLeftCard').textContent = money(moneyLeft);
}

function renderPetMeters(petState) {
  const meters = [
    ['Happiness', petState.happiness, 'Saving and staying under control make your pet happier.'],
    ['Energy', petState.energy, 'Daily logging keeps your pet active and awake.'],
    ['Discipline', petState.discipline, 'Impulse spends reduce discipline.'],
    ['Savings Power', petState.savingsPower, 'Goal savings unlock cool accessories.'],
    ['Comfort', petState.comfort, 'Good money left and controlled app spends help comfort.']
  ];

  $('petMeters').innerHTML = meters.map(([title, value, text]) => `
    <div class="meter-card">
      <h4>${title}</h4>
      <p>${text}</p>
      <div class="meter-track"><div class="meter-bar" style="width:${value}%"></div></div>
      <div class="status-pill">${value}/100</div>
    </div>
  `).join('');
}

function renderMoneySnapshot(monthEntries, income, spent, saved, moneyLeft) {
  const breakfastSpend = sum(monthEntries.filter(entry => entry.type === 'breakfast').map(entry => entry.amount));
  const foodAppSpend = sum(monthEntries.filter(entry => /zomato|zepto|blinkit/i.test(entry.title + ' ' + entry.category)).map(entry => entry.amount));
  const streak = calculateStreak();
  const savingsRate = income ? Math.round((saved / income) * 100) : 0;

  const cards = [
    ['Breakfast spend', money(breakfastSpend)],
    ['Food app spend', money(foodAppSpend)],
    ['Logging streak', `${streak} days`],
    ['Savings rate', `${savingsRate}%`]
  ];

  $('moneySnapshot').innerHTML = cards.map(([title, value]) => `
    <div class="snapshot-card">
      <h4>${title}</h4>
      <p class="goal-amount">${value}</p>
    </div>
  `).join('');
}

function renderInsights(monthEntries, income, spent, saved, moneyLeft, petState) {
  const impulseCount = petState.impulseCount;
  const breakfastSpend = sum(monthEntries.filter(entry => entry.type === 'breakfast').map(entry => entry.amount));
  const fixedTotal = petState.fixedTotal;
  const insights = [
    {
      tone: petState.score >= 75 ? 'good' : petState.score >= 55 ? 'warn' : 'bad',
      title: `${state.settings.petName}'s mood score`,
      text: `Your current pet wellness score is ${petState.score}/100.`
    },
    {
      tone: saved >= state.settings.monthlySavingsTarget ? 'good' : saved > 0 ? 'warn' : 'bad',
      title: 'Savings effect',
      text: `You saved ${money(saved)} this month against a target of ${money(state.settings.monthlySavingsTarget)}.`
    },
    {
      tone: moneyLeft >= 0 ? 'good' : 'bad',
      title: 'Money left',
      text: moneyLeft >= 0 ? `${money(moneyLeft)} is still left after spending and savings.` : `You are over budget by ${money(Math.abs(moneyLeft))}.`
    },
    {
      tone: impulseCount <= 2 ? 'good' : 'warn',
      title: 'Impulse tracker',
      text: `${impulseCount} entries are marked Impulse or Regret.`
    },
    {
      tone: breakfastSpend <= 1500 ? 'good' : 'warn',
      title: 'Breakfast leakage',
      text: `Breakfast and snack spending this month is ${money(breakfastSpend)}.`
    },
    {
      tone: fixedTotal <= income * 0.75 ? 'warn' : 'bad',
      title: 'Fixed-cost pressure',
      text: `Fixed monthly base is ${money(fixedTotal)} out of ${money(income)} available income.`
    }
  ];

  $('insightList').innerHTML = insights.map(item => `
    <div class="insight-card ${item.tone}">
      <h4>${item.title}</h4>
      <p>${item.text}</p>
    </div>
  `).join('');
}

function renderActivityBubbles(monthEntries) {
  const holder = $('activityBubbles');
  const items = [];
  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    const label = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const dayEntries = monthEntries.filter(entry => entry.date === key);
    const spend = sum(dayEntries.filter(entry => entry.type === 'expense' || entry.type === 'breakfast').map(entry => entry.amount));
    const size = Math.max(34, Math.min(90, 34 + spend / 80 + dayEntries.length * 6));
    items.push({ label, spend, size, count: dayEntries.length });
  }

  holder.innerHTML = items.map(item => `
    <div class="bubble-col">
      <div class="bubble" style="width:${item.size}px;height:${item.size}px;">${item.count}</div>
      <div class="bubble-label">${item.label}<br>${money(item.spend)}</div>
    </div>
  `).join('');
}

function renderRecentEntries() {
  const recent = state.entries.slice(0, 8);
  $('recentEntries').innerHTML = recent.length ? recent.map(entry => `
    <div class="entry-card">
      <div class="entry-line">
        <div>
          <div class="entry-title">${escapeHtml(entry.title)}</div>
          <div class="entry-meta">${formatDate(entry.date)} · ${entry.category} · ${entry.feeling}</div>
        </div>
        <strong class="entry-amount ${entry.type}">${(entry.type === 'expense' || entry.type === 'breakfast') ? '-' : '+'}${money(entry.amount)}</strong>
      </div>
      <div class="entry-line">
        <span class="entry-meta">${entry.type} · +${xpForEntry(entry)} XP</span>
        <button class="delete-btn" onclick="deleteEntry('${entry.id}')">Delete</button>
      </div>
    </div>
  `).join('') : `<div class="entry-card"><h4>No entries yet</h4><p>Start logging to wake up your pet.</p></div>`;
}

function renderGoals() {
  $('goalGrid').innerHTML = state.goals.map(goal => {
    const progress = Math.min(100, Math.round((goal.saved / goal.target) * 100));
    const accessoryUnlocked = isAccessoryUnlocked(goal);
    return `
      <div class="goal-card">
        <h4>${goal.name}</h4>
        <p>Target: ${money(goal.target)}</p>
        <p class="goal-amount">Saved: ${money(goal.saved)}</p>
        <div class="meter-track"><div class="meter-bar" style="width:${progress}%"></div></div>
        <div class="status-pill">${progress}% complete · ${accessoryUnlocked ? 'Accessory unlocked' : 'Unlocks ' + goal.label}</div>
      </div>
    `;
  }).join('');
}

function isAccessoryUnlocked(goal) {
  return goal.saved >= Math.max(1, goal.target * 0.35);
}

function getUnlockedAccessories() {
  return state.goals.filter(goal => isAccessoryUnlocked(goal)).map(goal => goal.accessory);
}

function renderAccessories() {
  const unlocked = getUnlockedAccessories();
  $('accessoryGrid').innerHTML = state.goals.map(goal => {
    const open = unlocked.includes(goal.accessory);
    return `
      <div class="accessory-card ${open ? 'unlocked' : 'locked'}">
        <h4>${goal.icon} ${goal.label}</h4>
        <p>${open ? 'Unlocked and available for your pet.' : `Unlock by saving at least 35% of ${money(goal.target)}.`}</p>
        <div class="status-pill">${open ? 'Unlocked' : 'Locked'}</div>
      </div>
    `;
  }).join('');

  $('quickAccessoryShelf').innerHTML = state.goals.map(goal => {
    const open = unlocked.includes(goal.accessory);
    return `
      <div class="accessory-card ${open ? 'unlocked' : 'locked'}">
        <h4>${goal.icon}</h4>
        <p>${goal.label}</p>
      </div>
    `;
  }).join('');
}

function buildChallenges(monthEntries, income, spent, saved, moneyLeft, streak) {
  const today = todayKey();
  const todayEntries = monthEntries.filter(entry => entry.date === today);
  const todaySpend = sum(todayEntries.filter(entry => entry.type === 'expense' || entry.type === 'breakfast').map(entry => entry.amount));
  const todayLogged = todayEntries.length > 0;
  const foodAppToday = todayEntries.some(entry => /zomato|zepto|blinkit/i.test(entry.title + ' ' + entry.category));
  const breakfastCount = monthEntries.filter(entry => entry.type === 'breakfast').length;

  return [
    {
      title: 'Log today',
      text: 'Add at least one money entry today.',
      complete: todayLogged,
      reward: '+12 XP'
    },
    {
      title: 'Low-spend day',
      text: 'Keep today’s spending at or below ₹500.',
      complete: todayLogged && todaySpend <= 500,
      reward: '+18 XP'
    },
    {
      title: 'No food-app day',
      text: 'Avoid Zomato, Zepto and Blinkit today.',
      complete: todayLogged && !foodAppToday,
      reward: '+15 XP'
    },
    {
      title: 'Savings spark',
      text: 'Add one saving entry this week.',
      complete: monthEntries.some(entry => entry.type === 'saving'),
      reward: '+22 XP'
    },
    {
      title: 'Streak builder',
      text: 'Maintain a 3-day logging streak.',
      complete: streak >= 3,
      reward: '+20 XP'
    },
    {
      title: 'Breakfast discipline',
      text: 'Keep breakfast/snack entries this month under 8.',
      complete: breakfastCount <= 8,
      reward: '+10 XP'
    }
  ];
}

function renderChallengeCards(monthEntries, income, spent, saved, moneyLeft, streak) {
  const challenges = buildChallenges(monthEntries, income, spent, saved, moneyLeft, streak);
  $('todayChallengeCard').innerHTML = `
    <h4>${challenges[0].title}</h4>
    <p>${challenges[0].text}</p>
    <div class="status-pill">${challenges[0].complete ? 'Completed' : 'Pending'} · ${challenges[0].reward}</div>
  `;

  $('challengeGrid').innerHTML = challenges.map(challenge => `
    <div class="challenge-card ${challenge.complete ? 'complete' : 'pending'}">
      <h4>${challenge.title}</h4>
      <p>${challenge.text}</p>
      <div class="status-pill">${challenge.complete ? 'Completed' : 'Pending'} · ${challenge.reward}</div>
    </div>
  `).join('');
}

function renderAchievements(monthEntries, income, spent, saved, moneyLeft, streak) {
  const achievements = [
    { title: 'First log', text: 'Add your first entry.', unlocked: state.entries.length > 0 },
    { title: 'Saving starter', text: 'Add a saving entry.', unlocked: monthEntries.some(entry => entry.type === 'saving') },
    { title: 'Pet caretaker', text: 'Maintain a 5-day streak.', unlocked: streak >= 5 },
    { title: 'Budget protector', text: 'Stay non-negative on money left.', unlocked: moneyLeft >= 0 && monthEntries.length > 0 },
    { title: 'No impulse streak', text: 'Have zero Impulse/Regret entries this month.', unlocked: monthEntries.length > 0 && monthEntries.every(entry => !['Impulse', 'Regret'].includes(entry.feeling)) },
    { title: 'Accessory unlocker', text: 'Unlock at least 2 accessories.', unlocked: getUnlockedAccessories().length >= 2 },
    { title: 'Savings queen', text: `Reach ${money(state.settings.monthlySavingsTarget)} in monthly savings.`, unlocked: saved >= state.settings.monthlySavingsTarget },
    { title: 'Pet champion', text: 'Reach level 10.', unlocked: getLevelInfo().level >= 10 }
  ];

  $('achievementGrid').innerHTML = achievements.map(item => `
    <div class="achievement-card ${item.unlocked ? 'unlocked' : 'locked'}">
      <h4>${item.title}</h4>
      <p>${item.text}</p>
      <div class="status-pill">${item.unlocked ? 'Unlocked' : 'Locked'}</div>
    </div>
  `).join('');
}

function renderHistory() {
  const query = el.searchInput.value.trim().toLowerCase();
  const type = el.filterType.value;
  const rows = state.entries.filter(entry => {
    const matchesQuery = !query || entry.title.toLowerCase().includes(query) || entry.category.toLowerCase().includes(query) || (entry.note || '').toLowerCase().includes(query);
    const matchesType = type === 'all' || entry.type === type;
    return matchesQuery && matchesType;
  });

  $('historyBody').innerHTML = rows.length ? rows.map(entry => `
    <tr>
      <td>${formatDate(entry.date)}</td>
      <td>${escapeHtml(entry.title)}<div class="entry-meta">${escapeHtml(entry.note || '')}</div></td>
      <td>${entry.category}</td>
      <td>${entry.type}</td>
      <td>${entry.feeling}</td>
      <td class="entry-amount ${entry.type}">${(entry.type === 'expense' || entry.type === 'breakfast') ? '-' : '+'}${money(entry.amount)}</td>
      <td><button class="delete-btn" onclick="deleteEntry('${entry.id}')">Delete</button></td>
    </tr>
  `).join('') : `<tr><td colspan="7">No entries found.</td></tr>`;
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
  showToast('Entry deleted.');
}
window.deleteEntry = deleteEntry;

function loadSampleData() {
  const sampleGoals = clone(DEFAULT_GOALS);
  const sampleEntries = [
    sampleEntry(-7, 'income', 'Salary', 60000, 'Salary credited', 'Smart'),
    sampleEntry(-7, 'expense', 'Rent', 23000, 'Rent payment', 'Necessary'),
    sampleEntry(-6, 'expense', 'Mom', 10000, 'Mom contribution', 'Smart'),
    sampleEntry(-6, 'expense', 'Groceries', 540, 'Zepto order', 'Necessary'),
    sampleEntry(-5, 'breakfast', 'Office Breakfast', 90, 'Office coffee', 'Worth it'),
    sampleEntry(-5, 'expense', 'Food Delivery', 360, 'Zomato dinner', 'Worth it'),
    sampleEntry(-4, 'expense', 'Transport', 250, 'Cab and metro', 'Necessary'),
    sampleEntry(-4, 'saving', 'Emergency Fund', 2000, 'Emergency saving', 'Smart'),
    sampleEntry(-3, 'expense', 'Electricity', 3200, 'Electricity bill', 'Necessary'),
    sampleEntry(-3, 'saving', 'Travel Fund', 1500, 'Travel fund', 'Smart'),
    sampleEntry(-2, 'expense', 'Groceries', 420, 'Blinkit order', 'Necessary'),
    sampleEntry(-1, 'breakfast', 'Office Breakfast', 0, 'Office free breakfast', 'Smart'),
    sampleEntry(0, 'expense', 'Office Food', 120, 'Office snack', 'Impulse')
  ];

  sampleEntries.filter(entry => entry.type === 'saving').forEach(entry => {
    const goal = sampleGoals.find(item => item.name === entry.category);
    if (goal) goal.saved += entry.amount;
  });

  state.entries = sampleEntries;
  state.goals = sampleGoals;
  state.settings = clone(DEFAULT_SETTINGS);
  state.xp = sampleEntries.reduce((acc, entry) => acc + xpForEntry(entry), 0);
  saveAll();
  populateGoalOptions();
  fillForms();
  render();
  showToast('Sample data loaded.');
}

function sampleEntry(dayOffset, type, category, amount, title, feeling) {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  return {
    id: crypto.randomUUID(),
    date: date.toISOString().slice(0, 10),
    type,
    category,
    amount,
    title,
    feeling,
    note: ''
  };
}

function exportBackup() {
  const payload = { entries: state.entries, settings: state.settings, goals: state.goals, xp: state.xp };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'finance-tamagotchi-backup.json';
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
      state.xp = Number(parsed.xp || 0);
      saveAll();
      populateGoalOptions();
      fillForms();
      render();
      showToast('Backup imported.');
    } catch {
      showToast('Could not import this backup file.');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function clearAllData() {
  if (!confirm('Reset all Finance Tamagotchi data?')) return;
  state.entries = [];
  state.settings = clone(DEFAULT_SETTINGS);
  state.goals = clone(DEFAULT_GOALS);
  state.xp = 0;
  saveAll();
  populateGoalOptions();
  fillForms();
  render();
  showToast('All data reset.');
}

function showToast(message) {
  el.toast.textContent = message;
  el.toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => el.toast.classList.remove('show'), 2300);
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

init();
