const STORAGE = {
  entries: "mumbaiGirl_entries_v1",
  settings: "mumbaiGirl_settings_v1",
  goals: "mumbaiGirl_goals_v1"
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
  { name: "Travel Fund", target: 30000, saved: 0 },
  { name: "Gifts for Parents", target: 12000, saved: 0 },
  { name: "Meta Glasses Fund", target: 70000, saved: 0 },
  { name: "Emergency Fund", target: 60000, saved: 0 },
  { name: "First Salary Treats", target: 6000, saved: 0 }
];

const CATEGORIES = {
  expense: [
    "Food Delivery", "Office Food", "Groceries", "Transport", "Rent", "Electricity",
    "WiFi", "Appliances", "Mom", "Shopping", "Health", "Beauty", "Travel", "Other"
  ],
  income: ["Salary", "Refund", "Transfer In", "Other Income"],
  saving: ["Travel Fund", "Gifts for Parents", "Meta Glasses Fund", "Emergency Fund", "First Salary Treats"]
};

const state = {
  entries: load(STORAGE.entries, []),
  settings: load(STORAGE.settings, DEFAULT_SETTINGS),
  goals: load(STORAGE.goals, DEFAULT_GOALS)
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
  entryFeeling: $("entryFeeling"),
  entryNote: $("entryNote"),
  recentEntries: $("recentEntries"),
  breakfastForm: $("breakfastForm"),
  breakfastDate: $("breakfastDate"),
  breakfastStatus: $("breakfastStatus"),
  breakfastAmount: $("breakfastAmount"),
  breakfastTitle: $("breakfastTitle"),
  settingsForm: $("settingsForm"),
  fixedForm: $("fixedForm"),
  goalForm: $("goalForm"),
  goalName: $("goalName"),
  goalAmount: $("goalAmount"),
  sampleBtn: $("sampleBtn"),
  exportBtn: $("exportBtn"),
  importInput: $("importInput"),
  clearBtn: $("clearBtn"),
  searchInput: $("searchInput"),
  filterType: $("filterType"),
  toast: $("toast")
};

init();

function init() {
  el.entryDate.value = today();
  el.breakfastDate.value = today();
  populateCategories();
  populateGoals();
  fillSettings();
  bindEvents();
  render();
}

function bindEvents() {
  el.navBtns.forEach(btn => {
    btn.addEventListener("click", () => switchScreen(btn.dataset.screen, btn));
  });

  el.entryType.addEventListener("change", populateCategories);
  el.entryForm.addEventListener("submit", handleEntrySubmit);
  el.breakfastForm.addEventListener("submit", handleBreakfastSubmit);
  el.settingsForm.addEventListener("submit", handleIncomeSettingsSubmit);
  el.fixedForm.addEventListener("submit", handleFixedSettingsSubmit);
  el.goalForm.addEventListener("submit", handleGoalSubmit);
  el.sampleBtn.addEventListener("click", loadSample);
  el.exportBtn.addEventListener("click", exportBackup);
  el.importInput.addEventListener("change", importBackup);
  el.clearBtn.addEventListener("click", clearData);
  el.searchInput.addEventListener("input", renderHistory);
  el.filterType.addEventListener("change", renderHistory);

  document.querySelectorAll(".quick-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      addEntry({
        id: crypto.randomUUID(),
        date: today(),
        type: btn.dataset.type,
        category: btn.dataset.category,
        title: btn.dataset.title,
        amount: Number(btn.dataset.amount),
        feeling: "Necessary",
        note: "Quick city entry"
      });
    });
  });
}

function switchScreen(screenId, activeBtn) {
  el.navBtns.forEach(btn => btn.classList.remove("active"));
  activeBtn.classList.add("active");
  el.screens.forEach(screen => screen.classList.remove("active-screen"));
  $(screenId).classList.add("active-screen");
}

function populateCategories() {
  const type = el.entryType.value;
  el.entryCategory.innerHTML = CATEGORIES[type].map(c => `<option value="${c}">${c}</option>`).join("");
}

function populateGoals() {
  el.goalName.innerHTML = state.goals.map(g => `<option value="${g.name}">${g.name}</option>`).join("");
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

  if (!entry.title || entry.amount <= 0) {
    showToast("Add a valid title and amount.");
    return;
  }

  addEntry(entry);
  el.entryForm.reset();
  el.entryDate.value = today();
  el.entryType.value = "expense";
  populateCategories();
}

