const STORAGE_KEYS = {
  entries: 'money_pet_room_entries_v1',
  settings: 'money_pet_room_settings_v1',
  goals: 'money_pet_room_goals_v1'
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
  { name: 'Emergency Fund', target: 60000, saved: 0, unlock: 'Coin shelf' },
  { name: 'Travel Fund', target: 30000, saved: 0, unlock: 'Wall art' },
  { name: 'Gifts for Parents', target: 12000, saved: 0, unlock: 'Toy basket' },
  { name: 'Meta Glasses Fund', target: 70000, saved: 0, unlock: 'Fairy lights' },
  { name: 'First Salary Treats', target: 6000, saved: 0, unlock: 'Extra cushion' }
];

const CATEGORY_MAP = {
  expense: ['Food Delivery', 'Office Food', 'Groceries', 'Transport', 'Rent', 'Electricity', 'WiFi', 'Appliances', 'Mom', 'Shopping', 'Health', 'Beauty', 'Travel', 'Other'],
  income: ['Salary', 'Refund', 'Transfer In', 'Other Income'],
  saving: DEFAULT_GOALS.map(goal => goal.name),
  breakfast: ['Office Breakfast']
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
    'sampleBtn','exportBtn','importInput','clearBtn','entryForm','entryDate','entryType','entryCategory','entryAmount','entryTitle','entryLabel','entryNote',
    'goalForm','goalName','goalAmount','incomeForm','fixedForm','grossSalaryInput','inHandSalaryInput','otherIncomeInput','monthlySavingsTargetInput',
    'fixedRentInput','fixedMomInput','fixedTransportInput','fixedElectricityInput','fixedWifiInput','fixedAppliancesInput','fixedGroceriesInput','fixedComfortInput',
    'searchInput','filterType','toast'
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
      label: btn.dataset.label,
      note: 'Quick action'
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

function todayKey() { return new Date().toISOString().slice(0, 10); }
function currentMonthKey() { return new Date().toISOString().slice(0, 7); }
function currentMonthEntries() { return state.entries.filter(entry => entry.date.startsWith(currentMonthKey())); }
function formatDate(date) { return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
function money(value) { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0); }
function sum(values) { return values.reduce((acc, val) => acc + Number(val || 0), 0); }
function escapeHtml(text='') { return text.replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[c])); }

