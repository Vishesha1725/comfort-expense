const LEVELS = [
  { name: "Money Baby", min: 0 },
  { name: "Coin Collector", min: 100 },
  { name: "Budget Rookie", min: 250 },
  { name: "Expense Slayer", min: 450 },
  { name: "Savings Spark", min: 700 },
  { name: "Cash Captain", min: 1000 },
  { name: "Budget Boss", min: 1400 },
  { name: "Smart Money Mage", min: 1900 },
  { name: "Wealth Warrior", min: 2500 },
  { name: "Finance Queen", min: 3300 }
];

const DEFAULT_SETTINGS = {
  grossSalary: 60000,
  deductionPercent: 10,
  foodBudget: 8000,
  shoppingBudget: 5000,
  transportBudget: 5000,
  groceriesBudget: 7000
};

const FIXED_DEFAULTS = {
  rent: 23000,
  mom: 10000,
  electricity: 5000,
  transport: 5000,
  appliances: 2000,
  wifi: 500
};

const CATEGORIES = {
  expense: ["Food", "Groceries", "Transport", "Rent", "Bills", "WiFi", "Shopping", "Health", "Mom", "Subscriptions", "Travel", "Other"],
  income: ["Salary", "Refund", "Transfer In", "Gift", "Other Income"],
  saving: ["Emergency Fund", "Travel Fund", "Meta Glasses Fund", "Gifts Fund", "Investment"]
};

const STORAGE = {
  entries: "moneyQuest_entries_v1",
  settings: "moneyQuest_settings_v1",
  xp: "moneyQuest_xp_v1"
};

const state = {
  entries: load(STORAGE.entries, []),
  settings: load(STORAGE.settings, DEFAULT_SETTINGS),
  xp: load(STORAGE.xp, 0)
};

const $ = (id) => document.getElementById(id);
const el = {
  navBtns: document.querySelectorAll(".nav-btn"),
  screens: document.querySelectorAll(".screen"),
  entryForm: $("entryForm"),
  entryDate: $("entryDate"),
  entryType: $("entryType"),
  entryCategory: $("entryCategory"),
  entryAmount: $("entryAmount"),
  entryTitle: $("entryTitle"),
  entryMood: $("entryMood"),
  entryNote: $("entryNote"),
  recentList: $("recentList"),
  sampleBtn: $("sampleBtn"),
  exportBtn: $("exportBtn"),
  importInput: $("importInput"),
  resetBtn: $("resetBtn"),
  settingsForm: $("settingsForm"),
  toast: $("toast")
};

init();

function init() {
  el.entryDate.value = todayKey();
  populateCategories();
  fillSettingsForm();
  bindEvents();
  applyTilt();
  render();
}

function bindEvents() {
  el.navBtns.forEach(btn => btn.addEventListener("click", () => {
    el.navBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    el.screens.forEach(s => s.classList.remove("active-screen"));
    $(btn.dataset.screen).classList.add("active-screen");
  }));

  el.entryType.addEventListener("change", populateCategories);
  el.entryForm.addEventListener("submit", handleEntrySubmit);
  el.sampleBtn.addEventListener("click", loadSampleData);
  el.exportBtn.addEventListener("click", exportSaveFile);
  el.importInput.addEventListener("change", importSaveFile);
  el.resetBtn.addEventListener("click", resetAll);
  el.settingsForm.addEventListener("submit", handleSettingsSubmit);

  document.querySelectorAll(".quick-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const entry = {
        id: crypto.randomUUID(),
        date: todayKey(),
        type: "expense",
        category: btn.dataset.category,
        amount: Number(btn.dataset.amount),
        title: btn.dataset.title,
        mood: "Necessary",
        note: "Quick add"
      };
      addEntry(entry);
    });
  });
}