function addEntry(entry) {
  state.entries.unshift(entry);

  if (entry.type === "saving") {
    const goal = state.goals.find(g => g.name === entry.category);
    if (goal) goal.saved += entry.amount;
  }

  saveAll();
  render();
  showToast("Entry added.");
}

function handleBreakfastSubmit(event) {
  event.preventDefault();

  const amount = Number(el.breakfastAmount.value || 0);
  const status = el.breakfastStatus.value;
  const title = el.breakfastTitle.value.trim() || status;

  const entry = {
    id: crypto.randomUUID(),
    date: el.breakfastDate.value,
    type: amount > 0 ? "breakfast" : "breakfast",
    category: "Office Breakfast",
    amount,
    title,
    feeling: status,
    note: "Office breakfast tracker"
  };

  state.entries.unshift(entry);
  saveAll();
  render();
  el.breakfastForm.reset();
  el.breakfastDate.value = today();
  showToast("Breakfast log saved.");
}

function handleIncomeSettingsSubmit(event) {
  event.preventDefault();

  state.settings.grossSalary = Number($("grossSalary").value || 0);
  state.settings.inHandSalary = Number($("inHandSalary").value || 0);
  state.settings.otherFixedIncome = Number($("otherFixedIncome").value || 0);
  state.settings.monthlySavingsTarget = Number($("monthlySavingsTarget").value || 0);

  saveAll();
  render();
  showToast("Income setup saved.");
}

function handleFixedSettingsSubmit(event) {
  event.preventDefault();

  state.settings.fixed = {
    rent: Number($("fixedRent").value || 0),
    mom: Number($("fixedMom").value || 0),
    transport: Number($("fixedTransport").value || 0),
    electricity: Number($("fixedElectricity").value || 0),
    wifi: Number($("fixedWifi").value || 0),
    appliances: Number($("fixedAppliances").value || 0),
    groceries: Number($("fixedGroceries").value || 0),
    comfort: Number($("fixedComfort").value || 0)
  };

  saveAll();
  render();
  showToast("Fixed costs saved.");
}

function handleGoalSubmit(event) {
  event.preventDefault();

  const name = el.goalName.value;
  const amount = Number(el.goalAmount.value || 0);
  if (amount <= 0) {
    showToast("Add a valid saving amount.");
    return;
  }

  const goal = state.goals.find(g => g.name === name);
  if (goal) goal.saved += amount;

  state.entries.unshift({
    id: crypto.randomUUID(),
    date: today(),
    type: "saving",
    category: name,
    amount,
    title: `${name} saving`,
    feeling: "Comfort",
    note: "Added from goals section"
  });

  saveAll();
  render();
  el.goalAmount.value = "";
  showToast("Goal saving added.");
}

function render() {
  const month = currentMonthEntries();
  const expenseEntries = month.filter(e => e.type === "expense" || e.type === "breakfast");
  const incomeEntries = month.filter(e => e.type === "income");
  const savingEntries = month.filter(e => e.type === "saving");

  const income = state.settings.inHandSalary + state.settings.otherFixedIncome + sum(incomeEntries.map(e => e.amount));
  const spent = sum(expenseEntries.map(e => e.amount));
  const saved = sum(savingEntries.map(e => e.amount));
  const left = income - spent - saved;
  const score = calculateThaneScore(spent, saved, left);

  $("grossSalaryCard").textContent = money(state.settings.grossSalary);
  $("inHandCard").textContent = money(state.settings.inHandSalary + state.settings.otherFixedIncome);
  $("spentCard").textContent = money(spent);
  $("savedCard").textContent = money(saved);
  $("thaneScore").textContent = score;
  $("moneyLeftHero").textContent = money(left);
  $("dailySafeSpend").textContent = money(calculateDailySafeSpend(left));

  $("heroHeading").textContent = score >= 75 ? "You are surviving Thane quite well" : score >= 50 ? "Your month is manageable but tight" : "This month needs control";
  $("heroSub").textContent = `You have ${money(left)} left after spends and goal savings. Fixed costs are editable in settings.`;

  renderRouteInsight(month);
  renderFixedDashboard(month);
  renderCategoryMap(month);
  renderInsights(month, income, spent, saved, left, score);
  renderRecentEntries();
  renderBreakfastStats();
  renderWatchlist();
  renderGoals();
  renderHistory();
  fillSettings();
}

