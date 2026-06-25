const STORAGE_KEYS = {
  entries: "mqp_entries_v2",
  settings: "mqp_settings_v2",
  goals: "mqp_goals_v2",
  xp: "mqp_xp_v2"
};

const DEFAULT_SETTINGS = {
  grossSalary: 66000,
  inHandSalary: 60000,
  otherFixedIncome: 0,
  monthlySavingsTarget: 8000,
  fixed: { rent: 23000, mom: 10000, transport: 5000, electricity: 5000, wifi: 500, appliances: 2000, groceries: 7000, comfort: 9000 }
};

const DEFAULT_GOALS = [
  { name: "Emergency Fund", target: 60000, saved: 0, accessory: "Safety Shield" },
  { name: "Travel Fund", target: 30000, saved: 0, accessory: "Travel Pack" },
  { name: "Gifts for Parents", target: 12000, saved: 0, accessory: "Heart Collar" },
  { name: "Meta Glasses Fund", target: 70000, saved: 0, accessory: "Smart Glasses" },
  { name: "First Salary Treats", target: 6000, saved: 0, accessory: "Celebration Crown" }
];

const CATEGORY_MAP = {
  expense: ["Food Delivery", "Office Food", "Groceries", "Transport", "Rent", "Electricity", "WiFi", "Appliances", "Mom", "Shopping", "Health", "Beauty", "Travel", "Other"],
  income: ["Salary", "Refund", "Transfer In", "Other Income"],
  saving: DEFAULT_GOALS.map(g => g.name),
  breakfast: ["Office Breakfast"]
};

const LEVELS = [
  "Money Baby", "Coin Collector", "Budget Rookie", "Expense Slayer", "Savings Spark",
  "Cash Captain", "Budget Boss", "Smart Money Mage", "Wealth Warrior", "Finance Legend"
];

const CHARACTERS = [
  { id:"mochi", name:"Mochi", title:"Money Pup", icon:"🐶", role:"Main companion", unlock:"Always with you", test:()=>true },
  { id:"penny", name:"Penny", title:"Coin Fairy", icon:"🧚", role:"Savings helper", unlock:"First saving", test:(m)=>m.saved>0 },
  { id:"panda", name:"Panda Pockets", title:"Budget Panda", icon:"🐼", role:"Balance guide", unlock:"Stay under budget", test:(m)=>m.moneyLeft>=0 && m.monthEntries.length>0 },
  { id:"snack", name:"Snack Monster", title:"Food boss", icon:"🍔", role:"Food app monster", unlock:"Food app spend rises", test:(m)=>m.foodApps>0 },
  { id:"shopping", name:"Shopping Goblin", title:"Impulse boss", icon:"🛍️", role:"Shopping monster", unlock:"Shopping spend appears", test:(m)=>m.categoryTotals.Shopping>0 },
  { id:"cab", name:"Cab Beast", title:"Transport boss", icon:"🚕", role:"Transport monster", unlock:"Transport spend appears", test:(m)=>m.categoryTotals.Transport>0 },
  { id:"bill", name:"Bill Dragon", title:"Fixed-cost boss", icon:"🐉", role:"Bills monster", unlock:"Bills are logged", test:(m)=>["Rent","Electricity","WiFi","Appliances"].some(c=>m.categoryTotals[c]>0) },
  { id:"owl", name:"Budget Owl", title:"Insight guide", icon:"🦉", role:"Smart warnings", unlock:"Any warning appears", test:(m)=>m.score<70 || m.activeMonster.name!=="None" },
  { id:"squirrel", name:"Streak Squirrel", title:"Habit tracker", icon:"🐿️", role:"Streak helper", unlock:"3-day streak", test:(m)=>m.streak>=3 }
];

const MONSTERS = [
  { id:"snack", name:"Snack Monster", icon:"🍔", category:"Food Delivery", limit:4000, note:"Defeat with No Zomato Day or food app control." },
  { id:"shopping", name:"Shopping Goblin", icon:"🛍️", category:"Shopping", limit:3500, note:"Defeat with no impulse shopping and 24-hour wait rule." },
  { id:"cab", name:"Cab Beast", icon:"🚕", category:"Transport", limit:6000, note:"Defeat with public transport days or controlled cab usage." },
  { id:"bill", name:"Bill Dragon", icon:"🐉", category:"Bills", limit:35500, note:"Defeat by logging bills and keeping fixed costs planned." },
  { id:"chaos", name:"Chaos Blob", icon:"🧿", category:"Other", limit:2500, note:"Defeat by categorising random spends and adding notes." }
];