function handleEntrySubmit(event) {
  event.preventDefault();
  const entry = {
    id: crypto.randomUUID(),
    date: el.entryDate.value,
    type: el.entryType.value,
    category: el.entryCategory.value,
    amount: Number(el.entryAmount.value),
    title: el.entryTitle.value.trim(),
    label: el.entryLabel.value,
    note: el.entryNote.value.trim()
  };
  if (!entry.title || entry.amount < 0) {
    showToast('Please add a valid title and amount.');
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
    const goal = state.goals.find(g => g.name === entry.category);
    if (goal) goal.saved += entry.amount;
    animateBonusCoins();
  }
  saveAll();
  render();
  showToast('Room updated.');
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
    label: 'Smart',
    note: 'Added from savings corner'
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
  const cursor = new Date();
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

function calculateDailySafeSpend(moneyLeft) {
  const now = new Date();
  const lastDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const remaining = Math.max(1, lastDate - now.getDate() + 1);
  return Math.max(0, moneyLeft / remaining);
}

function computeRoomState(monthEntries, income, spent, saved, moneyLeft, foodApps, streak) {
  const todayLogged = monthEntries.some(entry => entry.date === todayKey());
  const impulseCount = monthEntries.filter(entry => entry.label === 'Impulse' || entry.label === 'Regret').length;
  const target = state.settings.monthlySavingsTarget || 1;
  const savePct = saved / target;
  let score = 62;
  if (todayLogged) score += 10; else score -= 12;
  if (streak >= 5) score += 8; else if (streak >= 2) score += 4;
  if (moneyLeft < 0) score -= 28; else if (moneyLeft > income * 0.2) score += 10;
  if (savePct >= 1) score += 18; else if (savePct >= 0.5) score += 8; else if (saved === 0) score -= 6;
  if (foodApps > 5000) score -= 6; if (foodApps > 8000) score -= 6;
  if (impulseCount > 4) score -= 12; else if (impulseCount > 2) score -= 6;
  score = Math.max(0, Math.min(100, Math.round(score)));

  let petMood = 'Calm';
  let petClass = 'walking';
  let roomClass = 'room-calm';
  let speech = 'I am keeping the room cozy.';

  if (!todayLogged) {
    petMood = 'Sleepy';
    petClass = 'sleeping';
    roomClass = 'room-dim';
    speech = 'Log today so I can wake up and play.';
  }
  if (score >= 72) {
    petMood = 'Happy';
    petClass = 'happy';
    roomClass = savePct >= 0.7 ? 'room-rich' : 'room-happy';
    speech = 'We are doing good. I love this cozy room.';
  }
  if (savePct >= 1 && moneyLeft >= 0) {
    petMood = 'Excited';
    petClass = 'excited';
    roomClass = 'room-celebration';
    speech = 'Yay. Savings target reached. Look at our pretty room.';
  }
  if (moneyLeft < 0 || impulseCount > 5) {
    petMood = 'Stressed';
    petClass = 'stressed';
    roomClass = 'room-messy room-dim';
    speech = 'Uh oh. Too much spending is making the room messy.';
  }

  const energy = Math.max(12, Math.min(100, todayLogged ? 38 + streak * 10 : 18));
  const happiness = Math.max(8, Math.min(100, score));
  const mess = Math.max(0, Math.min(100, Math.round((Math.max(0, -moneyLeft) / Math.max(1, income)) * 100 + impulseCount * 8 + (foodApps > 5000 ? 10 : 0))));
  const unlockTier = savePct >= 1 ? 3 : savePct >= 0.45 ? 2 : savePct > 0 ? 1 : 0;

  return { score, petMood, petClass, roomClass, speech, energy, happiness, mess, unlockTier, savePct, todayLogged, impulseCount };
}

function render() {
  fillForms();
  populateGoalOptions();
  const monthEntries = currentMonthEntries();
  const income = state.settings.inHandSalary + state.settings.otherFixedIncome + sum(monthEntries.filter(e => e.type === 'income').map(e => e.amount));
  const spent = sum(monthEntries.filter(e => e.type === 'expense' || e.type === 'breakfast').map(e => e.amount));
  const saved = sum(monthEntries.filter(e => e.type === 'saving').map(e => e.amount));
  const moneyLeft = income - spent - saved;
  const foodApps = sum(monthEntries.filter(e => /zomato|zepto|blinkit/i.test(`${e.title} ${e.category}`)).map(e => e.amount));
  const streak = calculateStreak();
  const room = computeRoomState(monthEntries, income, spent, saved, moneyLeft, foodApps, streak);

  renderHero(room, income, spent, saved, moneyLeft, foodApps, streak);
  renderRoomScene(room, monthEntries, saved, moneyLeft, foodApps);
  renderUnlockGrid(room, saved);
  renderEntries();
  renderSavings(saved);
  renderPetCare(room, monthEntries, spent, saved, moneyLeft, streak);
  renderInsights(room, monthEntries, income, spent, saved, moneyLeft, foodApps, streak);
  renderHistory();
}

function renderHero(room, income, spent, saved, moneyLeft, foodApps, streak) {
  $('roomHeadline').textContent = roomHeadline(room, moneyLeft, saved);
  $('roomSubline').textContent = roomSubline(room, foodApps);
  $('roomScore').textContent = room.score;
  $('sidebarPetMood').textContent = room.petMood;
  $('sidebarPetText').textContent = room.speech;
  $('moneyLeftHero').textContent = money(moneyLeft);
  $('savedHero').textContent = money(saved);
  $('safeSpendHero').textContent = money(calculateDailySafeSpend(moneyLeft));
  $('streakHero').textContent = `${streak} days`;
  $('incomeCard').textContent = money(income);
  $('spentCard').textContent = money(spent);
  $('savedCard').textContent = money(saved);
  $('foodAppsCard').textContent = money(foodApps);
}

function roomHeadline(room, moneyLeft, saved) {
  if (room.petMood === 'Excited') return 'Mochi is celebrating';
  if (room.petMood === 'Stressed') return 'The room needs calming down';
  if (room.petMood === 'Sleepy') return 'Mochi is napping';
  if (saved > 0) return 'The room is getting prettier';
  if (moneyLeft >= 0) return 'The room feels calm and balanced';
  return 'The room is changing';
}

function roomSubline(room, foodApps) {
  if (room.petMood === 'Stressed') return 'Too many spends or regret buys are creating clutter.';
  if (room.petMood === 'Excited') return 'You hit the savings target and unlocked celebration mode.';
  if (!room.todayLogged) return 'Log today to wake Mochi up and turn the lights back on.';
  if (foodApps > 5000) return 'Food app spending is getting a little heavy this month.';
  return 'Keep saving and logging daily to unlock more room items.';
}

function renderRoomScene(room, monthEntries, saved, moneyLeft, foodApps) {
  const roomEl = $('petRoom');
  roomEl.className = `pet-room ${room.roomClass}`;
  const pet = $('petCharacter');
  pet.className = `pet-character ${room.petClass}`;
  $('petSpeech').textContent = room.speech;

  const now = new Date();
  const calendarCard = $('calendarCard');
  $('calendarDate').textContent = String(now.getDate());
  $('calendarMonth').textContent = now.toLocaleDateString('en-IN', { month: 'short' });
  calendarCard.classList.remove('flip');
  void calendarCard.offsetWidth;
  calendarCard.classList.add('flip');

  $('plantPot').className = `plant-pot stage-${room.unlockTier >= 3 ? 3 : room.unlockTier >= 1 ? 2 : 1}`;
  $('jarCoinsFill').style.height = `${Math.max(4, Math.min(100, Math.round(room.savePct * 100)))}%`;

  renderFloatingCoins(saved);
  renderClutter(room, moneyLeft, foodApps);
}

function renderFloatingCoins(saved) {
  const holder = $('floatingCoins');
  const count = Math.min(5, Math.max(0, Math.floor(saved / 2000)));
  holder.innerHTML = Array.from({ length: count }).map((_, i) => `
    <div class="float-coin" style="left:${8 + i * 14}px; top:${46 - (i % 2) * 12}px; animation-delay:${i * .25}s">₹</div>
  `).join('');
}

function renderClutter(room, moneyLeft, foodApps) {
  const holder = $('clutterLayer');
  if (room.petMood !== 'Stressed') {
    holder.innerHTML = '';
    return;
  }
  const clutterItems = [
    '<div class="clutter paper" style="left:112px; bottom:78px"></div>',
    '<div class="clutter box" style="right:122px; bottom:92px"></div>',
    '<div class="clutter sock" style="left:274px; bottom:70px"></div>'
  ];
  if (foodApps > 5000) clutterItems.push('<div class="clutter box" style="right:66px; bottom:122px"></div>');
  if (moneyLeft < 0) clutterItems.push('<div class="clutter paper" style="left:360px; bottom:78px"></div>');
  holder.innerHTML = clutterItems.join('');
}

function renderUnlockGrid(room, saved) {
  const items = [
    { icon:'🖼️', title:'Wall art', unlocked: room.unlockTier >= 2, note:'Unlocked by stable savings' },
    { icon:'🧸', title:'Toy basket', unlocked: room.unlockTier >= 2, note:'Makes the room feel warmer' },
    { icon:'💡', title:'Fairy lights', unlocked: room.unlockTier >= 3, note:'Unlocked at higher savings progress' },
    { icon:'🪙', title:'Coin shelf', unlocked: room.unlockTier >= 2, note:'Shows off savings energy' },
    { icon:'🛏️', title:'Extra cushion', unlocked: room.unlockTier >= 2, note:'Cozier bed setup' },
    { icon:'🌱', title:'Bigger plant', unlocked: saved > 0, note:'Plant grows whenever you save' }
  ];
  $('unlockGrid').innerHTML = items.map(item => `
    <div class="unlock-item">
      <div>
        <h4>${item.title}</h4>
        <p>${item.unlocked ? item.note : 'Keep saving to unlock this item.'}</p>
      </div>
      <div class="unlock-icon">${item.icon}</div>
    </div>
  `).join('');
}

function entryCard(entry) {
  return `
    <div class="entry-card">
      <div class="entry-line">
        <div>
          <div class="entry-title">${escapeHtml(entry.title)}</div>
          <div class="entry-meta">${formatDate(entry.date)} · ${entry.category} · ${entry.label}</div>
        </div>
        <strong class="entry-amount ${entry.type}">${entry.type === 'expense' || entry.type === 'breakfast' ? '-' : '+'}${money(entry.amount)}</strong>
      </div>
      <div class="entry-line">
        <span class="entry-meta">${entry.note ? escapeHtml(entry.note) : entry.type}</span>
        <button class="delete-btn" onclick="deleteEntry('${entry.id}')">Delete</button>
      </div>
    </div>
  `;
}

function renderEntries() {
  const todayEntries = state.entries.filter(entry => entry.date === todayKey());
  $('todayEntries').innerHTML = todayEntries.length ? todayEntries.map(entryCard).join('') : emptyCard('Nothing logged today', 'Add today’s first money move.');
  const recent = state.entries.slice(0, 8);
  $('recentEntries').innerHTML = recent.length ? recent.map(entryCard).join('') : emptyCard('No entries yet', 'Your recent updates will appear here.');
}

function renderSavings(saved) {
  const target = state.settings.monthlySavingsTarget || 1;
  const pct = Math.max(0, Math.min(100, Math.round(saved / target * 100)));
  $('totalSavedJar').textContent = money(saved);
  $('monthlyTargetJar').textContent = money(target);
  $('roomGlowJar').textContent = `${pct}%`;
  $('savingsMeter').style.width = `${pct}%`;
  $('bigJarFill').style.height = `${pct}%`;
  $('goalGrid').innerHTML = state.goals.map(goal => {
    const gpct = Math.min(100, Math.round(goal.saved / goal.target * 100));
    return `
      <div class="goal-card">
        <h4>${goal.name}</h4>
        <p>Unlock: ${goal.unlock}</p>
        <p><strong>${money(goal.saved)}</strong> saved of ${money(goal.target)}</p>
        <div class="goal-progress"><div class="goal-progress-bar" style="width:${gpct}%"></div></div>
      </div>
    `;
  }).join('');
}

function renderPetCare(room, monthEntries, spent, saved, moneyLeft, streak) {
  $('petMoodLarge').textContent = room.petMood;
  $('petMoodReason').textContent = room.speech;
  $('petEnergy').textContent = `${room.energy}%`;
  $('petHappiness').textContent = `${room.happiness}%`;
  $('messLevel').textContent = `${room.mess}%`;
  const achievements = [
    { title:'Daily logger', ok: streak >= 3, note: streak >= 3 ? `${streak}-day logging streak.` : 'Log 3 days in a row.' },
    { title:'Smart saver', ok: saved >= state.settings.monthlySavingsTarget, note: saved >= state.settings.monthlySavingsTarget ? 'Savings target reached.' : 'Reach your monthly savings target.' },
    { title:'No-spend control', ok: moneyLeft >= 0, note: moneyLeft >= 0 ? 'Still within budget balance.' : 'Bring money left back above zero.' },
    { title:'Room calm week', ok: room.mess < 30, note: room.mess < 30 ? 'Low mess level this month.' : 'Reduce impulse spends to lower mess.' }
  ];
  $('petAchievements').innerHTML = achievements.map(item => `
    <div class="achievement-card ${item.ok ? 'good' : 'locked'}">
      <h4>${item.title}</h4>
      <p>${item.note}</p>
    </div>
  `).join('');
}

function renderInsights(room, monthEntries, income, spent, saved, moneyLeft, foodApps, streak) {
  const regretCount = monthEntries.filter(e => e.label === 'Impulse' || e.label === 'Regret').length;
  const breakfast = sum(monthEntries.filter(e => e.type === 'breakfast').map(e => e.amount));
  const fixedTotal = sum(Object.values(state.settings.fixed)) - state.settings.fixed.comfort;
  const saveRate = income ? Math.round(saved / income * 100) : 0;
  const insights = [
    { tone: room.happiness >= 75 ? 'good' : room.happiness >= 55 ? 'warn' : 'bad', title:'Room mood', text:`Room score is ${room.score}/100 and Mochi is ${room.petMood.toLowerCase()}.` },
    { tone: moneyLeft >= 0 ? 'good' : 'bad', title:'Money left', text: moneyLeft >= 0 ? `You still have ${money(moneyLeft)} left.` : `You are over budget by ${money(Math.abs(moneyLeft))}.` },
    { tone: saved >= state.settings.monthlySavingsTarget ? 'good' : saved > 0 ? 'warn' : 'bad', title:'Savings growth', text:`You saved ${money(saved)} this month. Savings rate is ${saveRate}%.` },
    { tone: foodApps <= 5000 ? 'good' : foodApps <= 8000 ? 'warn' : 'bad', title:'Food app pressure', text:`Food app spending is ${money(foodApps)} this month.` },
    { tone: regretCount <= 2 ? 'good' : 'warn', title:'Impulse clutter', text:`${regretCount} entries are tagged Impulse or Regret.` },
    { tone: breakfast <= 1500 ? 'good' : 'warn', title:'Breakfast leakage', text:`Breakfast and snack spending is ${money(breakfast)}.` },
    { tone: fixedTotal <= income * 0.75 ? 'warn' : 'bad', title:'Fixed-cost pressure', text:`Recurring base is ${money(fixedTotal)} against ${money(income)} income.` },
    { tone: streak >= 3 ? 'good' : 'warn', title:'Logging streak', text:`Current streak is ${streak} day${streak === 1 ? '' : 's'}.` }
  ];
  $('insightList').innerHTML = insights.map(item => `
    <div class="insight-card ${item.tone}">
      <h4>${item.title}</h4>
      <p>${item.text}</p>
    </div>
  `).join('');

  const totals = {};
  monthEntries.filter(e => e.type === 'expense' || e.type === 'breakfast').forEach(e => totals[e.category] = (totals[e.category] || 0) + e.amount);
  const max = Math.max(...Object.values(totals), 1);
  const cats = Object.entries(totals).sort((a,b) => b[1] - a[1]).slice(0, 10);
  $('categoryGrid').innerHTML = cats.length ? cats.map(([category, value]) => {
    const pct = Math.round(value / max * 100);
    return `
      <div class="category-item">
        <div class="category-top">
          <h4>${category}</h4>
          <strong>${money(value)}</strong>
        </div>
        <div class="meter-track"><div class="meter-fill" style="width:${pct}%"></div></div>
      </div>
    `;
  }).join('') : emptyCard('No category pressure yet', 'Add expenses to see category pressure.');
}

function renderHistory() {
  const q = el.searchInput.value.trim().toLowerCase();
  const type = el.filterType.value;
  const rows = state.entries.filter(entry => {
    const matchQ = !q || entry.title.toLowerCase().includes(q) || entry.category.toLowerCase().includes(q) || (entry.note || '').toLowerCase().includes(q);
    const matchT = type === 'all' || entry.type === type;
    return matchQ && matchT;
  });
  $('historyBody').innerHTML = rows.length ? rows.map(entry => `
    <tr>
      <td>${formatDate(entry.date)}</td>
      <td>${escapeHtml(entry.title)}<div class="entry-meta">${escapeHtml(entry.note || '')}</div></td>
      <td>${entry.category}</td>
      <td>${entry.type}</td>
      <td>${entry.label}</td>
      <td class="entry-amount ${entry.type}">${entry.type === 'expense' || entry.type === 'breakfast' ? '-' : '+'}${money(entry.amount)}</td>
      <td><button class="delete-btn" onclick="deleteEntry('${entry.id}')">Delete</button></td>
    </tr>
  `).join('') : '<tr><td colspan="7">No entries found.</td></tr>';
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

function emptyCard(title, text) {
  return `<div class="entry-card"><h4>${title}</h4><p>${text}</p></div>`;
}

function animateBonusCoins() {
  const holder = $('celebrationSparkles');
  holder.style.display = 'block';
  clearTimeout(animateBonusCoins.timer);
  animateBonusCoins.timer = setTimeout(() => { holder.style.display = ''; }, 1800);
}

function loadSampleData() {
  state.settings = clone(DEFAULT_SETTINGS);
  state.goals = clone(DEFAULT_GOALS);
  state.entries = [
    sampleEntry(-7, 'income', 'Salary', 60000, 'Salary credited', 'Smart'),
    sampleEntry(-7, 'expense', 'Rent', 23000, 'Rent payment', 'Necessary'),
    sampleEntry(-6, 'expense', 'Mom', 10000, 'Mom contribution', 'Smart'),
    sampleEntry(-6, 'expense', 'Groceries', 520, 'Zepto order', 'Necessary'),
    sampleEntry(-5, 'breakfast', 'Office Breakfast', 90, 'Office coffee', 'Worth it'),
    sampleEntry(-5, 'expense', 'Food Delivery', 360, 'Zomato dinner', 'Worth it'),
    sampleEntry(-4, 'saving', 'Emergency Fund', 1500, 'Emergency fund saving', 'Smart'),
    sampleEntry(-4, 'expense', 'Transport', 250, 'Cab and metro', 'Necessary'),
    sampleEntry(-3, 'saving', 'Travel Fund', 1000, 'Travel fund saving', 'Smart'),
    sampleEntry(-2, 'expense', 'Electricity', 3200, 'Electricity bill', 'Necessary'),
    sampleEntry(-1, 'expense', 'Shopping', 699, 'Little treat', 'Impulse'),
    sampleEntry(0, 'breakfast', 'Office Breakfast', 0, 'Office free breakfast', 'Smart')
  ];
  state.entries.filter(e => e.type === 'saving').forEach(e => {
    const goal = state.goals.find(g => g.name === e.category);
    if (goal) goal.saved += e.amount;
  });
  saveAll();
  render();
  animateBonusCoins();
  showToast('Sample room loaded.');
}

function sampleEntry(offset, type, category, amount, title, label) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return { id: crypto.randomUUID(), date: d.toISOString().slice(0,10), type, category, amount, title, label, note: '' };
}

function exportBackup() {
  const payload = { entries: state.entries, settings: state.settings, goals: state.goals };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'money-pet-room-backup.json';
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
  if (!confirm('Reset all Money Pet Room data?')) return;
  state.entries = [];
  state.settings = clone(DEFAULT_SETTINGS);
  state.goals = clone(DEFAULT_GOALS);
  saveAll();
  populateGoalOptions();
  fillForms();
  render();
  showToast('Room reset.');
}

function showToast(message) {
  el.toast.textContent = message;
  el.toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => el.toast.classList.remove('show'), 2300);
}

init();