function renderRouteInsight(month) {
  const transportSpent = sum(month.filter(e => e.category === "Transport").map(e => e.amount));
  const budget = state.settings.fixed.transport || 1;
  const pct = Math.round((transportSpent / budget) * 100);
  $("routeInsight").textContent = `Transport used: ${money(transportSpent)} of ${money(budget)} planned. That is ${pct}% of your transport budget.`;
}

function renderFixedDashboard(month) {
  const fixed = state.settings.fixed;
  const actual = {
    Rent: sum(month.filter(e => e.category === "Rent").map(e => e.amount)),
    Transport: sum(month.filter(e => e.category === "Transport").map(e => e.amount)),
    Electricity: sum(month.filter(e => e.category === "Electricity").map(e => e.amount)),
    Mom: sum(month.filter(e => e.category === "Mom").map(e => e.amount)),
    WiFi: sum(month.filter(e => e.category === "WiFi").map(e => e.amount)),
    Appliances: sum(month.filter(e => e.category === "Appliances").map(e => e.amount))
  };

  const rows = [
    ["Rent", fixed.rent, actual.Rent],
    ["Transport", fixed.transport, actual.Transport],
    ["Electricity", fixed.electricity, actual.Electricity],
    ["Mom", fixed.mom, actual.Mom],
    ["WiFi", fixed.wifi, actual.WiFi],
    ["Appliances", fixed.appliances, actual.Appliances]
  ];

  $("fixedDashboard").innerHTML = rows.map(([name, planned, used]) => {
    const value = Math.min(100, planned ? (used / planned) * 100 : 0);
    return `
      <div class="fixed-item">
        <div class="fixed-item-head">
          <span>${name}</span>
          <strong>${money(used)} / ${money(planned)}</strong>
        </div>
        <div class="meter"><div class="meter-fill" style="width:${value}%"></div></div>
      </div>
    `;
  }).join("");
}

function renderCategoryMap(month) {
  const expenses = month.filter(e => e.type === "expense" || e.type === "breakfast");
  const totals = categoryTotals(expenses);
  const max = Math.max(...Object.values(totals), 1);
  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 8);

  if (!sorted.length) {
    $("categoryMap").innerHTML = `<div class="category-item"><p>No expenses yet. Add a daily log entry.</p></div>`;
    return;
  }

  $("categoryMap").innerHTML = sorted.map(([cat, amount]) => `
    <div class="category-item">
      <div class="category-head">
        <span>${cat}</span>
        <strong>${money(amount)}</strong>
      </div>
      <div class="meter"><div class="meter-fill" style="width:${Math.max(5, amount / max * 100)}%"></div></div>
    </div>
  `).join("");
}