const BADGES = [
  { id:"firstLog", icon:"🧾", title:"First Log", text:"Log your first entry.", test:(m)=>m.entries.length>0 },
  { id:"firstSave", icon:"🪙", title:"First Saving", text:"Add your first saving.", test:(m)=>m.saved>0 },
  { id:"noZomato", icon:"🛡️", title:"No Zomato Day", text:"No food delivery today.", test:(m)=>m.todayLogged && m.todayFoodApps===0 },
  { id:"rentWarrior", icon:"🏠", title:"Rent Paid Warrior", text:"Rent logged this month.", test:(m)=>m.categoryTotals.Rent>0 },
  { id:"momStar", icon:"💗", title:"Mom Contribution Star", text:"Mom contribution logged.", test:(m)=>m.categoryTotals.Mom>0 },
  { id:"streak3", icon:"🔥", title:"3-Day Streak", text:"Log for 3 days in a row.", test:(m)=>m.streak>=3 },
  { id:"underBudget", icon:"🐼", title:"Under Budget", text:"Money left is positive.", test:(m)=>m.monthEntries.length>0 && m.moneyLeft>=0 },
  { id:"targetHit", icon:"👑", title:"Target Hit", text:"Reach monthly savings target.", test:(m)=>m.saved>=m.settings.monthlySavingsTarget }
];

const state = {
  entries: load(STORAGE_KEYS.entries, []),
  settings: load(STORAGE_KEYS.settings, DEFAULT_SETTINGS),
  goals: load(STORAGE_KEYS.goals, DEFAULT_GOALS),
  xp: load(STORAGE_KEYS.xp, 0)
};

const el = {};
function $(id){ return document.getElementById(id); }
function clone(obj){ return JSON.parse(JSON.stringify(obj)); }
function load(key, fallback){ try { const v = JSON.parse(localStorage.getItem(key)); return v ?? clone(fallback); } catch { return clone(fallback); } }
function saveAll(){ localStorage.setItem(STORAGE_KEYS.entries, JSON.stringify(state.entries)); localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(state.settings)); localStorage.setItem(STORAGE_KEYS.goals, JSON.stringify(state.goals)); localStorage.setItem(STORAGE_KEYS.xp, JSON.stringify(state.xp)); }
function money(v){ return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(v||0); }
function sum(arr){ return arr.reduce((a,b)=>a+Number(b||0),0); }
function todayKey(){ return new Date().toISOString().slice(0,10); }
function monthKey(){ return new Date().toISOString().slice(0,7); }
function formatDate(date){ return new Date(date).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}); }
function escapeHtml(text=""){ return String(text).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[c])); }

function initElements(){
  ["sampleBtn","exportBtn","importInput","resetBtn","entryForm","entryDate","entryType","entryCategory","entryAmount","entryTitle","entryLabel","entryNote","goalForm","goalName","goalAmount","incomeForm","fixedForm","grossSalaryInput","inHandSalaryInput","otherIncomeInput","monthlySavingsTargetInput","fixedRentInput","fixedMomInput","fixedTransportInput","fixedElectricityInput","fixedWifiInput","fixedAppliancesInput","fixedGroceriesInput","fixedComfortInput","searchInput","filterType","toast"].forEach(id=>el[id]=$(id));
  el.navBtns = document.querySelectorAll(".nav-btn");
  el.screens = document.querySelectorAll(".screen");
}

function init(){
  initElements();
  attachEvents();
  if(!state.goals.length) state.goals = clone(DEFAULT_GOALS);
  populateCategories();
  populateGoals();
  fillForms();
  el.entryDate.value = todayKey();
  render();
}