function populateCategories() {
  const list = CATEGORIES[el.entryType.value] || CATEGORIES.expense;
  el.entryCategory.innerHTML = list.map(c => `<option value="${c}">${c}</option>`).join("");
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

  if (!entry.title || entry.amount <= 0) {
    toast("Add a valid title and amount.");
    return;
  }

  addEntry(entry);
  el.entryForm.reset();
  el.entryDate.value = todayKey();
  el.entryType.value = "expense";
  populateCategories();
}

function addEntry(entry) {
  const oldLevel = getLevel(state.xp).name;
  state.entries.unshift(entry);
  state.xp += xpForEntry(entry);
  saveAll();
  render();

  const newLevel = getLevel(state.xp).name;
  if (newLevel !== oldLevel) {
    confetti();
    toast(`Level up: ${newLevel}`);
  } else if (entry.type === "saving") {
    confetti();
    toast(`Saving added. XP gained: ${xpForEntry(entry)}`);
  } else {
    toast(`Entry added. XP gained: ${xpForEntry(entry)}`);
  }
}

function xpForEntry(entry) {
  if (entry.type === "saving") return 45;
  if (entry.type === "income") return 25;
  if (entry.mood === "Smart") return 28;
  if (entry.mood === "Impulse" || entry.mood === "Regret") return 10;
  return 18;
}

function render() {
  const month = currentMonthEntries();
  const netSalary = getNetSalary();
  const spent = sum(month.filter(e => e.type === "expense").map(e => e.amount));
  const income = sum(month.filter(e => e.type === "income").map(e => e.amount));
  const savings = sum(month.filter(e => e.type === "saving").map(e => e.amount));
  const left = netSalary + income - spent - savings;
  const survivalScore = calculateSurvivalScore(month, left, netSalary);

  $("netSalaryCard").textContent = money(netSalary);
  $("spentCard").textContent = money(spent);
  $("leftCard").textContent = money(left);
  $("streakCard").textContent = `${calculateStreak()} days`;
  $("survivalScore").textContent = survivalScore;

  const level = getLevel(state.xp);
  const next = getNextLevel(state.xp);
  $("currentLevelName").textContent = level.name;
  $("levelName").textContent = `Level ${level.index + 1} · ${level.name}`;
  $("heroTitle").textContent = level.index >= 8 ? "Finance Queen mode is loading" : "Complete quests and beat spend monsters";
  $("heroSubtitle").textContent = left >= 0 ? `You still have ${money(left)} left from your in-hand salary.` : `You are ${money(Math.abs(left))} over your salary zone.`;
  if (next) {
    $("xpText").textContent = `${state.xp} / ${next.min} XP`;
    $("xpFill").style.width = `${Math.min(100, ((state.xp - level.min) / (next.min - level.min)) * 100)}%`;
  } else {
    $("xpText").textContent = `${state.xp} XP · Max level`;
    $("xpFill").style.width = "100%";
  }

  renderDailyBars(month);
  renderBudgetBars(month);
  renderInsights(month, spent, left, savings, survivalScore);
  renderRecentList();
  renderQuests(month);
  renderMonsters(month);
  renderBadges(month);
}

function renderDailyBars(month) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const amount = sum(month.filter(e => e.date === key && e.type === "expense").map(e => e.amount));
    days.push({ key, label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), amount });
  }
  const max = Math.max(...days.map(d => d.amount), 1);
  $("dailyBars").innerHTML = days.map(d => `
    <div class="day-bar">
      <div class="day-bar-fill" style="height:${Math.max(8, (d.amount / max) * 165)}px"></div>
      <strong>${d.amount ? shortMoney(d.amount) : "₹0"}</strong>
      <span>${d.label}</span>
    </div>
  `).join("");
}