function renderInsights(month, income, spent, saved, left, score) {
  const foodApps = getAppWatchTotals(month);
  const fixedTotal = Object.values(state.settings.fixed).reduce((a, b) => a + Number(b || 0), 0) - Number(state.settings.fixed.comfort || 0);
  const breakfastSpent = sum(month.filter(e => e.category === "Office Breakfast").map(e => e.amount));
  const momPaid = sum(month.filter(e => e.category === "Mom").map(e => e.amount));
  const savingsRate = income ? Math.round((saved / income) * 100) : 0;
  const appTotal = foodApps.Zomato.total + foodApps.Zepto.total + foodApps.Blinkit.total;

  const insights = [
    {
      tone: score >= 75 ? "good" : score >= 50 ? "warn" : "bad",
      title: "Surviving Thane score",
      text: `Your score is ${score}/100. It is based on spending pressure, savings, fixed costs and food-app usage.`
    },
    {
      tone: fixedTotal <= income * 0.75 ? "warn" : "bad",
      title: "Fixed cost pressure",
      text: `Your editable fixed-cost plan is ${money(fixedTotal)} against ${money(income)} monthly income. This leaves limited room for comfort spending.`
    },
    {
      tone: appTotal <= 5000 ? "good" : appTotal <= 9000 ? "warn" : "bad",
      title: "Food app watch",
      text: `Zomato, Zepto and Blinkit together are at ${money(appTotal)} this month.`
    },
    {
      tone: breakfastSpent <= 1500 ? "good" : "warn",
      title: "Office breakfast leakage",
      text: `Office breakfast/snack spending is ${money(breakfastSpent)}. Free office breakfast days reduce daily leaks.`
    },
    {
      tone: momPaid >= state.settings.fixed.mom ? "good" : "warn",
      title: "Mom contribution tracker",
      text: momPaid >= state.settings.fixed.mom ? `Mom contribution target is tracked at ${money(momPaid)}.` : `Mom contribution tracked so far is ${money(momPaid)} of ${money(state.settings.fixed.mom)}.`
    },
    {
      tone: savingsRate >= 15 ? "good" : savingsRate >= 8 ? "warn" : "bad",
      title: "Goal savings rate",
      text: `You have saved ${money(saved)} this month, which is about ${savingsRate}% of income.`
    }
  ];

  $("insightList").innerHTML = insights.map(item => `
    <div class="insight ${item.tone}">
      <h4>${item.title}</h4>
      <p>${item.text}</p>
    </div>
  `).join("");
}

function renderRecentEntries() {
  const recent = state.entries.slice(0, 8);

  if (!recent.length) {
    $("recentEntries").innerHTML = `<div class="entry"><h4>No entries yet</h4><p class="entry-meta">Add your first daily log entry.</p></div>`;
    return;
  }

  $("recentEntries").innerHTML = recent.map(entryTemplate).join("");
}

function renderBreakfastStats() {
  const month = currentMonthEntries().filter(e => e.category === "Office Breakfast");
  const freeDays = month.filter(e => e.feeling === "Office free breakfast").length;
  const boughtDays = month.filter(e => e.feeling === "Bought breakfast").length;
  const skippedDays = month.filter(e => e.feeling === "Skipped breakfast").length;
  const coffeeDays = month.filter(e => e.feeling === "Coffee only").length;
  const spent = sum(month.map(e => e.amount));

  $("breakfastStats").innerHTML = [
    ["Free office breakfast days", freeDays],
    ["Bought breakfast days", boughtDays],
    ["Skipped breakfast days", skippedDays],
    ["Coffee-only days", coffeeDays],
    ["Breakfast/snack spend", money(spent)]
  ].map(([label, value]) => `
    <div class="breakfast-card">
      <div class="breakfast-row">
        <span>${label}</span>
        <strong>${value}</strong>
      </div>
    </div>
  `).join("");
}

function renderWatchlist() {
  const totals = getAppWatchTotals(currentMonthEntries());
  const cards = [
    ["Zomato", totals.Zomato.total, totals.Zomato.count, 4000],
    ["Zepto", totals.Zepto.total, totals.Zepto.count, 4500],
    ["Blinkit", totals.Blinkit.total, totals.Blinkit.count, 4500]
  ];

  $("watchlistCards").innerHTML = cards.map(([name, total, count, softLimit]) => {
    const pct = Math.min(100, total / softLimit * 100);
    return `
      <div class="watch-card">
        <div class="watch-head">
          <h4>${name}</h4>
          <strong>${money(total)}</strong>
        </div>
        <p>${count} entries this month. Soft limit: ${money(softLimit)}.</p>
        <div class="meter"><div class="meter-fill" style="width:${pct}%"></div></div>
      </div>
    `;
  }).join("");
}

function renderGoals() {
  $("goalCards").innerHTML = state.goals.map(goal => {
    const pct = Math.min(100, goal.saved / goal.target * 100);
    return `
      <div class="goal-card">
        <div class="goal-head">
          <h4>${goal.name}</h4>
          <strong>${money(goal.saved)}</strong>
        </div>
        <p>Target: ${money(goal.target)}. Remaining: ${money(Math.max(0, goal.target - goal.saved))}.</p>
        <div class="meter"><div class="meter-fill" style="width:${pct}%"></div></div>
      </div>
    `;
  }).join("");
}