function attachEvents(){
  el.navBtns.forEach(btn=>btn.addEventListener("click",()=>switchScreen(btn.dataset.screen, btn)));
  el.entryType.addEventListener("change", populateCategories);
  el.entryForm.addEventListener("submit", handleEntrySubmit);
  el.goalForm.addEventListener("submit", handleGoalSubmit);
  el.incomeForm.addEventListener("submit", handleIncomeSubmit);
  el.fixedForm.addEventListener("submit", handleFixedSubmit);
  el.sampleBtn.addEventListener("click", loadSample);
  el.exportBtn.addEventListener("click", exportBackup);
  el.importInput.addEventListener("change", importBackup);
  el.resetBtn.addEventListener("click", resetAll);
  el.searchInput.addEventListener("input", renderHistory);
  el.filterType.addEventListener("change", renderHistory);
  document.querySelectorAll(".quick-btn").forEach(btn=>btn.addEventListener("click",()=>{
    addEntry({
      id: crypto.randomUUID(), date: todayKey(), type: btn.dataset.type, category: btn.dataset.category,
      title: btn.dataset.title, amount: Number(btn.dataset.amount), label: btn.dataset.label, note: "Quick action"
    });
  }));
}

function switchScreen(screenId, btn){
  el.navBtns.forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
  el.screens.forEach(s=>s.classList.remove("active"));
  $(screenId).classList.add("active");
}

function populateCategories(){
  const type = el.entryType.value;
  el.entryCategory.innerHTML = CATEGORY_MAP[type].map(c=>`<option value="${c}">${c}</option>`).join("");
}
function populateGoals(){ el.goalName.innerHTML = state.goals.map(g=>`<option value="${g.name}">${g.name}</option>`).join(""); }
function fillForms(){
  const s = state.settings, f = s.fixed;
  el.grossSalaryInput.value = s.grossSalary;
  el.inHandSalaryInput.value = s.inHandSalary;
  el.otherIncomeInput.value = s.otherFixedIncome;
  el.monthlySavingsTargetInput.value = s.monthlySavingsTarget;
  el.fixedRentInput.value=f.rent; el.fixedMomInput.value=f.mom; el.fixedTransportInput.value=f.transport; el.fixedElectricityInput.value=f.electricity;
  el.fixedWifiInput.value=f.wifi; el.fixedAppliancesInput.value=f.appliances; el.fixedGroceriesInput.value=f.groceries; el.fixedComfortInput.value=f.comfort;
}

function handleEntrySubmit(e){
  e.preventDefault();
  const entry = {
    id: crypto.randomUUID(), date: el.entryDate.value, type: el.entryType.value, category: el.entryCategory.value,
    amount: Number(el.entryAmount.value), title: el.entryTitle.value.trim(), label: el.entryLabel.value, note: el.entryNote.value.trim()
  };
  if(!entry.title || entry.amount < 0){ showToast("Please add a valid title and amount."); return; }
  addEntry(entry);
  el.entryForm.reset();
  el.entryDate.value = todayKey();
  el.entryType.value = "expense";
  populateCategories();
}

function addEntry(entry){
  state.entries.unshift(entry);
  if(entry.type === "saving"){
    const goal = state.goals.find(g=>g.name===entry.category);
    if(goal) goal.saved += entry.amount;
  }
  const xp = xpForEntry(entry);
  state.xp += xp;
  saveAll();
  render();
  animateXp(xp);
  if(entry.type === "saving") animateCoins();
  showToast(`Logged. +${xp} XP`);
}

function xpForEntry(entry){
  let xp = 20;
  if(entry.type === "saving") xp += 40;
  if(entry.type === "income") xp += 30;
  if(entry.label === "Smart") xp += 20;
  if(entry.label === "Necessary") xp += 10;
  if(entry.category === "Rent" || entry.category === "Mom") xp += 30;
  if(entry.label === "Impulse" || entry.label === "Regret") xp -= 5;
  return Math.max(5, xp);
}

function handleGoalSubmit(e){
  e.preventDefault();
  const amount = Number(el.goalAmount.value || 0);
  if(amount <= 0){ showToast("Add a valid saving amount."); return; }
  addEntry({ id: crypto.randomUUID(), date: todayKey(), type:"saving", category:el.goalName.value, title:`${el.goalName.value} saving`, amount, label:"Smart", note:"Added from Reward Chest" });
  el.goalAmount.value = "";
}

function handleIncomeSubmit(e){
  e.preventDefault();
  state.settings.grossSalary = Number(el.grossSalaryInput.value||0);
  state.settings.inHandSalary = Number(el.inHandSalaryInput.value||0);
  state.settings.otherFixedIncome = Number(el.otherIncomeInput.value||0);
  state.settings.monthlySavingsTarget = Number(el.monthlySavingsTargetInput.value||0);
  saveAll(); render(); showToast("Income setup saved.");
}