function renderBudgetBars(month) {
  const spentByCategory = categoryTotals(month.filter(e => e.type === "expense"));
  const rows = [
    ["Food", state.settings.foodBudget, spentByCategory.Food || 0],
    ["Groceries", state.settings.groceriesBudget, spentByCategory.Groceries || 0],
    ["Transport", state.settings.transportBudget, spentByCategory.Transport || 0],
    ["Shopping", state.settings.shoppingBudget, spentByCategory.Shopping || 0],
    ["Salary Used", getNetSalary(), sum(month.filter(e => e.type === "expense").map(e => e.amount))]
  ];

  $("budgetBars").innerHTML = rows.map(([label, budget, used]) => {
    const pct = budget ? Math.min(130, used / budget * 100) : 0;
    const color = pct > 100 ? "var(--red)" : pct > 75 ? "var(--yellow)" : "var(--green)";
    return `
      <div class="power-row">
        <div class="power-label">
          <span>${label}</span>
          <small>${money(used)} / ${money(budget)}</small>
        </div>
        <div class="meter-track"><div class="meter-fill" style="width:${Math.min(100,pct)}%; background:${color}"></div></div>
      </div>
    `;
  }).join("");
}

function renderInsights(month, spent, left, savings, survivalScore) {
  const food = sum(month.filter(e => e.type === "expense" && e.category === "Food").map(e => e.amount));
  const deliveryCount = month.filter(e => /zomato|swiggy|food|cafe|coffee/i.test(e.title)).length;
  const impulse = month.filter(e => e.mood === "Impulse" || e.mood === "Regret").length;
  const fixedLoad = FIXED_DEFAULTS.rent + FIXED_DEFAULTS.mom + FIXED_DEFAULTS.electricity + FIXED_DEFAULTS.transport + FIXED_DEFAULTS.appliances + FIXED_DEFAULTS.wifi;

  const insights = [
    {
      tone: survivalScore >= 75 ? "good" : survivalScore >= 50 ? "warn" : "bad",
      title: "Survival score",
      text: `Your survival score is ${survivalScore}/100. ${survivalScore >= 75 ? "You are playing safely." : survivalScore >= 50 ? "You are not failing, but some categories need control." : "Overspending monsters are getting strong."}`
    },
    {
      tone: fixedLoad <= getNetSalary() * .75 ? "warn" : "bad",
      title: "Fixed-cost reality check",
      text: `Your default fixed costs are ${money(fixedLoad)} against ${money(getNetSalary())} in-hand salary. This is tight, so flexible spends need careful tracking.`
    },
    {
      tone: food <= state.settings.foodBudget ? "good" : "warn",
      title: "Food monster",
      text: `Food spending is ${money(food)}. You have ${deliveryCount} food/cafe-style entries this month.`
    },
    {
      tone: impulse <= 2 ? "good" : "warn",
      title: "Impulse meter",
      text: `${impulse} entries were marked Impulse or Regret. Tagging them honestly helps the app coach you better.`
    },
    {
      tone: savings > 0 ? "good" : "warn",
      title: "Saving XP",
      text: savings > 0 ? `You saved ${money(savings)} this month. Saving entries give the highest XP.` : "Add savings as a separate entry to unlock more XP and badges."
    }
  ];

  $("insights").innerHTML = insights.map(renderInsight).join("");
}

function renderInsight(item) {
  return `<div class="insight-card ${item.tone}"><h4>${item.title}</h4><p>${item.text}</p></div>`;
}

function renderRecentList() {
  const recent = state.entries.slice(0, 8);
  if (!recent.length) {
    $("recentList").innerHTML = `<div class="insight-card"><h4>No moves yet</h4><p>Add your first expense, income, or saving entry.</p></div>`;
    return;
  }

  $("recentList").innerHTML = recent.map(e => `
    <div class="entry-item">
      <div class="entry-line">
        <div>
          <div class="entry-title">${escapeHtml(e.title)}</div>
          <div class="entry-meta">${formatDate(e.date)} · ${e.category} · ${e.mood}</div>
        </div>
        <strong class="entry-amount ${e.type}">${e.type === "expense" ? "-" : "+"}${money(e.amount)}</strong>
      </div>
      <div class="entry-line">
        <span class="entry-meta">${e.type} · +${xpForEntry(e)} XP</span>
        <button class="delete-btn" onclick="deleteEntry('${e.id}')">Delete</button>
      </div>
    </div>
  `).join("");
}

