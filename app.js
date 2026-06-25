const STORAGE_KEYS = {
  entries: 'doodle_bakery_entries_v1',
  settings: 'doodle_bakery_settings_v1',
  goals: 'doodle_bakery_goals_v1'
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
  { name: 'Emergency Fund', target: 60000, saved: 0, reward: 'Safety cake layer' },
  { name: 'Travel Fund', target: 30000, saved: 0, reward: 'Trip treats' },
  { name: 'Gifts for Parents', target: 12000, saved: 0, reward: 'Gift box bakes' },
  { name: 'Meta Glasses Fund', target: 70000, saved: 0, reward: 'Premium bakery tray' },
  { name: 'First Salary Treats', target: 6000, saved: 0, reward: 'Celebration pastry box' }
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
  goals: load(STORAGE_KEYS.goals, DEFAULT_GOALS)
};

const el = {};
function $(id){ return document.getElementById(id); }
function clone(obj){ return JSON.parse(JSON.stringify(obj)); }
function load(key, fallback){ try { const v = JSON.parse(localStorage.getItem(key)); return v ?? clone(fallback); } catch { return clone(fallback); } }
function saveAll(){ localStorage.setItem(STORAGE_KEYS.entries, JSON.stringify(state.entries)); localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(state.settings)); localStorage.setItem(STORAGE_KEYS.goals, JSON.stringify(state.goals)); }
function money(v){ return new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(v || 0); }
function formatDate(date){ return new Date(date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }); }
function sum(arr){ return arr.reduce((a,b)=>a + Number(b || 0), 0); }
function todayKey(){ return new Date().toISOString().slice(0,10); }
function currentMonthKey(){ return new Date().toISOString().slice(0,7); }
function currentMonthEntries(){ return state.entries.filter(e => e.date.startsWith(currentMonthKey())); }
function escapeHtml(text=''){ return text.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }

function initElements(){
  ['sampleBtn','exportBtn','importInput','clearBtn','entryForm','entryDate','entryType','entryCategory','entryAmount','entryTitle','entryLabel','entryNote','goalForm','goalName','goalAmount','incomeForm','fixedForm','grossSalaryInput','inHandSalaryInput','otherIncomeInput','monthlySavingsTargetInput','fixedRentInput','fixedMomInput','fixedTransportInput','fixedElectricityInput','fixedWifiInput','fixedAppliancesInput','fixedGroceriesInput','fixedComfortInput','searchInput','filterType','toast'].forEach(id => el[id] = $(id));
  el.navBtns = document.querySelectorAll('.nav-btn');
  el.screens = document.querySelectorAll('.screen');
}

function attachEvents(){
  el.navBtns.forEach(btn => btn.addEventListener('click', ()=>switchScreen(btn.dataset.screen, btn)));
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
  document.querySelectorAll('.quick-btn').forEach(btn => btn.addEventListener('click', ()=>addEntry({
    id: crypto.randomUUID(),
    date: todayKey(),
    type: btn.dataset.type,
    category: btn.dataset.category,
    title: btn.dataset.title,
    amount: Number(btn.dataset.amount),
    label: btn.dataset.label,
    note: 'Quick action'
  })));
}

function init(){
  initElements();
  if(!state.goals.length) state.goals = clone(DEFAULT_GOALS);
  attachEvents();
  populateCategoryOptions();
  populateGoalOptions();
  fillForms();
  el.entryDate.value = todayKey();
  render();
}

function switchScreen(screenId, activeBtn){
  el.navBtns.forEach(btn => btn.classList.remove('active'));
  activeBtn.classList.add('active');
  el.screens.forEach(screen => screen.classList.remove('active-screen'));
  $(screenId).classList.add('active-screen');
}