function handleFixedSubmit(e){
  e.preventDefault();
  state.settings.fixed = {
    rent:Number(el.fixedRentInput.value||0), mom:Number(el.fixedMomInput.value||0), transport:Number(el.fixedTransportInput.value||0),
    electricity:Number(el.fixedElectricityInput.value||0), wifi:Number(el.fixedWifiInput.value||0), appliances:Number(el.fixedAppliancesInput.value||0),
    groceries:Number(el.fixedGroceriesInput.value||0), comfort:Number(el.fixedComfortInput.value||0)
  };
  saveAll(); render(); showToast("Fixed costs saved.");
}

function currentMonthEntries(){ return state.entries.filter(e=>e.date.startsWith(monthKey())); }
function calcStreak(){
  const dates = [...new Set(state.entries.map(e=>e.date))].sort().reverse();
  let streak=0, d=new Date();
  while(true){
    const key=d.toISOString().slice(0,10);
    if(dates.includes(key)){ streak++; d.setDate(d.getDate()-1); } else break;
  }
  return streak;
}
function dailySafe(moneyLeft){
  const d=new Date(), last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();
  return Math.max(0, moneyLeft / Math.max(1,last-d.getDate()+1));
}

function metrics(){
  const monthEntries = currentMonthEntries();
  const expenseEntries = monthEntries.filter(e=>e.type==="expense"||e.type==="breakfast");
  const incomeEntries = monthEntries.filter(e=>e.type==="income");
  const savingEntries = monthEntries.filter(e=>e.type==="saving");
  const income = state.settings.inHandSalary + state.settings.otherFixedIncome + sum(incomeEntries.map(e=>e.amount));
  const spent = sum(expenseEntries.map(e=>e.amount));
  const saved = sum(savingEntries.map(e=>e.amount));
  const moneyLeft = income - spent - saved;
  const categoryTotals = {};
  expenseEntries.forEach(e=> categoryTotals[e.category]=(categoryTotals[e.category]||0)+e.amount);
  const foodApps = sum(monthEntries.filter(e=>/zomato|zepto|blinkit|food delivery/i.test(`${e.title} ${e.category}`)).map(e=>e.amount));
  const todayEntries = state.entries.filter(e=>e.date===todayKey());
  const todayFoodApps = sum(todayEntries.filter(e=>/zomato|zepto|blinkit|food delivery/i.test(`${e.title} ${e.category}`)).map(e=>e.amount));
  const streak = calcStreak();
  const todayLogged = todayEntries.length>0;
  const impulseCount = monthEntries.filter(e=>e.label==="Impulse"||e.label==="Regret").length;
  const target = state.settings.monthlySavingsTarget || 1;
  let score = 60;
  if(todayLogged) score += 10; else score -= 10;
  if(streak>=5) score+=10; else if(streak>=3) score+=6;
  if(saved>=target) score+=18; else if(saved>0) score+=8;
  if(moneyLeft<0) score-=30; else if(moneyLeft>income*.2) score+=8;
  if(foodApps>5000) score-=8; if(foodApps>8000) score-=8;
  if(impulseCount>2) score-=6; if(impulseCount>5) score-=10;
  score = Math.max(0, Math.min(100, Math.round(score)));
  const monsterData = buildMonsters(categoryTotals, foodApps);
  const activeMonster = monsterData.reduce((max,m)=>m.dangerScore>max.dangerScore?m:max,{name:"None",dangerScore:0});
  return { entries:state.entries, settings:state.settings, monthEntries, expenseEntries, incomeEntries, savingEntries, income, spent, saved, moneyLeft, categoryTotals, foodApps, todayEntries, todayFoodApps, streak, todayLogged, impulseCount, score, monsterData, activeMonster };
}

function buildMonsters(categoryTotals, foodApps){
  return MONSTERS.map(m=>{
    let spent = m.category==="Food Delivery" ? foodApps : m.category==="Bills" ? sum(["Rent","Electricity","WiFi","Appliances"].map(c=>categoryTotals[c]||0)) : (categoryTotals[m.category]||0);
    let pct = Math.round((spent / m.limit) * 100);
    let danger = pct>=100 ? "danger" : pct>=70 ? "warn" : "calm";
    return { ...m, spent, pct: Math.min(160,pct), danger, dangerScore: pct };
  });
}