function renderQuests(month) {
  const today = todayKey();
  const todayEntries = state.entries.filter(e => e.date === today);
  const todayExpense = sum(todayEntries.filter(e => e.type === "expense").map(e => e.amount));
  const noZomatoToday = !todayEntries.some(e => /zomato|swiggy/i.test(e.title));
  const savedThisMonth = month.some(e => e.type === "saving");
  const loggedToday = todayEntries.length > 0;
  const foodUnderBudget = sum(month.filter(e => e.category === "Food" && e.type === "expense").map(e => e.amount)) <= state.settings.foodBudget;
  const rentPaid = month.some(e => e.category === "Rent" && e.type === "expense");
  const streak = calculateStreak();

  const quests = [
    { icon: "⚔", name: "No Zomato Day", done: noZomatoToday && loggedToday, text: "Log today without a Zomato/Swiggy spend." },
    { icon: "🛡", name: "Under Food Budget", done: foodUnderBudget, text: "Keep food under your monthly budget." },
    { icon: "🏰", name: "Rent Paid Warrior", done: rentPaid, text: "Mark your rent payment this month." },
    { icon: "🔥", name: "3-Day Streak", done: streak >= 3, text: "Log money for 3 days in a row." },
    { icon: "💎", name: "Savings Spark", done: savedThisMonth, text: "Add at least one saving entry." },
    { icon: "🐉", name: "Low-Spend Day", done: loggedToday && todayExpense <= 500, text: "Keep today's expenses at ₹500 or lower." }
  ];

  $("questsGrid").innerHTML = quests.map(q => `
    <div class="quest-card ${q.done ? "unlocked" : ""}">
      <div class="quest-icon">${q.icon}</div>
      <h4>${q.name}</h4>
      <p>${q.text}</p>
      <span class="quest-status">${q.done ? "Completed" : "Pending"}</span>
    </div>
  `).join("");
}

function renderMonsters(month) {
  const totals = categoryTotals(month.filter(e => e.type === "expense"));
  const monsters = [
    { cat: "Food", budget: state.settings.foodBudget, face: "🍔" },
    { cat: "Shopping", budget: state.settings.shoppingBudget, face: "🛍" },
    { cat: "Transport", budget: state.settings.transportBudget, face: "🚕" },
    { cat: "Groceries", budget: state.settings.groceriesBudget, face: "🛒" },
    { cat: "Subscriptions", budget: 1000, face: "📺" },
    { cat: "Other", budget: 3000, face: "👾" }
  ];

  $("monsterGrid").innerHTML = monsters.map(m => {
    const used = totals[m.cat] || 0;
    const pct = m.budget ? used / m.budget * 100 : 0;
    const level = pct > 100 ? "danger" : pct > 70 ? "medium" : "safe";
    const status = pct > 100 ? "Boss mode" : pct > 70 ? "Growing" : "Controlled";
    return `
      <div class="monster-card ${level}">
        <div class="monster-face">${m.face}</div>
        <h4>${m.cat} Monster</h4>
        <p>${money(used)} used out of ${money(m.budget)}. Status: ${status}.</p>
        <div class="meter-track" style="margin-top:14px"><div class="meter-fill" style="width:${Math.min(100,pct)}%"></div></div>
      </div>
    `;
  }).join("");
}

function renderBadges(month) {
  const badges = getBadges(month);
  $("badgeGrid").innerHTML = badges.map(b => `
    <div class="badge-card ${b.done ? "unlocked" : "locked"}">
      <div class="badge-icon">${b.icon}</div>
      <h4>${b.name}</h4>
      <p>${b.text}</p>
      <span class="badge-status">${b.done ? "Unlocked" : "Locked"}</span>
    </div>
  `).join("");
}