function populateCategoryOptions(){
  const type = el.entryType.value;
  el.entryCategory.innerHTML = CATEGORY_MAP[type].map(cat => `<option value="${cat}">${cat}</option>`).join('');
}
function populateGoalOptions(){ el.goalName.innerHTML = state.goals.map(g => `<option value="${g.name}">${g.name}</option>`).join(''); }
function fillForms(){
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

function handleEntrySubmit(e){
  e.preventDefault();
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
  if(!entry.title || entry.amount < 0){ showToast('Please add a valid title and amount.'); return; }
  addEntry(entry);
  el.entryForm.reset();
  el.entryDate.value = todayKey();
  el.entryType.value = 'expense';
  populateCategoryOptions();
}

function addEntry(entry){
  state.entries.unshift(entry);
  if(entry.type === 'saving'){
    const goal = state.goals.find(g => g.name === entry.category);
    if(goal) goal.saved += entry.amount;
    animateCoins();
    animateConfetti();
  }
  if(entry.type === 'expense' || entry.type === 'breakfast') animateReceipt();
  if(entry.type === 'income') animateConfetti();
  saveAll();
  render();
  showToast('Bakery updated.');
}

function handleGoalSubmit(e){
  e.preventDefault();
  const goalName = el.goalName.value;
  const amount = Number(el.goalAmount.value || 0);
  if(amount <= 0){ showToast('Add a valid saving amount.'); return; }
  addEntry({ id: crypto.randomUUID(), date: todayKey(), type:'saving', category:goalName, title:`${goalName} saving`, amount, label:'Smart', note:'Added from savings jar' });
  el.goalAmount.value = '';
}

function handleIncomeSubmit(e){
  e.preventDefault();
  state.settings.grossSalary = Number(el.grossSalaryInput.value || 0);
  state.settings.inHandSalary = Number(el.inHandSalaryInput.value || 0);
  state.settings.otherFixedIncome = Number(el.otherIncomeInput.value || 0);
  state.settings.monthlySavingsTarget = Number(el.monthlySavingsTargetInput.value || 0);
  saveAll(); render(); showToast('Income setup saved.');
}

function handleFixedSubmit(e){
  e.preventDefault();
  state.settings.fixed = {
    rent:Number(el.fixedRentInput.value||0), mom:Number(el.fixedMomInput.value||0), transport:Number(el.fixedTransportInput.value||0), electricity:Number(el.fixedElectricityInput.value||0), wifi:Number(el.fixedWifiInput.value||0), appliances:Number(el.fixedAppliancesInput.value||0), groceries:Number(el.fixedGroceriesInput.value||0), comfort:Number(el.fixedComfortInput.value||0)
  };
  saveAll(); render(); showToast('Fixed costs saved.');
}

function calculateStreak(){
  const uniqueDates = [...new Set(state.entries.map(e=>e.date))].sort().reverse();
  if(!uniqueDates.length) return 0;
  let streak = 0; const cursor = new Date();
  while(true){
    const key = cursor.toISOString().slice(0,10);
    if(uniqueDates.includes(key)){ streak += 1; cursor.setDate(cursor.getDate()-1); } else break;
  }
  return streak;
}
function calculateDailySafeSpend(moneyLeft){ const now = new Date(); const lastDate = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate(); const remaining = Math.max(1, lastDate-now.getDate()+1); return Math.max(0, moneyLeft/remaining); }

function computeBakery(monthEntries, income, spent, saved, moneyLeft, foodApps, streak){
  const todayLogged = monthEntries.some(e=>e.date===todayKey());
  const impulseCount = monthEntries.filter(e=>e.label==='Impulse' || e.label==='Regret').length;
  const target = state.settings.monthlySavingsTarget || 1;
  const savePct = saved / target;
  let score = 62;
  if(todayLogged) score += 10; else score -= 12;
  if(streak >= 5) score += 8; else if(streak >= 2) score += 4;
  if(moneyLeft < 0) score -= 28; else if(moneyLeft > income*0.2) score += 10;
  if(savePct >= 1) score += 18; else if(savePct >= .5) score += 8; else if(saved===0) score -= 6;
  if(foodApps > 5000) score -= 6; if(foodApps > 8000) score -= 6;
  if(impulseCount > 4) score -= 12; else if(impulseCount > 2) score -= 6;
  score = Math.max(0, Math.min(100, Math.round(score)));

  let mood = 'Fresh Start';
  let text = 'A calm bakery day.';
  let headline = 'The bakery is open';
  let subline = 'Expenses bake pastries, savings grow the cake.';
  let sceneClass = 'mode-open';
  let soldOut = false;

  if(!monthEntries.length){
    mood = 'Fresh Start';
    text = 'Log your first entry and start the shop.';
    headline = 'Your bakery is waiting';
    subline = 'Add your first entry to stock the bakery.';
  } else if(!todayLogged) {
    mood = 'Warm but Quiet';
    text = 'No log today, so the bakery feels a little sleepy.';
    headline = 'The bakery wants a fresh update';
    subline = 'Log today to keep the shop warm and active.';
  }
  if(score >= 72) {
    mood = 'Busy Bake Day';
    text = 'The bakery is doing well and the display looks lovely.';
    headline = 'The bakery is thriving';
    subline = 'Good balance is keeping the pastry case full.';
    sceneClass = 'mode-busy';
  }
  if(savePct >= 1 && moneyLeft >= 0) {
    mood = 'Celebration Cake';
    text = 'Savings target reached. The bakery is in celebration mode.';
    headline = 'Your cake is fully stacked';
    subline = 'You hit your savings target and unlocked the best bake day.';
    sceneClass = 'mode-busy';
  }
  if(moneyLeft < 0 || impulseCount > 5) {
    mood = 'Budget Heat';
    text = 'Overspending is putting stress on the bakery.';
    headline = 'The bakery is under pressure';
    subline = 'Cut back on extra spending to cool things down.';
    sceneClass = 'mode-warning';
    soldOut = true;
  }

  const pastryCount = Math.min(10, Math.floor(spent / 2500) + Math.floor(foodApps / 2000) + (monthEntries.length ? 1 : 0));
  const cakeTier = savePct >= 1 ? 3 : savePct >= 0.5 ? 2 : savePct > 0 ? 1 : 0;
  const ovenOn = monthEntries.some(e => e.type === 'income') || monthEntries.length > 0;

  return { score, mood, text, headline, subline, sceneClass, soldOut, pastryCount, cakeTier, ovenOn, savePct };
}

function render(){
  fillForms(); populateGoalOptions();
  const monthEntries = currentMonthEntries();
  const income = state.settings.inHandSalary + state.settings.otherFixedIncome + sum(monthEntries.filter(e=>e.type==='income').map(e=>e.amount));
  const spent = sum(monthEntries.filter(e=>e.type==='expense' || e.type==='breakfast').map(e=>e.amount));
  const saved = sum(monthEntries.filter(e=>e.type==='saving').map(e=>e.amount));
  const moneyLeft = income - spent - saved;
  const foodApps = sum(monthEntries.filter(e => /zomato|zepto|blinkit/i.test(`${e.title} ${e.category}`)).map(e=>e.amount));
  const streak = calculateStreak();
  const bakery = computeBakery(monthEntries, income, spent, saved, moneyLeft, foodApps, streak);

  renderHero(bakery, income, spent, saved, moneyLeft, foodApps, streak);
  renderScene(bakery, monthEntries, spent, saved);
  renderBakeryMap(saved, spent, foodApps, streak);
  renderEntries();
  renderSavings(saved);
  renderInsights(bakery, monthEntries, income, spent, saved, moneyLeft, foodApps, streak);
  renderHistory();
}

function renderHero(bakery, income, spent, saved, moneyLeft, foodApps, streak){
  $('bakeryMoodLabel').textContent = bakery.mood;
  $('bakeryMoodText').textContent = bakery.text;
  $('sceneHeadline').textContent = bakery.headline;
  $('sceneSubline').textContent = bakery.subline;
  $('bakeryScore').textContent = bakery.score;
  $('moneyLeftHero').textContent = money(moneyLeft);
  $('savedHero').textContent = money(saved);
  $('safeSpendHero').textContent = money(calculateDailySafeSpend(moneyLeft));
  $('streakHero').textContent = `${streak} days`;
  $('incomeCard').textContent = money(income);
  $('spentCard').textContent = money(spent);
  $('savedCard').textContent = money(saved);
  $('foodAppsCard').textContent = money(foodApps);
}

function renderScene(bakery, monthEntries, spent, saved){
  $('bakeryScene').className = `bakery-scene ${bakery.sceneClass}`;
  $('menuMoodTitle').textContent = bakery.mood;
  $('menuMoodSub').textContent = bakery.subline;
  $('oven').classList.toggle('on', bakery.ovenOn);
  $('soldOutSign').classList.toggle('hidden-item', !bakery.soldOut);
  $('jarFill').style.height = `${Math.max(4, Math.min(100, Math.round(bakery.savePct * 100)))}%`;
  $('cakeBody').className = `cake-body tier-${bakery.cakeTier}`;
  renderPastries(bakery.pastryCount);
  renderFloatingCoins(saved);
}

function renderPastries(count){
  const holder = $('pastryShelf');
  const types = ['croissant','cupcake','donut','cookie'];
  const positions = [
    [18,18],[76,20],[136,18],[198,18],[30,76],[94,82],[158,76],[220,82],[58,122],[176,122]
  ];
  holder.innerHTML = positions.slice(0,count).map(([x,y],i)=>`<div class="pastry ${types[i % types.length]}" style="left:${x}px; top:${y}px; animation-delay:${i*0.03}s"></div>`).join('');
}

function renderFloatingCoins(saved){
  const holder = $('floatingCoins');
  const count = Math.min(5, Math.max(0, Math.floor(saved / 2000)));
  holder.innerHTML = Array.from({ length: count }).map((_, i) => `<div class="float-coin" style="left:${10 + i * 14}px; top:${46 - (i % 2) * 12}px; animation-delay:${i * .25}s">₹</div>`).join('');
}

function renderBakeryMap(saved, spent, foodApps, streak){
  const items = [
    ['🥐','Pastry display', spent > 0 ? `${money(spent)} in spending stocked the pastry case.` : 'Spending adds pastries to the display case.'],
    ['🧾','Receipt printer', 'Whenever you add an expense, the receipt printer runs.'],
    ['🔥','Oven mood', 'Income and activity keep the oven warm and glowing.'],
    ['🍯','Savings jar', saved > 0 ? `${money(saved)} saved is filling the jar.` : 'Savings fill the jar with golden coins.'],
    ['🎂','Cake growth', saved > 0 ? 'Your savings are growing the cake layer by layer.' : 'Savings build the celebration cake.'],
    ['☕','Bakery vibe', streak >= 3 ? `${streak}-day streak keeps the bakery feeling lively.` : 'Daily logging keeps the bakery active.']
  ];
  $('bakeryMap').innerHTML = items.map(([icon, title, text]) => `<div class="info-item"><h4>${icon} ${title}</h4><p>${text}</p></div>`).join('');
}

function entryCard(entry){
  return `<div class="entry-card"><div class="entry-line"><div><div class="entry-title">${escapeHtml(entry.title)}</div><div class="entry-meta">${formatDate(entry.date)} · ${entry.category} · ${entry.label}</div></div><strong class="entry-amount ${entry.type}">${entry.type==='expense' || entry.type==='breakfast' ? '-' : '+'}${money(entry.amount)}</strong></div><div class="entry-line"><span class="entry-meta">${entry.note ? escapeHtml(entry.note) : entry.type}</span><button class="delete-btn" onclick="deleteEntry('${entry.id}')">Delete</button></div></div>`;
}
function emptyCard(title, text){ return `<div class="entry-card"><h4>${title}</h4><p>${text}</p></div>`; }
function renderEntries(){
  const todayEntries = state.entries.filter(e=>e.date===todayKey());
  $('todayEntries').innerHTML = todayEntries.length ? todayEntries.map(entryCard).join('') : emptyCard('Nothing baked today', 'Add today’s first money entry.');
  const recent = state.entries.slice(0,8);
  $('recentEntries').innerHTML = recent.length ? recent.map(entryCard).join('') : emptyCard('No recent bakes', 'Your latest money activity will appear here.');
}

function renderSavings(saved){
  const target = state.settings.monthlySavingsTarget || 1;
  const pct = Math.max(0, Math.min(100, Math.round(saved / target * 100)));
  $('totalSavedJar').textContent = money(saved);
  $('monthlyTargetJar').textContent = money(target);
  $('frostingLevel').textContent = `${pct}%`;
  $('savingsMeter').style.width = `${pct}%`;
  $('bigJarFill').style.height = `${pct}%`;
  $('goalGrid').innerHTML = state.goals.map(goal => {
    const gpct = Math.min(100, Math.round(goal.saved / goal.target * 100));
    return `<div class="goal-card"><h4>${goal.name}</h4><p>Reward: ${goal.reward}</p><p><strong>${money(goal.saved)}</strong> saved of ${money(goal.target)}</p><div class="goal-progress"><div class="goal-progress-bar" style="width:${gpct}%"></div></div></div>`;
  }).join('');
}

function renderInsights(bakery, monthEntries, income, spent, saved, moneyLeft, foodApps, streak){
  const regretCount = monthEntries.filter(e=>e.label==='Impulse' || e.label==='Regret').length;
  const breakfast = sum(monthEntries.filter(e=>e.type==='breakfast').map(e=>e.amount));
  const fixedTotal = sum(Object.values(state.settings.fixed)) - state.settings.fixed.comfort;
  const saveRate = income ? Math.round(saved / income * 100) : 0;
  const insights = [
    { title:'Bakery mood', text:`Bakery score is ${bakery.score}/100 and the current mood is ${bakery.mood}.` },
    { title:'Money left', text: moneyLeft >= 0 ? `You still have ${money(moneyLeft)} left.` : `You are over budget by ${money(Math.abs(moneyLeft))}.` },
    { title:'Savings progress', text:`You saved ${money(saved)} this month. Savings rate is ${saveRate}%.` },
    { title:'Food app pressure', text:`Food app spending is ${money(foodApps)} this month.` },
    { title:'Impulse heat', text:`${regretCount} entries are tagged Impulse or Regret.` },
    { title:'Breakfast leakage', text:`Breakfast and snack spend is ${money(breakfast)}.` },
    { title:'Fixed-cost pressure', text:`Recurring base is ${money(fixedTotal)} against ${money(income)} income.` },
    { title:'Logging streak', text:`Current streak is ${streak} day${streak===1?'':'s'}.` }
  ];
  $('insightList').innerHTML = insights.map(item => `<div class="info-item"><h4>${item.title}</h4><p>${item.text}</p></div>`).join('');

  const totals = {};
  monthEntries.filter(e=>e.type==='expense' || e.type==='breakfast').forEach(e => totals[e.category] = (totals[e.category] || 0) + e.amount);
  const max = Math.max(...Object.values(totals), 1);
  const cats = Object.entries(totals).sort((a,b)=>b[1]-a[1]).slice(0,10);
  $('categoryGrid').innerHTML = cats.length ? cats.map(([category, value]) => `<div class="category-item"><div class="category-top"><h4>${category}</h4><strong>${money(value)}</strong></div><div class="meter-track"><div class="meter-fill" style="width:${Math.round(value/max*100)}%"></div></div></div>`).join('') : emptyCard('No category pressure yet', 'Add expenses to see where budget pressure is coming from.');
}

function renderHistory(){
  const q = el.searchInput.value.trim().toLowerCase();
  const type = el.filterType.value;
  const rows = state.entries.filter(entry => {
    const mq = !q || entry.title.toLowerCase().includes(q) || entry.category.toLowerCase().includes(q) || (entry.note || '').toLowerCase().includes(q);
    const mt = type === 'all' || entry.type === type;
    return mq && mt;
  });
  $('historyBody').innerHTML = rows.length ? rows.map(entry => `<tr><td>${formatDate(entry.date)}</td><td>${escapeHtml(entry.title)}<div class="entry-meta">${escapeHtml(entry.note || '')}</div></td><td>${entry.category}</td><td>${entry.type}</td><td>${entry.label}</td><td class="entry-amount ${entry.type}">${entry.type==='expense' || entry.type==='breakfast' ? '-' : '+'}${money(entry.amount)}</td><td><button class="delete-btn" onclick="deleteEntry('${entry.id}')">Delete</button></td></tr>`).join('') : '<tr><td colspan="7">No entries found.</td></tr>';
}

function deleteEntry(id){
  const entry = state.entries.find(item => item.id === id);
  if(entry && entry.type==='saving'){
    const goal = state.goals.find(g => g.name === entry.category);
    if(goal) goal.saved = Math.max(0, goal.saved - entry.amount);
  }
  state.entries = state.entries.filter(item => item.id !== id);
  saveAll(); render(); showToast('Entry deleted.');
}
window.deleteEntry = deleteEntry;

function animateReceipt(){
  const paper = $('receiptPaper');
  paper.classList.remove('printing');
  void paper.offsetWidth;
  paper.classList.add('printing');
}

function animateCoins(){
  const holder = $('floatingCoins');
  for(let i=0;i<4;i++){
    const coin = document.createElement('div');
    coin.className = 'float-coin';
    coin.textContent = '₹';
    coin.style.left = `${16 + Math.random()*50}px`;
    coin.style.top = `${22 + Math.random()*30}px`;
    coin.style.animationDuration = `${1.4 + Math.random()}s`;
    holder.appendChild(coin);
    setTimeout(()=>coin.remove(), 2200);
  }
}

function animateConfetti(){
  const holder = $('confettiBurst');
  holder.innerHTML = '';
  holder.style.display = 'block';
  const colors = ['#ffb5bd','#ffd7b6','#e6ddff','#d6f2dd','#fff1d2'];
  for(let i=0;i<20;i++){
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = `${30 + Math.random()*70}%`;
    piece.style.top = `${40 + Math.random()*30}px`;
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = `${Math.random()*0.16}s`;
    holder.appendChild(piece);
  }
  clearTimeout(animateConfetti.timer);
  animateConfetti.timer = setTimeout(()=>{ holder.style.display = 'none'; holder.innerHTML=''; }, 1300);
}

function sampleEntry(offset, type, category, amount, title, label){ const d = new Date(); d.setDate(d.getDate()+offset); return { id: crypto.randomUUID(), date: d.toISOString().slice(0,10), type, category, amount, title, label, note:'' }; }
function loadSampleData(){
  state.settings = clone(DEFAULT_SETTINGS);
  state.goals = clone(DEFAULT_GOALS);
  const entries = [
    sampleEntry(-7,'income','Salary',60000,'Salary credited','Smart'),
    sampleEntry(-7,'expense','Rent',23000,'Rent payment','Necessary'),
    sampleEntry(-6,'expense','Mom',10000,'Mom contribution','Smart'),
    sampleEntry(-6,'expense','Groceries',540,'Zepto groceries','Necessary'),
    sampleEntry(-5,'breakfast','Office Breakfast',90,'Office coffee','Worth it'),
    sampleEntry(-5,'expense','Food Delivery',360,'Zomato dinner','Worth it'),
    sampleEntry(-4,'expense','Transport',250,'Cab and metro','Necessary'),
    sampleEntry(-4,'saving','Emergency Fund',2500,'Emergency saving','Smart'),
    sampleEntry(-3,'expense','Electricity',3200,'Electricity bill','Necessary'),
    sampleEntry(-3,'saving','Travel Fund',1500,'Travel fund saving','Smart'),
    sampleEntry(-2,'expense','Shopping',699,'Little treat','Impulse'),
    sampleEntry(-1,'breakfast','Office Breakfast',0,'Office free breakfast','Smart')
  ];
  entries.filter(e=>e.type==='saving').forEach(e=>{ const goal = state.goals.find(g=>g.name===e.category); if(goal) goal.saved += e.amount; });
  state.entries = entries;
  saveAll(); render(); animateConfetti(); showToast('Sample bakery loaded.');
}

function exportBackup(){
  const payload = { entries: state.entries, settings: state.settings, goals: state.goals };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type:'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = 'doodle-money-bakery-backup.json'; link.click(); URL.revokeObjectURL(url);
}
function importBackup(event){
  const file = event.target.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    try{
      const parsed = JSON.parse(reader.result);
      state.entries = Array.isArray(parsed.entries) ? parsed.entries : [];
      state.settings = parsed.settings || clone(DEFAULT_SETTINGS);
      state.goals = parsed.goals || clone(DEFAULT_GOALS);
      saveAll(); populateGoalOptions(); fillForms(); render(); showToast('Backup imported.');
    } catch { showToast('Could not import this file.'); }
  };
  reader.readAsText(file);
  event.target.value = '';
}
function clearData(){
  if(!confirm('Reset all Doodle Money Bakery data?')) return;
  state.entries = []; state.settings = clone(DEFAULT_SETTINGS); state.goals = clone(DEFAULT_GOALS); saveAll(); populateGoalOptions(); fillForms(); render(); showToast('Bakery reset.');
}
function showToast(message){ $('toast').textContent = message; $('toast').classList.add('show'); clearTimeout(showToast.timer); showToast.timer = setTimeout(()=>$('toast').classList.remove('show'), 2300); }

init();