function renderHistory() {
  const search = el.searchInput.value.toLowerCase().trim();
  const type = el.filterType.value;

  const rows = state.entries.filter(e => {
    const matchesSearch = !search || e.title.toLowerCase().includes(search) || e.category.toLowerCase().includes(search) || (e.note || "").toLowerCase().includes(search);
    const matchesType = type === "all" || e.type === type;
    return matchesSearch && matchesType;
  });

  if (!rows.length) {
    $("historyBody").innerHTML = `<tr><td colspan="7">No entries found.</td></tr>`;
    return;
  }

  $("historyBody").innerHTML = rows.map(e => `
    <tr>
      <td>${formatDate(e.date)}</td>
      <td>${escapeHtml(e.title)}<div class="entry-meta">${escapeHtml(e.note || "")}</div></td>
      <td>${e.category}</td>
      <td>${e.type}</td>
      <td>${e.feeling}</td>
      <td class="entry-amount ${e.type}">${e.type === "expense" || e.type === "breakfast" ? "-" : "+"}${money(e.amount)}</td>
      <td><button class="delete-btn" onclick="deleteEntry('${e.id}')">Delete</button></td>
    </tr>
  `).join("");
}

function entryTemplate(e) {
  return `
    <div class="entry">
      <div class="entry-line">
        <div>
          <div class="entry-title">${escapeHtml(e.title)}</div>
          <div class="entry-meta">${formatDate(e.date)} · ${e.category} · ${e.feeling}</div>
        </div>
        <strong class="entry-amount ${e.type}">${e.type === "expense" || e.type === "breakfast" ? "-" : "+"}${money(e.amount)}</strong>
      </div>
      <div class="entry-line">
        <span class="entry-meta">${e.type}</span>
        <button class="delete-btn" onclick="deleteEntry('${e.id}')">Delete</button>
      </div>
    </div>
  `;
}

function deleteEntry(id) {
  const existing = state.entries.find(e => e.id === id);
  if (existing && existing.type === "saving") {
    const goal = state.goals.find(g => g.name === existing.category);
    if (goal) goal.saved = Math.max(0, goal.saved - existing.amount);
  }

  state.entries = state.entries.filter(e => e.id !== id);
  saveAll();
  render();
  showToast("Entry deleted.");
}
window.deleteEntry = deleteEntry;

function fillSettings() {
  $("grossSalary").value = state.settings.grossSalary;
  $("inHandSalary").value = state.settings.inHandSalary;
  $("otherFixedIncome").value = state.settings.otherFixedIncome;
  $("monthlySavingsTarget").value = state.settings.monthlySavingsTarget;
  $("fixedRent").value = state.settings.fixed.rent;
  $("fixedMom").value = state.settings.fixed.mom;
  $("fixedTransport").value = state.settings.fixed.transport;
  $("fixedElectricity").value = state.settings.fixed.electricity;
  $("fixedWifi").value = state.settings.fixed.wifi;
  $("fixedAppliances").value = state.settings.fixed.appliances;
  $("fixedGroceries").value = state.settings.fixed.groceries;
  $("fixedComfort").value = state.settings.fixed.comfort;
}

function calculateThaneScore(spent, saved, left) {
  const income = state.settings.inHandSalary + state.settings.otherFixedIncome;
  const foodApps = getAppWatchTotals(currentMonthEntries());
  const appTotal = foodApps.Zomato.total + foodApps.Zepto.total + foodApps.Blinkit.total;
  const fixedTotal = Object.values(state.settings.fixed).reduce((a, b) => a + Number(b || 0), 0) - Number(state.settings.fixed.comfort || 0);

  let score = 100;
  if (left < 0) score -= 35;
  if (spent > income * 0.9) score -= 20;
  if (fixedTotal > income * 0.75) score -= 15;
  if (appTotal > 7000) score -= 12;
  if (saved >= state.settings.monthlySavingsTarget) score += 12;
  if (saved === 0) score -= 8;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function calculateDailySafeSpend(left) {
  const todayDate = new Date();
  const last = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0).getDate();
  const remainingDays = Math.max(1, last - todayDate.getDate() + 1);
  return Math.max(0, left / remainingDays);
}