function getBadges(month) {
  const titles = month.map(e => e.title.toLowerCase()).join(" ");
  const totalExpense = sum(month.filter(e => e.type === "expense").map(e => e.amount));
  const netSalary = getNetSalary();
  const food = sum(month.filter(e => e.category === "Food" && e.type === "expense").map(e => e.amount));
  const hasRent = month.some(e => e.category === "Rent");
  const hasMom = month.some(e => e.category === "Mom");
  const hasSaving = month.some(e => e.type === "saving");
  const streak = calculateStreak();

  return [
    { icon: "👶", name: "First Move", done: state.entries.length >= 1, text: "Add your first money move." },
    { icon: "🔥", name: "Savings Streak", done: streak >= 5, text: "Log money 5 days in a row." },
    { icon: "🏠", name: "Rent Paid Warrior", done: hasRent, text: "Record your rent payment." },
    { icon: "💗", name: "Mom Contribution", done: hasMom, text: "Track your mom contribution." },
    { icon: "🍔", name: "No Zomato Watch", done: !/zomato|swiggy/.test(titles) && month.length > 0, text: "No Zomato/Swiggy entries this month." },
    { icon: "🛡", name: "Under Budget Week", done: totalExpense <= netSalary * 0.7 && month.length >= 5, text: "Keep monthly spending below 70% of in-hand salary." },
    { icon: "💎", name: "Saving Spark", done: hasSaving, text: "Add one saving entry." },
    { icon: "👑", name: "Finance Queen Path", done: state.xp >= 1000, text: "Reach 1000 XP." },
    { icon: "🍱", name: "Food Control", done: food <= state.settings.foodBudget && month.length > 0, text: "Keep food spending inside budget." }
  ];
}

function handleSettingsSubmit(e) {
  e.preventDefault();
  state.settings = {
    grossSalary: Number($("grossSalary").value || 0),
    deductionPercent: Number($("deductionPercent").value || 0),
    foodBudget: Number($("foodBudget").value || 0),
    shoppingBudget: Number($("shoppingBudget").value || 0),
    transportBudget: Number($("transportBudget").value || 0),
    groceriesBudget: Number($("groceriesBudget").value || 0)
  };
  save(STORAGE.settings, state.settings);
  render();
  toast("Settings saved.");
}

function fillSettingsForm() {
  $("grossSalary").value = state.settings.grossSalary;
  $("deductionPercent").value = state.settings.deductionPercent;
  $("foodBudget").value = state.settings.foodBudget;
  $("shoppingBudget").value = state.settings.shoppingBudget;
  $("transportBudget").value = state.settings.transportBudget;
  $("groceriesBudget").value = state.settings.groceriesBudget;
}

function deleteEntry(id) {
  state.entries = state.entries.filter(e => e.id !== id);
  saveAll();
  render();
  toast("Move deleted.");
}
window.deleteEntry = deleteEntry;

function loadSampleData() {
  const sample = [
    entry(-6, "income", "Salary", 54000, "Salary credited", "Smart"),
    entry(-6, "expense", "Rent", 23000, "Rent", "Necessary"),
    entry(-5, "expense", "Mom", 10000, "Transfer to Mom", "Smart"),
    entry(-5, "expense", "Groceries", 640, "Zepto", "Necessary"),
    entry(-4, "expense", "Food", 380, "Zomato dinner", "Worth it"),
    entry(-4, "expense", "Transport", 240, "Cab and metro", "Necessary"),
    entry(-3, "expense", "Bills", 2800, "Electricity bill", "Necessary"),
    entry(-3, "expense", "WiFi", 500, "Airtel WiFi", "Necessary"),
    entry(-2, "expense", "Food", 160, "Office snack", "Impulse"),
    entry(-2, "expense", "Shopping", 899, "Nykaa", "Worth it"),
    entry(-1, "saving", "Travel Fund", 1500, "Travel fund", "Smart"),
    entry(0, "expense", "Food", 180, "Coffee", "Worth it"),
    entry(0, "expense", "Groceries", 420, "Blinkit", "Necessary")
  ];
  state.entries = sample;
  state.xp = sample.reduce((acc, e) => acc + xpForEntry(e), 0);
  saveAll();
  render();
  confetti();
  toast("Sample game data loaded.");
}