function levelInfo(){
  const level = Math.min(10, Math.floor(state.xp / 1000) + 1);
  const start = (level-1)*1000;
  const current = state.xp - start;
  const needed = level === 10 ? 1000 : 1000;
  return { level, title: LEVELS[level-1], current: Math.min(current, needed), needed, pct: Math.min(100, current/needed*100) };
}

function render(){
  fillForms(); populateGoals();
  const m = metrics();
  const li = levelInfo();
  renderHome(m, li);
  renderEntries(m);
  renderMonsters(m);
  renderQuests(m);
  renderRewards(m, li);
  renderStats(m);
  renderHistory();
}

function renderHome(m, li){
  $("sideLevel").textContent = `Level ${li.level}`;
  $("sideTitle").textContent = li.title;
  $("sideXpFill").style.width = `${li.pct}%`;
  $("levelName").textContent = `Level ${li.level} · ${li.title}`;
  $("xpFill").style.width = `${li.pct}%`;
  $("xpText").textContent = `${li.current.toLocaleString("en-IN")} / ${li.needed.toLocaleString("en-IN")} XP`;
  $("moodScore").textContent = m.score;
  $("moneyLeftHero").textContent = money(m.moneyLeft);
  $("safeSpendHero").textContent = money(dailySafe(m.moneyLeft));
  $("savedHero").textContent = money(m.saved);
  $("streakHero").textContent = `${m.streak} days`;
  $("incomeCard").textContent = money(m.income);
  $("spentCard").textContent = money(m.spent);
  $("xpCard").textContent = state.xp.toLocaleString("en-IN");
  $("activeMonsterCard").textContent = m.activeMonster.name;

  const world = $("gameWorld");
  world.className = "game-world " + moodClass(m);
  $("mochi").className = "mochi " + petClass(m);
  $("heroTitle").textContent = heroTitle(m, li);
  $("heroSubtitle").textContent = heroSubtitle(m);
  renderAccessoryLayer(m, li);
  renderDocks(m);
  $("todayQuestPreview").innerHTML = dailyQuestCards(m).slice(0,3).map(questCard).join("");
}

function moodClass(m){ if(m.moneyLeft<0 || m.score<40) return "mood-stressed"; if(!m.todayLogged) return "mood-sleepy"; if(m.saved>=m.settings.monthlySavingsTarget) return "mood-excited"; if(m.score>=75) return "mood-happy"; return "mood-calm"; }
function petClass(m){ if(m.moneyLeft<0 || m.score<40) return "pet-stressed"; if(!m.todayLogged) return "pet-sleepy"; if(m.saved>=m.settings.monthlySavingsTarget) return "pet-excited"; if(m.score>=70) return "pet-happy"; return "pet-calm"; }
function heroTitle(m, li){ if(m.moneyLeft<0) return "Mochi is fighting a boss"; if(!m.todayLogged) return "Mochi is sleepy"; if(m.saved>=m.settings.monthlySavingsTarget) return "Mochi unlocked celebration mode"; return `Mochi is on ${li.title} mode`; }
function heroSubtitle(m){ if(m.moneyLeft<0) return "Bring money left back positive to weaken monsters."; if(!m.todayLogged) return "Log today to wake up Mochi and earn XP."; if(m.foodApps>5000) return "Snack Monster is growing. Keep food app spends controlled."; return "Complete quests, save money, and keep your pet happy."; }

function renderAccessoryLayer(m, li){
  const parts = [];
  if(m.saved>0) parts.push('<div class="shield"></div>');
  if(state.goals.find(g=>g.name==="Meta Glasses Fund")?.saved > 0) parts.push('<div class="glasses"></div>');
  if(li.level>=7 || m.saved>=m.settings.monthlySavingsTarget) parts.push('<div class="crown"></div>');
  $("accessoryLayer").innerHTML = parts.join("");
}

