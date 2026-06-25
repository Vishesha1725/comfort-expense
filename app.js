const STORAGE_KEYS = {
  entries: 'finance_garden_entries_v1',
  settings: 'finance_garden_settings_v1',
  goals: 'finance_garden_goals_v1'
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
  { name: 'Emergency Fund', target: 60000, saved: 0, growth: 'Big tree' },
  { name: 'Travel Fund', target: 30000, saved: 0, growth: 'Suitcase plant' },
  { name: 'Gifts for Parents', target: 12000, saved: 0, growth: 'Bloom bed' },
  { name: 'Meta Glasses Fund', target: 70000, saved: 0, growth: 'Rare flower bed' },
  { name: 'First Salary Treats', target: 6000, saved: 0, growth: 'Petal patch' }
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
function money(value){ return new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(value || 0); }
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
    animateCoinSunlight();
  }
  saveAll();
  render();
  showToast('Garden updated.');
}

function handleGoalSubmit(e){
  e.preventDefault();
  const goalName = el.goalName.value;
  const amount = Number(el.goalAmount.value || 0);
  if(amount <= 0){ showToast('Add a valid saving amount.'); return; }
  addEntry({ id: crypto.randomUUID(), date: todayKey(), type:'saving', category:goalName, title:`${goalName} saving`, amount, label:'Smart', note:'Added from savings garden' });
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

function computeGarden(monthEntries, income, spent, saved, moneyLeft, foodApps, streak){
  const todayLogged = monthEntries.some(e=>e.date===todayKey());
  const impulseCount = monthEntries.filter(e=>e.label==='Impulse' || e.label==='Regret').length;
  const target = state.settings.monthlySavingsTarget || 1;
  const savePct = saved / target;
  let score = 62;
  if(todayLogged) score += 10; else score -= 12;
  if(streak >= 5) score += 8; else if(streak >= 2) score += 4;
  if(moneyLeft < 0) score -= 28; else if(moneyLeft > income*0.2) score += 10;
  if(savePct >= 1) score += 18; else if(savePct >= .5) score += 8; else if(saved===0) score -= 6;
  if(foodApps > 5000) score -= 8; if(foodApps > 8000) score -= 6;
  if(impulseCount > 4) score -= 12; else if(impulseCount > 2) score -= 6;
  score = Math.max(0, Math.min(100, Math.round(score)));

  let stateLabel = 'Balanced Bloom';
  let reason = 'The garden looks steady and healthy.';
  let modeClass = 'mode-clear';
  let petClass = 'calm';

  if(!todayLogged && monthEntries.length){ stateLabel = 'Dry Day'; reason = 'No log today, so the garden feels a bit dry.'; petClass = 'sleepy'; }
  if(score >= 75){ stateLabel = 'Blooming'; reason = 'Savings and balance are helping the garden flourish.'; petClass = 'happy'; }
  if(savePct >= 1 && moneyLeft >= 0){ stateLabel = 'Golden Bloom'; reason = 'Savings target reached. The garden is thriving.'; petClass = 'excited'; }
  if(score < 55){ stateLabel = 'Weedy'; reason = 'Spending pressure is letting weeds appear.'; modeClass = 'mode-stress'; petClass = 'calm'; }
  if(moneyLeft < 0 || impulseCount > 5){ stateLabel = 'Storm Risk'; reason = 'Overspending is stressing the garden.'; modeClass = 'mode-storm'; petClass = 'stressed'; }
  if(!monthEntries.length){ stateLabel = 'New Garden'; reason = 'Start logging to plant your first growth.'; score = 60; petClass = 'calm'; }

  const flowerCount = Math.min(28, Math.floor(saved / 350));
  const weedCount = Math.min(14, Math.floor(Math.max(0, -moneyLeft) / 1500) + impulseCount);
  const monsterCount = foodApps > 6500 ? Math.min(4, Math.floor(foodApps / 2500)) : 0;
  const emergencyStage = Math.min(3, Math.floor((state.goals.find(g=>g.name==='Emergency Fund')?.saved || 0) / 15000));
  const travelStage = Math.min(3, Math.floor((state.goals.find(g=>g.name==='Travel Fund')?.saved || 0) / 7500));
  const rainOn = streak >= 3 || todayLogged;

  return { score, stateLabel, reason, modeClass, petClass, flowerCount, weedCount, monsterCount, emergencyStage, travelStage, rainOn, savePct };
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
  const garden = computeGarden(monthEntries, income, spent, saved, moneyLeft, foodApps, streak);

  renderHero(garden, income, spent, saved, moneyLeft, foodApps, streak);
  renderStage(garden);
  renderGardenMap(saved, moneyLeft, foodApps, streak);
  renderEntryLists();
  renderSavings(saved);
  renderInsights(garden, monthEntries, income, spent, saved, moneyLeft, foodApps, streak);
  renderHistory();
}

function renderHero(garden, income, spent, saved, moneyLeft, foodApps, streak){
  $('gardenStateLabel').textContent = garden.stateLabel;
  $('gardenStateReason').textContent = garden.reason;
  $('gardenHeadline').textContent = headlineForGarden(garden);
  $('gardenSubline').textContent = sublineForGarden(garden, foodApps);
  $('gardenScore').textContent = garden.score;
  $('moneyLeftHero').textContent = money(moneyLeft);
  $('savedHero').textContent = money(saved);
  $('safeSpendHero').textContent = money(calculateDailySafeSpend(moneyLeft));
  $('streakHero').textContent = `${streak} days`;
  $('incomeCard').textContent = money(income);
  $('spentCard').textContent = money(spent);
  $('savedCard').textContent = money(saved);
  $('foodAppsCard').textContent = money(foodApps);
}
function headlineForGarden(g){ if(g.stateLabel==='Golden Bloom') return 'Your garden is glowing'; if(g.stateLabel==='Storm Risk') return 'The garden is under stress'; if(g.stateLabel==='Weedy') return 'The garden needs tending'; if(g.stateLabel==='Dry Day') return 'The garden wants water'; if(g.stateLabel==='Blooming') return 'Your garden is flourishing'; return 'Your garden is growing'; }
function sublineForGarden(g, foodApps){ if(g.stateLabel==='Storm Risk') return 'Cut back on overspending to remove weeds and calm the landscape.'; if(g.stateLabel==='Golden Bloom') return 'Savings target reached. Flowers, tree and plant are thriving.'; if(foodApps > 6500) return 'Food delivery overspending is attracting snack monsters.'; return 'Savings plant flowers and regular logging waters the whole garden.'; }

function renderStage(garden){
  const stage = $('gardenStage');
  stage.className = `garden-stage ${garden.modeClass}`;
  $('moneyPet').className = `money-pet ${garden.petClass}`;
  $('emergencyTree').className = `emergency-tree stage-${garden.emergencyStage}`;
  $('travelPlant').className = `travel-plant stage-${garden.travelStage}`;
  $('rainLayer').style.display = garden.rainOn ? 'block' : 'none';
  renderFlowers(garden.flowerCount);
  renderWeeds(garden.weedCount);
  renderSnackMonsters(garden.monsterCount);
  renderWaterRipples(garden.rainOn);
}

function renderFlowers(count){
  const holder = $('flowerField');
  const coords = [
    [120,420],[160,390],[210,430],[260,400],[320,430],[380,410],[430,440],[500,404],[560,432],[610,398],[670,430],[720,406],
    [146,454],[206,468],[282,456],[350,470],[418,460],[492,472],[566,456],[636,470],[702,454],[260,360],[420,350],[580,362],[680,344],[520,330],[340,332],[176,340]
  ];
  holder.innerHTML = coords.slice(0, count).map(([x,y],i)=>`<div class="flower" style="left:${x}px; top:${y}px; animation-delay:${i*0.03}s"><div class="petal-a"></div><div class="petal-b"></div><div class="petal-c"></div><div class="petal-d"></div><div class="center"></div><div class="stem"></div></div>`).join('');
}

function renderWeeds(count){
  const holder = $('weedField');
  const coords = [[182,444],[236,410],[306,456],[372,426],[466,450],[618,444],[690,420],[742,448],[118,456],[532,468],[280,382],[646,366],[430,380],[566,392]];
  holder.innerHTML = coords.slice(0, count).map(([x,y],i)=>`<div class="weed" style="left:${x}px; top:${y}px; animation-delay:${i*0.03}s"></div>`).join('');
}

function renderSnackMonsters(count){
  const holder = $('snackMonsters');
  const coords = [[600,394],[656,374],[706,392],[760,376]];
  holder.innerHTML = coords.slice(0,count).map(([x,y],i)=>`<div class="snack-monster" style="left:${x}px; top:${y}px; animation-delay:${i*0.2}s"><div class="mouth"></div><div class="snack"></div></div>`).join('');
}

function renderWaterRipples(on){
  const holder = $('wateringRipples');
  if(!on){ holder.innerHTML = ''; return; }
  const coords = [[180,454],[350,470],[530,454],[700,468]];
  holder.innerHTML = coords.map(([x,y],i)=>`<div class="ripple" style="left:${x}px; top:${y}px; animation-delay:${i*0.25}s"></div>`).join('');
}

function renderGardenMap(saved, moneyLeft, foodApps, streak){
  const items = [
    ['🌸','Flower bed', saved > 0 ? `${money(saved)} in savings has planted flowers across the field.` : 'Savings entries create flowers.'],
    ['🌳','Emergency tree', (state.goals.find(g=>g.name==='Emergency Fund')?.saved || 0) > 0 ? 'Your emergency fund is growing into a strong tree.' : 'Emergency fund savings grow the big tree.'],
    ['🧳','Travel plant', (state.goals.find(g=>g.name==='Travel Fund')?.saved || 0) > 0 ? 'Travel fund growth is shaping the suitcase plant.' : 'Travel fund savings grow the suitcase plant.'],
    ['🌿','Weeds', moneyLeft < 0 ? 'Budget pressure is creating weeds.' : 'Overspending and regret spends create weeds.'],
    ['🍪','Snack monsters', foodApps > 6500 ? 'High food app spend has attracted snack monsters.' : 'Food delivery overspending can attract snack monsters.'],
    ['🌧️','Watering rain', streak >= 3 ? `${streak}-day logging streak is watering the garden.` : 'Daily logging creates watering rain.']
  ];
  $('gardenMap').innerHTML = items.map(([icon,title,text])=>`<div class="info-item"><div class="info-top"><div><h4>${title}</h4><p>${text}</p></div><div class="info-icon">${icon}</div></div></div>`).join('');
}

function entryCard(entry){
  return `<div class="entry-card"><div class="entry-line"><div><div class="entry-title">${escapeHtml(entry.title)}</div><div class="entry-meta">${formatDate(entry.date)} · ${entry.category} · ${entry.label}</div></div><strong class="entry-amount ${entry.type}">${entry.type==='expense' || entry.type==='breakfast' ? '-' : '+'}${money(entry.amount)}</strong></div><div class="entry-line"><span class="entry-meta">${entry.note ? escapeHtml(entry.note) : entry.type}</span><button class="delete-btn" onclick="deleteEntry('${entry.id}')">Delete</button></div></div>`;
}
function emptyCard(title, text){ return `<div class="entry-card"><h4>${title}</h4><p>${text}</p></div>`; }
function renderEntryLists(){
  const todayEntries = state.entries.filter(e=>e.date===todayKey());
  $('todayEntries').innerHTML = todayEntries.length ? todayEntries.map(entryCard).join('') : emptyCard('No entries today', 'Log something to water the garden.');
  const recent = state.entries.slice(0,8);
  $('recentEntries').innerHTML = recent.length ? recent.map(entryCard).join('') : emptyCard('No entries yet', 'Your recent garden updates will appear here.');
}

function renderSavings(saved){
  const target = state.settings.monthlySavingsTarget || 1;
  const pct = Math.max(0, Math.min(100, Math.round(saved / target * 100)));
  $('totalSavedGarden').textContent = money(saved);
  $('monthlyTargetGarden').textContent = money(target);
  $('bloomIntensity').textContent = `${pct}%`;
  $('growthPct').textContent = `${pct}%`;
  $('savingsMeter').style.width = `${pct}%`;
  $('growthRingFill').style.background = `conic-gradient(from -90deg, #7fab81 0deg, #ecd28f ${pct*3.6}deg, rgba(255,255,255,.16) ${pct*3.6}deg)`;
  $('goalGrid').innerHTML = state.goals.map(goal => {
    const gpct = Math.min(100, Math.round(goal.saved / goal.target * 100));
    return `<div class="goal-card"><h4>${goal.name}</h4><p>Growth: ${goal.growth}</p><p><strong>${money(goal.saved)}</strong> saved of ${money(goal.target)}</p><div class="goal-progress"><div class="goal-progress-bar" style="width:${gpct}%"></div></div></div>`;
  }).join('');
}

function renderInsights(garden, monthEntries, income, spent, saved, moneyLeft, foodApps, streak){
  const regretCount = monthEntries.filter(e=>e.label==='Impulse' || e.label==='Regret').length;
  const breakfast = sum(monthEntries.filter(e=>e.type==='breakfast').map(e=>e.amount));
  const fixedTotal = sum(Object.values(state.settings.fixed)) - state.settings.fixed.comfort;
  const saveRate = income ? Math.round(saved / income * 100) : 0;
  const insights = [
    { tone: garden.score >= 75 ? 'good' : garden.score >= 55 ? 'warn' : 'bad', title:'Garden mood', text:`Garden score is ${garden.score}/100 and the current state is ${garden.stateLabel}.` },
    { tone: moneyLeft >= 0 ? 'good' : 'bad', title:'Money left', text: moneyLeft >= 0 ? `You still have ${money(moneyLeft)} left.` : `You are over budget by ${money(Math.abs(moneyLeft))}.` },
    { tone: saved >= state.settings.monthlySavingsTarget ? 'good' : saved > 0 ? 'warn' : 'bad', title:'Savings growth', text:`You saved ${money(saved)} this month. Savings rate is ${saveRate}%.` },
    { tone: foodApps <= 5000 ? 'good' : foodApps <= 6500 ? 'warn' : 'bad', title:'Food delivery pressure', text:`Food app spending is ${money(foodApps)}. High levels trigger snack monsters.` },
    { tone: regretCount <= 2 ? 'good' : 'warn', title:'Weed risk', text:`${regretCount} entries are tagged Impulse or Regret.` },
    { tone: breakfast <= 1500 ? 'good' : 'warn', title:'Breakfast leakage', text:`Breakfast and snack spend is ${money(breakfast)}.` },
    { tone: fixedTotal <= income * .75 ? 'warn' : 'bad', title:'Fixed-cost pressure', text:`Recurring base is ${money(fixedTotal)} against ${money(income)} income.` },
    { tone: streak >= 3 ? 'good' : 'warn', title:'Watering rhythm', text:`Current logging streak is ${streak} day${streak===1?'':'s'}.` }
  ];
  $('insightList').innerHTML = insights.map(item=>`<div class="info-item ${item.tone||''}"><h4>${item.title}</h4><p>${item.text}</p></div>`).join('');

  const totals = {};
  monthEntries.filter(e=>e.type==='expense' || e.type==='breakfast').forEach(e => totals[e.category] = (totals[e.category] || 0) + e.amount);
  const max = Math.max(...Object.values(totals), 1);
  const cats = Object.entries(totals).sort((a,b)=>b[1]-a[1]).slice(0,10);
  $('categoryGrid').innerHTML = cats.length ? cats.map(([category, value])=>`<div class="category-item"><div class="category-top"><h4>${category}</h4><strong>${money(value)}</strong></div><div class="meter-track"><div class="meter-fill" style="width:${Math.round(value/max*100)}%"></div></div></div>`).join('') : emptyCard('No category pressure yet', 'Add expenses to see where pressure is building.');
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

function animateCoinSunlight(){
  const holder = $('coinSunlight');
  for(let i=0;i<18;i++){
    const coin = document.createElement('div');
    coin.className = 'coin-ray';
    coin.textContent = '₹';
    coin.style.left = `${58 + Math.random()*26}%`;
    coin.style.top = `${40 + Math.random()*30}px`;
    coin.style.animationDelay = `${Math.random()*0.22}s`;
    holder.appendChild(coin);
    setTimeout(()=>coin.remove(), 1700);
  }
}

function sampleEntry(offset, type, category, amount, title, label){ const d = new Date(); d.setDate(d.getDate()+offset); return { id: crypto.randomUUID(), date: d.toISOString().slice(0,10), type, category, amount, title, label, note:'' }; }
function loadSampleData(){
  state.settings = clone(DEFAULT_SETTINGS);
  state.goals = clone(DEFAULT_GOALS);
  const entries = [
    sampleEntry(-7,'income','Salary',60000,'Salary credited','Smart'),
    sampleEntry(-7,'expense','Rent',23000,'Rent payment','Necessary'),
    sampleEntry(-6,'expense','Mom',10000,'Mom contribution','Smart'),
    sampleEntry(-6,'expense','Groceries',540,'Zepto order','Necessary'),
    sampleEntry(-5,'breakfast','Office Breakfast',90,'Office coffee','Worth it'),
    sampleEntry(-5,'expense','Food Delivery',360,'Zomato dinner','Worth it'),
    sampleEntry(-4,'expense','Transport',250,'Cab and metro','Necessary'),
    sampleEntry(-4,'saving','Emergency Fund',2500,'Emergency saving','Smart'),
    sampleEntry(-3,'expense','Electricity',3200,'Electricity bill','Necessary'),
    sampleEntry(-3,'saving','Travel Fund',1500,'Travel fund saving','Smart'),
    sampleEntry(-2,'expense','Groceries',420,'Blinkit order','Necessary'),
    sampleEntry(-1,'breakfast','Office Breakfast',0,'Office free breakfast','Smart'),
    sampleEntry(0,'expense','Office Food',120,'Office snack','Impulse')
  ];
  entries.filter(e=>e.type==='saving').forEach(e=>{ const goal = state.goals.find(g=>g.name===e.category); if(goal) goal.saved += e.amount; });
  state.entries = entries;
  saveAll(); render(); animateCoinSunlight(); showToast('Sample garden loaded.');
}

function exportBackup(){
  const payload = { entries: state.entries, settings: state.settings, goals: state.goals };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type:'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = 'finance-garden-backup.json'; link.click(); URL.revokeObjectURL(url);
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
  if(!confirm('Reset all Finance Garden data?')) return;
  state.entries = []; state.settings = clone(DEFAULT_SETTINGS); state.goals = clone(DEFAULT_GOALS); saveAll(); populateGoalOptions(); fillForms(); render(); showToast('Garden reset.');
}
function showToast(message){ $('toast').textContent = message; $('toast').classList.add('show'); clearTimeout(showToast.timer); showToast.timer = setTimeout(()=>$('toast').classList.remove('show'), 2300); }

init();