function entry(offset, type, category, amount, title, mood) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return {
    id: crypto.randomUUID(),
    date: d.toISOString().slice(0, 10),
    type,
    category,
    amount,
    title,
    mood,
    note: ""
  };
}

function exportSaveFile() {
  const blob = new Blob([JSON.stringify({ entries: state.entries, settings: state.settings, xp: state.xp }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "money-quest-save-file.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importSaveFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      state.entries = Array.isArray(parsed.entries) ? parsed.entries : [];
      state.settings = parsed.settings || DEFAULT_SETTINGS;
      state.xp = Number(parsed.xp || 0);
      saveAll();
      fillSettingsForm();
      render();
      toast("Save file imported.");
    } catch {
      toast("Could not import this save file.");
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

function resetAll() {
  if (!confirm("Reset all game data?")) return;
  state.entries = [];
  state.settings = DEFAULT_SETTINGS;
  state.xp = 0;
  saveAll();
  fillSettingsForm();
  render();
  toast("Game reset.");
}

function calculateSurvivalScore(month, left, netSalary) {
  const totalExpense = sum(month.filter(e => e.type === "expense").map(e => e.amount));
  const impulse = month.filter(e => e.mood === "Impulse" || e.mood === "Regret").length;
  const saving = sum(month.filter(e => e.type === "saving").map(e => e.amount));
  let score = 100;
  if (left < 0) score -= 35;
  if (totalExpense > netSalary * .85) score -= 20;
  if (totalExpense > netSalary) score -= 20;
  if (impulse > 3) score -= 12;
  if (saving > 0) score += 8;
  if (calculateStreak() >= 5) score += 5;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function calculateStreak() {
  const dates = new Set(state.entries.map(e => e.date));
  let streak = 0;
  const d = new Date();
  while (dates.has(d.toISOString().slice(0, 10))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function getLevel(xp) {
  let level = LEVELS[0];
  let index = 0;
  LEVELS.forEach((l, i) => {
    if (xp >= l.min) {
      level = l;
      index = i;
    }
  });
  return { ...level, index };
}

function getNextLevel(xp) {
  return LEVELS.find(l => l.min > xp);
}

function currentMonthEntries() {
  const ym = new Date().toISOString().slice(0, 7);
  return state.entries.filter(e => e.date.startsWith(ym));
}

function categoryTotals(entries) {
  return entries.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});
}

function getNetSalary() {
  return state.settings.grossSalary * (1 - state.settings.deductionPercent / 100);
}

function saveAll() {
  save(STORAGE.entries, state.entries);
  save(STORAGE.settings, state.settings);
  save(STORAGE.xp, state.xp);
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function load(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function sum(nums) {
  return nums.reduce((a, b) => a + b, 0);
}

function money(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);
}

function shortMoney(value) {
  if (value >= 100000) return `₹${Math.round(value / 100000)}L`;
  if (value >= 1000) return `₹${Math.round(value / 1000)}k`;
  return `₹${Math.round(value)}`;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function escapeHtml(str = "") {
  return str.replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[ch]));
}

function toast(message) {
  el.toast.textContent = message;
  el.toast.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.toast.classList.remove("show"), 2400);
}

function confetti() {
  const layer = $("confettiLayer");
  const colors = ["#ff4fd8", "#7c4dff", "#00e5ff", "#ffd166", "#4df7a8", "#ff914d"];
  for (let i = 0; i < 70; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = `${Math.random() * .35}s`;
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    layer.appendChild(piece);
    setTimeout(() => piece.remove(), 1800);
  }
}

function applyTilt() {
  document.querySelectorAll(".panel-3d").forEach(card => {
    card.addEventListener("mousemove", (e) => {
      if (window.innerWidth < 900) return;
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - .5;
      const y = (e.clientY - rect.top) / rect.height - .5;
      card.style.transform = `perspective(1000px) rotateX(${y * -4}deg) rotateY(${x * 4}deg) translateY(-2px)`;
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });
}