function renderDocks(m){
  const unlockedHelpers = CHARACTERS.filter(c=>c.id!=="mochi" && !["snack","shopping","cab","bill"].includes(c.id) && c.test(m)).slice(0,3);
  $("helperDock").innerHTML = unlockedHelpers.map(c=>`<div class="mini-char"><div class="char-icon">${c.icon}</div><strong>${c.name}</strong></div>`).join("");
  const active = m.monsterData.filter(x=>x.spent>0).sort((a,b)=>b.dangerScore-a.dangerScore).slice(0,2);
  $("monsterDock").innerHTML = active.map(c=>`<div class="mini-monster"><div class="char-icon">${c.icon}</div><strong>${c.name}</strong></div>`).join("");
}

function renderEntries(m){
  $("todayEntries").innerHTML = m.todayEntries.length ? m.todayEntries.map(entryCard).join("") : emptyCard("No log today", "Add your first money move to wake Mochi.");
  $("recentEntries").innerHTML = state.entries.length ? state.entries.slice(0,8).map(entryCard).join("") : emptyCard("No entries yet", "Your latest logs will appear here.");
}

function entryCard(e){
  return `<div class="entry-card">
    <div class="entry-line"><div><div class="entry-title">${escapeHtml(e.title)}</div><div class="entry-meta">${formatDate(e.date)} · ${escapeHtml(e.category)} · ${escapeHtml(e.label)}</div></div><strong class="entry-amount ${e.type}">${e.type==="expense"||e.type==="breakfast"?"-":"+"}${money(e.amount)}</strong></div>
    <div class="entry-line"><span class="entry-meta">${escapeHtml(e.note || e.type)}</span><button class="delete-btn" onclick="deleteEntry('${e.id}')">Delete</button></div>
  </div>`;
}
function emptyCard(title, text){ return `<div class="entry-card"><h4>${title}</h4><p>${text}</p></div>`; }

function renderMonsters(m){
  $("monsterGrid").innerHTML = m.monsterData.map(mon=>{
    const status = mon.danger==="danger" ? "Boss mode" : mon.danger==="warn" ? "Growing" : "Controlled";
    return `<div class="monster-card ${mon.danger}">
      <div class="monster-top"><div><h4>${mon.name}</h4><p>${status} · ${money(mon.spent)} / ${money(mon.limit)}</p></div><div class="monster-avatar">${mon.icon}</div></div>
      <div class="progress"><div style="width:${Math.min(100, mon.pct)}%"></div></div>
      <p>${mon.note}</p>
    </div>`;
  }).join("");
}

function dailyQuestCards(m){
  return [
    { title:"Log today", xp:20, done:m.todayLogged, text:"Add at least one entry today." },
    { title:"No food delivery", xp:25, done:m.todayLogged && m.todayFoodApps===0, text:"Keep Zomato/Zepto/Blinkit away today." },
    { title:"Add saving", xp:40, done:m.todayEntries.some(e=>e.type==="saving"), text:"Add one saving entry today." },
    { title:"No impulse spend", xp:30, done:m.todayLogged && !m.todayEntries.some(e=>e.label==="Impulse"||e.label==="Regret"), text:"No impulse or regret tag today." },
    { title:"Check balance", xp:10, done:true, text:`Money left is ${money(m.moneyLeft)}.` }
  ];
}
function weeklyQuestCards(m){
  const week = last7Entries();
  const weekFood = sum(week.filter(e=>/zomato|zepto|blinkit|food delivery/i.test(`${e.title} ${e.category}`)).map(e=>e.amount));
  const weekSaved = sum(week.filter(e=>e.type==="saving").map(e=>e.amount));
  const weekImpulse = week.filter(e=>e.label==="Impulse"||e.label==="Regret").length;
  return [
    { title:"5-day logging streak", xp:150, done:m.streak>=5, text:"Keep the streak active for 5 days." },
    { title:"Save ₹2,000 this week", xp:120, done:weekSaved>=2000, text:`Current weekly savings: ${money(weekSaved)}.` },
    { title:"Food apps under ₹1,000", xp:100, done:weekFood<=1000 && week.length>0, text:`Weekly food apps: ${money(weekFood)}.` },
    { title:"No impulse week", xp:120, done:weekImpulse===0 && week.length>0, text:`Impulse/regret count: ${weekImpulse}.` }
  ];
}
function last7Entries(){
  const set = new Set();
  for(let i=0;i<7;i++){ const d=new Date(); d.setDate(d.getDate()-i); set.add(d.toISOString().slice(0,10)); }
  return state.entries.filter(e=>set.has(e.date));
}
function questCard(q){
  return `<div class="quest-card">
    <div class="quest-top"><div><h4>${q.done?"✅":"⬜"} ${q.title}</h4><p>${q.text}</p></div><strong>+${q.xp} XP</strong></div>
  </div>`;
}
function renderQuests(m){
  $("dailyQuests").innerHTML = dailyQuestCards(m).map(questCard).join("");
  $("weeklyQuests").innerHTML = weeklyQuestCards(m).map(questCard).join("");
}