function getAppWatchTotals(entries) {
  const result = {
    Zomato: { total: 0, count: 0 },
    Zepto: { total: 0, count: 0 },
    Blinkit: { total: 0, count: 0 }
  };

  entries.forEach(e => {
    const text = `${e.title} ${e.category}`.toLowerCase();
    if (text.includes("zomato")) {
      result.Zomato.total += e.amount;
      result.Zomato.count += 1;
    }
    if (text.includes("zepto")) {
      result.Zepto.total += e.amount;
      result.Zepto.count += 1;
    }
    if (text.includes("blinkit")) {
      result.Blinkit.total += e.amount;
      result.Blinkit.count += 1;
    }
  });

  return result;
}

function categoryTotals(entries) {
  return entries.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});
}

function loadSample() {
  state.entries = [
    sample(-8, "income", "Salary", 60000, "Salary credited", "Comfort"),
    sample(-8, "expense", "Rent", 23000, "Rent payment", "Necessary"),
    sample(-7, "expense", "Mom", 10000, "Mom contribution", "Comfort"),
    sample(-7, "expense", "Groceries", 780, "Zepto", "Necessary"),
    sample(-6, "breakfast", "Office Breakfast", 0, "Office free breakfast", "Office free breakfast"),
    sample(-6, "expense", "Food Delivery", 420, "Zomato dinner", "Worth it"),
    sample(-5, "expense", "Transport", 240, "Cab and metro", "Necessary"),
    sample(-5, "expense", "Groceries", 520, "Blinkit", "Necessary"),
    sample(-4, "expense", "Electricity", 3100, "Electricity bill", "Necessary"),
    sample(-4, "breakfast", "Office Breakfast", 90, "Coffee only", "Coffee only"),
    sample(-3, "expense", "WiFi", 500, "Airtel WiFi", "Necessary"),
    sample(-3, "expense", "Shopping", 899, "Nykaa", "Worth it"),
    sample(-2, "expense", "Food Delivery", 360, "Zomato", "Impulse"),
    sample(-1, "saving", "Travel Fund", 1500, "Travel fund saving", "Comfort"),
    sample(-1, "saving", "Gifts for Parents", 1000, "Parents gift saving", "Comfort"),
    sample(0, "expense", "Office Food", 120, "Office snack", "Worth it")
  ];

  state.goals = JSON.parse(JSON.stringify(DEFAULT_GOALS));
  state.entries.filter(e => e.type === "saving").forEach(e => {
    const goal = state.goals.find(g => g.name === e.category);
    if (goal) goal.saved += e.amount;
  });

  saveAll();
  render();
  showToast("Sample Mumbai budget data loaded.");
}

function sample(offset, type, category, amount, title, feeling) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return {
    id: crypto.randomUUID(),
    date: d.toISOString().slice(0, 10),
    type,
    category,
    amount,
    title,
    feeling,
    note: ""
  };
}

function exportBackup() {
  const blob = new Blob([JSON.stringify({ entries: state.entries, settings: state.settings, goals: state.goals }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "mumbai-girl-budget-backup.json";
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
      state.settings = parsed.settings || DEFAULT_SETTINGS;
      state.goals = parsed.goals || DEFAULT_GOALS;
      saveAll();
      populateGoals();
      render();
      showToast("Backup imported.");
    } catch {
      showToast("Could not import backup.");
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

function clearData() {
  if (!confirm("Clear all tracker data?")) return;
  state.entries = [];
  state.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  state.goals = JSON.parse(JSON.stringify(DEFAULT_GOALS));
  saveAll();
  populateGoals();
  render();
  showToast("Data cleared.");
}

function currentMonthEntries() {
  const ym = new Date().toISOString().slice(0, 7);
  return state.entries.filter(e => e.date.startsWith(ym));
}

function saveAll() {
  save(STORAGE.entries, state.entries);
  save(STORAGE.settings, state.settings);
  save(STORAGE.goals, state.goals);
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function load(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? JSON.parse(JSON.stringify(fallback));
  } catch {
    return JSON.parse(JSON.stringify(fallback));
  }
}

function sum(values) {
  return values.reduce((a, b) => a + Number(b || 0), 0);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function money(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value || 0);
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function escapeHtml(str = "") {
  return str.replace(/[&<>"']/g, ch => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[ch]));
}

function showToast(message) {
  el.toast.textContent = message;
  el.toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => el.toast.classList.remove("show"), 2300);
}