function renderRewards(m, li){
  $("characterGrid").innerHTML = CHARACTERS.map(c=>{
    const unlocked = c.test(m);
    return `<div class="character-card ${unlocked?"":"locked"}">
      <div class="character-avatar">${c.icon}</div>
      <h4>${c.name}</h4><p>${c.title}</p><p>${c.role}</p>
      <p><strong>${unlocked ? "Unlocked" : "Locked"}:</strong> ${c.unlock}</p>
    </div>`;
  }).join("");
  $("badgeGrid").innerHTML = BADGES.map(b=>{
    const unlocked = b.test(m);
    return `<div class="badge-card ${unlocked?"unlocked":"locked"}">
      <div class="badge-icon">${b.icon}</div><h4>${b.title}</h4><p>${b.text}</p><p>${unlocked?"Unlocked":"Locked"}</p>
    </div>`;
  }).join("");
  $("goalGrid").innerHTML = state.goals.map(g=>{
    const pct = Math.min(100, Math.round(g.saved/g.target*100));
    return `<div class="goal-card">
      <div class="goal-top"><div><h4>${g.name}</h4><p>Unlock: ${g.accessory}</p></div><strong>${pct}%</strong></div>
      <p>${money(g.saved)} / ${money(g.target)}</p>
      <div class="progress"><div style="width:${pct}%"></div></div>
    </div>`;
  }).join("");
}

function renderStats(m){
  const li=levelInfo();
  const dash = [
    ["Level", `Level ${li.level}`, li.title],
    ["Total XP", state.xp.toLocaleString("en-IN"), "from logs and savings"],
    ["In-hand income", money(m.income), "this month"],
    ["Spent", money(m.spent), "expense + breakfast"],
    ["Saved", money(m.saved), "saving entries"],
    ["Daily safe spend", money(dailySafe(m.moneyLeft)), "remaining month"],
    ["Food app spend", money(m.foodApps), "Zomato / Zepto / Blinkit"],
    ["Pet mood", `${m.score}/100`, "score calculation"]
  ];
  $("statsDashboard").innerHTML = dash.map(([a,b,c])=>`<div class="dash-card"><span>${a}</span><strong>${b}</strong><p>${c}</p></div>`).join("");
  const totals = Object.entries(m.categoryTotals).sort((a,b)=>b[1]-a[1]);
  const max = Math.max(...totals.map(x=>x[1]), 1);
  $("categoryBars").innerHTML = totals.length ? totals.map(([cat,val])=>`
    <div class="bar-card"><div class="bar-top"><h4>${cat}</h4><strong>${money(val)}</strong></div><div class="progress"><div style="width:${Math.round(val/max*100)}%"></div></div></div>
  `).join("") : emptyCard("No category data", "Add expenses to see category bars.");
}

function renderHistory(){
  const q = el.searchInput.value.trim().toLowerCase();
  const type = el.filterType.value;
  const rows = state.entries.filter(e=>{
    const mq = !q || e.title.toLowerCase().includes(q) || e.category.toLowerCase().includes(q) || (e.note||"").toLowerCase().includes(q);
    const mt = type==="all" || e.type===type;
    return mq && mt;
  });
  $("historyBody").innerHTML = rows.length ? rows.map(e=>`<tr>
    <td>${formatDate(e.date)}</td><td>${escapeHtml(e.title)}<div class="entry-meta">${escapeHtml(e.note||"")}</div></td>
    <td>${escapeHtml(e.category)}</td><td>${e.type}</td><td>${escapeHtml(e.label)}</td>
    <td class="entry-amount ${e.type}">${e.type==="expense"||e.type==="breakfast"?"-":"+"}${money(e.amount)}</td>
    <td><button class="delete-btn" onclick="deleteEntry('${e.id}')">Delete</button></td>
  </tr>`).join("") : `<tr><td colspan="7">No entries found.</td></tr>`;
}

function deleteEntry(id){
  const e = state.entries.find(x=>x.id===id);
  if(e && e.type==="saving"){
    const goal = state.goals.find(g=>g.name===e.category);
    if(goal) goal.saved = Math.max(0, goal.saved - e.amount);
  }
  state.entries = state.entries.filter(x=>x.id!==id);
  saveAll(); render(); showToast("Entry deleted.");
}
window.deleteEntry = deleteEntry;

function animateXp(xp){
  const p=$("xpPopup");
  p.textContent = `+${xp} XP`;
  p.classList.remove("show");
  void p.offsetWidth;
  p.classList.add("show");
}
function animateCoins(){
  const holder=$("coinBurst");
  for(let i=0;i<18;i++){
    const coin=document.createElement("div");
    coin.className="coin"; coin.textContent="₹";
    coin.style.left = `${35 + Math.random()*30}%`;
    coin.style.top = `${120 + Math.random()*40}px`;
    coin.style.animationDelay = `${Math.random()*.22}s`;
    holder.appendChild(coin);
    setTimeout(()=>coin.remove(),1400);
  }
}

function loadSample(){
  state.settings = clone(DEFAULT_SETTINGS);
  state.goals = clone(DEFAULT_GOALS);
  state.xp = 1850;
  const entries = [
    sample(-7,"income","Salary",60000,"Salary credited","Smart"),
    sample(-7,"expense","Rent",23000,"Rent payment","Necessary"),
    sample(-6,"expense","Mom",10000,"Mom contribution","Smart"),
    sample(-6,"expense","Groceries",540,"Zepto groceries","Necessary"),
    sample(-5,"expense","Food Delivery",360,"Zomato dinner","Worth it"),
    sample(-5,"breakfast","Office Breakfast",90,"Office coffee","Worth it"),
    sample(-4,"expense","Transport",250,"Cab and metro","Necessary"),
    sample(-4,"saving","Emergency Fund",2500,"Emergency saving","Smart"),
    sample(-3,"saving","Travel Fund",1500,"Travel fund saving","Smart"),
    sample(-2,"expense","Shopping",699,"Little treat","Impulse"),
    sample(-1,"expense","Electricity",3200,"Electricity bill","Necessary"),
    sample(0,"breakfast","Office Breakfast",0,"Office free breakfast","Smart")
  ];
  entries.filter(e=>e.type==="saving").forEach(e=>{ const g=state.goals.find(x=>x.name===e.category); if(g) g.saved += e.amount; });
  state.entries = entries;
  saveAll(); render(); animateCoins(); animateXp(150); showToast("Sample game loaded.");
}
function sample(offset,type,category,amount,title,label){
  const d=new Date(); d.setDate(d.getDate()+offset);
  return { id:crypto.randomUUID(), date:d.toISOString().slice(0,10), type, category, amount, title, label, note:"" };
}

function exportBackup(){
  const payload = { entries:state.entries, settings:state.settings, goals:state.goals, xp:state.xp };
  const blob = new Blob([JSON.stringify(payload,null,2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a=document.createElement("a"); a.href=url; a.download="money-quest-pet-backup.json"; a.click(); URL.revokeObjectURL(url);
}
function importBackup(event){
  const file=event.target.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const p=JSON.parse(reader.result);
      state.entries=Array.isArray(p.entries)?p.entries:[];
      state.settings=p.settings||clone(DEFAULT_SETTINGS);
      state.goals=p.goals||clone(DEFAULT_GOALS);
      state.xp=Number(p.xp||0);
      saveAll(); populateGoals(); fillForms(); render(); showToast("Backup imported.");
    }catch{ showToast("Could not import this file."); }
  };
  reader.readAsText(file); event.target.value="";
}
function resetAll(){
  if(!confirm("Reset all Money Quest Pet data?")) return;
  state.entries=[]; state.settings=clone(DEFAULT_SETTINGS); state.goals=clone(DEFAULT_GOALS); state.xp=0;
  saveAll(); populateGoals(); fillForms(); render(); showToast("Game reset.");
}
function showToast(msg){
  el.toast.textContent=msg; el.toast.classList.add("show");
  clearTimeout(showToast.timer); showToast.timer=setTimeout(()=>el.toast.classList.remove("show"),2300);
}

init();