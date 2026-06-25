const STORAGE_KEYS = {
  entries: "moneyMoodIsland_entries_v1",
  settings: "moneyMoodIsland_settings_v1",
  goals: "moneyMoodIsland_goals_v1"
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
  { name: "Emergency Fund", target: 60000, saved: 0, islandPart: "Lighthouse shield" },
  { name: "Travel Fund", target: 30000, saved: 0, islandPart: "Boat dock" },
  { name: "Gifts for Parents", target: 12000, saved: 0, islandPart: "Heart lantern" },
  { name: "Meta Glasses Fund", target: 70000, saved: 0, islandPart: "Signal tower upgrade" },
  { name: "First Salary Treats", target: 6000, saved: 0, islandPart: "Beach decor" }
];

const CATEGORY_MAP = {
  expense: ["Food Delivery", "Office Food", "Groceries", "Transport", "Rent", "Electricity", "WiFi", "Appliances", "Mom", "Shopping", "Health", "Beauty", "Travel", "Other"],
  income: ["Salary", "Refund", "Transfer In", "Other Income"],
  saving: DEFAULT_GOALS.map(goal => goal.name),
  breakfast: ["Office Breakfast"]
};

const state = {
  entries: load(STORAGE_KEYS.entries, []),
  settings: load(STORAGE_KEYS.settings, DEFAULT_SETTINGS),
  goals: load(STORAGE_KEYS.goals, DEFAULT_GOALS)
};

const el = {};

function $(id) {
  return document.getElementById(id);
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

function saveAll() {
  localStorage.setItem(STORAGE_KEYS.entries, JSON.stringify(state.entries));
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(state.settings));
  localStorage.setItem(STORAGE_KEYS.goals, JSON.stringify(state.goals));
}

function initElements() {
  [
    "sampleBtn", "exportBtn", "importInput", "clearBtn",
    "entryForm", "entryDate", "entryType", "entryCategory", "entryAmount", "entryTitle", "entryLabel", "entryNote",
    "goalForm", "goalName", "goalAmount",
    "incomeForm", "fixedForm", "grossSalaryInput", "inHandSalaryInput", "otherIncomeInput", "monthlySavingsTargetInput",
    "fixedRentInput", "fixedMomInput", "fixedTransportInput", "fixedElectricityInput", "fixedWifiInput", "fixedAppliancesInput", "fixedGroceriesInput", "fixedComfortInput",
    "searchInput", "filterType", "toast"
  ].forEach(id => { el[id] = $(id); });

  el.navBtns = document.querySelectorAll(".nav-btn");
  el.screens = document.querySelectorAll(".screen");
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
  el.navBtns.forEach(btn => btn.addEventListener("click", () => switchScreen(btn.dataset.screen, btn)));
  el.entryType.addEventListener("change", populateCategoryOptions);
  el.entryForm.addEventListener("submit", handleEntrySubmit);
  el.goalForm.addEventListener("submit", handleGoalSubmit);
  el.incomeForm.addEventListener("submit", handleIncomeSubmit);
  el.fixedForm.addEventListener("submit", handleFixedSubmit);
  el.sampleBtn.addEventListener("click", loadSampleData);
  el.exportBtn.addEventListener("click", exportBackup);
  el.importInput.addEventListener("change", importBackup);
  el.clearBtn.addEventListener("click", clearData);
  el.searchInput.addEventListener("input", renderHistory);
  el.filterType.addEventListener("change", renderHistory);

  document.querySelectorAll(".quick-btn").forEach(btn => {
    btn.addEventListener("click", () => addEntry({
      id: crypto.randomUUID(),
      date: todayKey(),
      type: btn.dataset.type,
      category: btn.dataset.category,
      title: btn.dataset.title,
      amount: Number(btn.dataset.amount),
      label: btn.dataset.label,
      note: "Quick island action"
    }));
  });
}

function switchScreen(screenId, activeBtn) {
  el.navBtns.forEach(btn => btn.classList.remove("active"));
  activeBtn.classList.add("active");
  el.screens.forEach(screen => screen.classList.remove("active-screen"));
  $(screenId).classList.add("active-screen");
}

function populateCategoryOptions() {
  const type = el.entryType.value;
  el.entryCategory.innerHTML = CATEGORY_MAP[type].map(cat => `<option value="${cat}">${cat}</option>`).join("");
}

function populateGoalOptions() {
  el.goalName.innerHTML = state.goals.map(goal => `<option value="${goal.name}">${goal.name}</option>`).join("");
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

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function currentMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

function currentMonthEntries() {
  return state.entries.filter(entry => entry.date.startsWith(currentMonthKey()));
}

function last7Days() {
  const days = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function last7Entries() {
  const days = new Set(last7Days());
  return state.entries.filter(entry => days.has(entry.date));
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
    label: el.entryLabel.value,
    note: el.entryNote.value.trim()
  };

  if (!entry.title || entry.amount < 0) {
    showToast("Please add a valid title and amount.");
    return;
  }

  addEntry(entry);
  el.entryForm.reset();
  el.entryDate.value = todayKey();
  el.entryType.value = "expense";
  populateCategoryOptions();
}

function addEntry(entry) {
  state.entries.unshift(entry);

  if (entry.type === "saving") {
    const goal = state.goals.find(item => item.name === entry.category);
    if (goal) goal.saved += entry.amount;
    animateCoinRain();
  }

  saveAll();
  render();
  showToast("Island updated.");
}

function handleGoalSubmit(event) {
  event.preventDefault();
  const goalName = el.goalName.value;
  const amount = Number(el.goalAmount.value || 0);

  if (amount <= 0) {
    showToast("Add a valid saving amount.");
    return;
  }

  addEntry({
    id: crypto.randomUUID(),
    date: todayKey(),
    type: "saving",
    category: goalName,
    title: `${goalName} saving`,
    amount,
    label: "Smart",
    note: "Added from Savings Cove"
  });

  el.goalAmount.value = "";
}

function handleIncomeSubmit(event) {
  event.preventDefault();
  state.settings.grossSalary = Number(el.grossSalaryInput.value || 0);
  state.settings.inHandSalary = Number(el.inHandSalaryInput.value || 0);
  state.settings.otherFixedIncome = Number(el.otherIncomeInput.value || 0);
  state.settings.monthlySavingsTarget = Number(el.monthlySavingsTargetInput.value || 0);
  saveAll();
  render();
  showToast("Income setup saved.");
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
  showToast("Fixed costs saved.");
}

function render() {
  fillForms();
  populateGoalOptions();

  const month = currentMonthEntries();
  const incomeEntries = month.filter(entry => entry.type === "income");
  const expenseEntries = month.filter(entry => entry.type === "expense" || entry.type === "breakfast");
  const savingEntries = month.filter(entry => entry.type === "saving");

  const income = state.settings.inHandSalary + state.settings.otherFixedIncome + sum(incomeEntries.map(entry => entry.amount));
  const spent = sum(expenseEntries.map(entry => entry.amount));
  const saved = sum(savingEntries.map(entry => entry.amount));
  const moneyLeft = income - spent - saved;
  const foodApps = foodAppSpend(month);
  const streak = calculateStreak();
  const mood = computeMood(month, income, spent, saved, moneyLeft, foodApps, streak);

  renderWeather(mood);
  renderStage(month, saved, foodApps, moneyLeft);
  renderCards(month, income, spent, saved, moneyLeft, foodApps, streak, mood);
  renderObjectMap(month, saved, foodApps);
  renderEntryLists();
  renderGoals(saved);
  renderWeeklyMap();
  renderInsights(month, income, spent, saved, moneyLeft, foodApps, streak, mood);
  renderCategoryEcosystem(month);
  renderHistory();
}

function computeMood(month, income, spent, saved, moneyLeft, foodApps, streak) {
  const impulseCount = month.filter(entry => entry.label === "Impulse" || entry.label === "Regret").length;
  const todayLogged = month.some(entry => entry.date === todayKey());
  const fixedTotal = sum(Object.values(state.settings.fixed)) - state.settings.fixed.comfort;
  const savingsTarget = state.settings.monthlySavingsTarget || 1;
  const savingRatio = saved / savingsTarget;

  let score = 62;

  if (todayLogged) score += 8;
  else score -= 12;

  if (streak >= 5) score += 8;
  else if (streak >= 2) score += 4;

  if (moneyLeft < 0) score -= 32;
  else if (moneyLeft > income * 0.2) score += 12;

  if (savingRatio >= 1) score += 16;
  else if (savingRatio >= 0.4) score += 8;
  else if (saved === 0) score -= 8;

  if (foodApps > 8000) score -= 12;
  else if (foodApps > 5000) score -= 6;

  if (impulseCount > 4) score -= 14;
  else if (impulseCount > 2) score -= 7;

  if (fixedTotal > income * 0.78) score -= 8;

  score = clamp(score);

  let weather = "sunny";
  let label = "Sunny";
  let reason = "Your island is balanced.";

  if (!todayLogged && month.length > 0) {
    weather = "cloudy";
    label = "Cloudy";
    reason = "You have not logged today yet.";
  }

  if (savingRatio >= 1 && moneyLeft >= 0) {
    weather = "sparkly";
    label = "Sparkly";
    reason = "Savings target reached. The island is glowing.";
  }

  if (score < 55) {
    weather = "rainy";
    label = "Rainy";
    reason = "Budget pressure is rising.";
  }

  if (moneyLeft < 0 || impulseCount > 5) {
    weather = "storm";
    label = "Storm";
    reason = "Overspending or regret spends are causing storm clouds.";
  }

  if (!month.length) {
    weather = "sunny";
    label = "New Island";
    reason = "Start logging to shape the island.";
    score = 60;
  }

  return { score, weather, label, reason, impulseCount, todayLogged };
}

function renderWeather(mood) {
  const scene = $("skyScene");
  scene.className = `sky-scene weather-${mood.weather}`;
  $("weatherLabel").textContent = mood.label;
  $("weatherReason").textContent = mood.reason;
}

function renderStage(month, saved, foodApps, moneyLeft) {
  const stage = $("islandStage");
  stage.classList.toggle("storm", computeMood(month, getIncome(month), getSpent(month), saved, moneyLeft, foodApps, calculateStreak()).weather === "storm");

  const rentPaid = month.some(entry => entry.category === "Rent");
  $("house").classList.toggle("shaky", !rentPaid && moneyLeft < getIncome(month) * 0.15);

  const momPaid = sum(month.filter(entry => entry.category === "Mom").map(entry => entry.amount));
  $("lighthouse").classList.toggle("active", momPaid >= Math.min(state.settings.fixed.mom, 1) || momPaid > 0);

  const transportSpent = sum(month.filter(entry => entry.category === "Transport").map(entry => entry.amount));
  $("roadPath").classList.toggle("active", transportSpent > 0);

  const wifiElectricity = month.some(entry => ["WiFi", "Electricity"].includes(entry.category));
  $("signalTower").classList.toggle("active", wifiElectricity);

  $("treasureChest").classList.toggle("active", saved > 0);

  renderCafeCluster(foodApps);
  renderFlowers(saved);
}

function renderCafeCluster(foodApps) {
  const count = Math.min(5, Math.floor(foodApps / 1000));
  $("cafeCluster").innerHTML = Array.from({ length: count }).map(() => `<div class="cafe"></div>`).join("");
}

function renderFlowers(saved) {
  const count = Math.min(18, Math.floor(saved / 700));
  $("flowerField").innerHTML = Array.from({ length: count }).map(() => `<div class="flower"></div>`).join("");
}

function renderCards(month, income, spent, saved, moneyLeft, foodApps, streak, mood) {
  $("islandHeadline").textContent = islandHeadline(mood, moneyLeft, saved);
  $("islandSubline").textContent = islandSubline(mood, foodApps);
  $("moodScore").textContent = mood.score;
  $("moneyLeftHero").textContent = money(moneyLeft);
  $("dailySafeHero").textContent = money(calculateDailySafeSpend(moneyLeft));
  $("savedHero").textContent = money(saved);
  $("streakHero").textContent = `${streak} days`;
  $("incomeCard").textContent = money(income);
  $("spentCard").textContent = money(spent);
  $("savedCard").textContent = money(saved);
  $("foodAppCard").textContent = money(foodApps);
}

function islandHeadline(mood, moneyLeft, saved) {
  if (mood.weather === "sparkly") return "Your island is glowing";
  if (mood.weather === "storm") return "A storm is hitting the island";
  if (mood.weather === "rainy") return "The island needs some care";
  if (mood.weather === "cloudy") return "Clouds are passing over";
  if (saved > 0 && moneyLeft >= 0) return "Your island is growing";
  return "Your island is calm";
}

function islandSubline(mood, foodApps) {
  if (mood.weather === "storm") return "Reduce impulse spends and protect your money left.";
  if (mood.weather === "sparkly") return "Savings are building flowers, treasure and sunshine.";
  if (foodApps > 5000) return "Food app stalls are growing quickly on the island.";
  return "Keep logging daily to keep the island sunny and stable.";
}

function renderObjectMap(month, saved, foodApps) {
  const transport = sum(month.filter(entry => entry.category === "Transport").map(entry => entry.amount));
  const rent = sum(month.filter(entry => entry.category === "Rent").map(entry => entry.amount));
  const mom = sum(month.filter(entry => entry.category === "Mom").map(entry => entry.amount));
  const wifi = sum(month.filter(entry => entry.category === "WiFi" || entry.category === "Electricity").map(entry => entry.amount));

  const items = [
    ["🏠", "House stability", rent > 0 ? "Rent is tracked, so the house is stable." : "Track rent to stabilize the house."],
    ["⛵", "Boat route", transport > 0 ? `Transport created routes worth ${money(transport)}.` : "Transport entries will animate island routes."],
    ["🍧", "Cafe stalls", foodApps > 0 ? `Food apps created cafe stalls worth ${money(foodApps)}.` : "Food app spends create snack stalls."],
    ["💰", "Treasure chest", saved > 0 ? `${money(saved)} saved. The treasure chest is active.` : "Savings activate the treasure chest."],
    ["♥", "Heart lighthouse", mom > 0 ? "Mom contribution lights up the lighthouse." : "Mom contribution will light the lighthouse."],
    ["📡", "Signal tower", wifi > 0 ? "WiFi/electricity powered the signal tower." : "WiFi/electricity entries power the tower."]
  ];

  $("objectMap").innerHTML = items.map(([icon, title, text]) => `
    <div class="object-item">
      <div>
        <h4>${title}</h4>
        <p>${text}</p>
      </div>
      <div class="object-icon">${icon}</div>
    </div>
  `).join("");
}

function renderEntryLists() {
  const todayEntries = state.entries.filter(entry => entry.date === todayKey());
  $("todayEntries").innerHTML = todayEntries.length ? todayEntries.map(entryCard).join("") : emptyCard("No entries today", "Log something to bring sunshine to the island.");

  const recent = state.entries.slice(0, 8);
  $("recentEntries").innerHTML = recent.length ? recent.map(entryCard).join("") : emptyCard("No entries yet", "Start with one daily log.");
}

function entryCard(entry) {
  return `
    <div class="entry-card">
      <div class="entry-line">
        <div>
          <div class="entry-title">${escapeHtml(entry.title)}</div>
          <div class="entry-meta">${formatDate(entry.date)} · ${entry.category} · ${entry.label}</div>
        </div>
        <strong class="entry-amount ${entry.type}">${entry.type === "expense" || entry.type === "breakfast" ? "-" : "+"}${money(entry.amount)}</strong>
      </div>
      <div class="entry-line">
        <span class="entry-meta">${entry.type}</span>
        <button class="delete-btn" onclick="deleteEntry('${entry.id}')">Delete</button>
      </div>
    </div>
  `;
}

function renderGoals(saved) {
  const target = state.settings.monthlySavingsTarget || 1;
  const progress = Math.min(100, Math.round(saved / target * 100));
  $("totalSavedCove").textContent = money(saved);
  $("monthlyTargetCove").textContent = money(target);
  $("islandGrowthCove").textContent = `${progress}%`;
  $("savingsMeter").style.width = `${progress}%`;

  $("goalGrid").innerHTML = state.goals.map(goal => {
    const pct = Math.min(100, Math.round(goal.saved / goal.target * 100));
    return `
      <div class="goal-card">
        <h4>${goal.name}</h4>
        <p>${goal.islandPart}</p>
        <p><strong>${money(goal.saved)}</strong> saved of ${money(goal.target)}</p>
        <div class="goal-progress">
          <div class="goal-progress-bar" style="width:${pct}%"></div>
        </div>
      </div>
    `;
  }).join("");
}

function renderWeeklyMap() {
  const days = last7Days();
  const entries = state.entries;
  $("weeklyMap").innerHTML = days.map(day => {
    const dayEntries = entries.filter(entry => entry.date === day);
    const spend = sum(dayEntries.filter(entry => entry.type === "expense" || entry.type === "breakfast").map(entry => entry.amount));
    const saved = sum(dayEntries.filter(entry => entry.type === "saving").map(entry => entry.amount));
    const label = new Date(day).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    const weather = dayWeather(dayEntries, spend, saved);
    return `
      <div class="week-card">
        <div class="week-icon">${weather.icon}</div>
        <h4>${label}</h4>
        <p>${weather.label}</p>
        <p>${money(spend)} spent</p>
      </div>
    `;
  }).join("");

  const weekly = last7Entries();
  const weeklySpend = sum(weekly.filter(entry => entry.type === "expense" || entry.type === "breakfast").map(entry => entry.amount));
  const weeklySaved = sum(weekly.filter(entry => entry.type === "saving").map(entry => entry.amount));
  const topCategory = topExpenseCategory(weekly) || "-";
  const regretCount = weekly.filter(entry => entry.label === "Impulse" || entry.label === "Regret").length;

  $("weeklySummary").innerHTML = [
    ["Week spent", money(weeklySpend)],
    ["Week saved", money(weeklySaved)],
    ["Top category", topCategory],
    ["Regret/impulse", String(regretCount)]
  ].map(([title, text]) => `
    <div class="summary-card">
      <h4>${title}</h4>
      <p>${text}</p>
    </div>
  `).join("");
}

function dayWeather(dayEntries, spend, saved) {
  if (!dayEntries.length) return { icon: "🌙", label: "quiet" };
  if (saved > 0 && spend <= 500) return { icon: "🌈", label: "glowing" };
  if (saved > 0) return { icon: "☀️", label: "sunny" };
  if (spend > 1500) return { icon: "⛈️", label: "stormy" };
  if (spend > 800) return { icon: "🌧️", label: "rainy" };
  return { icon: "🌤️", label: "calm" };
}

function renderInsights(month, income, spent, saved, moneyLeft, foodApps, streak, mood) {
  const regretCount = month.filter(entry => entry.label === "Impulse" || entry.label === "Regret").length;
  const fixedTotal = sum(Object.values(state.settings.fixed)) - state.settings.fixed.comfort;
  const breakfast = sum(month.filter(entry => entry.type === "breakfast").map(entry => entry.amount));
  const savingRate = income ? Math.round(saved / income * 100) : 0;

  const insights = [
    {
      tone: mood.score >= 75 ? "good" : mood.score >= 55 ? "warn" : "bad",
      title: "Island mood",
      text: `Your island mood score is ${mood.score}/100. Weather: ${mood.label}.`
    },
    {
      tone: moneyLeft >= 0 ? "good" : "bad",
      title: "Money left",
      text: moneyLeft >= 0 ? `You still have ${money(moneyLeft)} left.` : `You are over by ${money(Math.abs(moneyLeft))}. Storm warning.`
    },
    {
      tone: saved >= state.settings.monthlySavingsTarget ? "good" : saved > 0 ? "warn" : "bad",
      title: "Savings growth",
      text: `You saved ${money(saved)} this month. Savings rate is ${savingRate}%.`
    },
    {
      tone: foodApps <= 5000 ? "good" : foodApps <= 8000 ? "warn" : "bad",
      title: "Food delivery island",
      text: `Zomato, Zepto and Blinkit total is ${money(foodApps)}. More spend adds more cafe clutter.`
    },
    {
      tone: regretCount <= 2 ? "good" : "warn",
      title: "Impulse storms",
      text: `${regretCount} entries are marked Impulse or Regret. Too many can create storms.`
    },
    {
      tone: fixedTotal <= income * 0.75 ? "warn" : "bad",
      title: "Fixed-cost pressure",
      text: `Fixed recurring base is ${money(fixedTotal)} against ${money(income)} income.`
    },
    {
      tone: breakfast <= 1500 ? "good" : "warn",
      title: "Breakfast/snack tide",
      text: `Breakfast and snack spends are ${money(breakfast)} this month.`
    },
    {
      tone: streak >= 5 ? "good" : streak >= 2 ? "warn" : "bad",
      title: "Daily logging weather",
      text: `Your current logging streak is ${streak} days. Daily logging keeps the island sunny.`
    }
  ];

  $("insightList").innerHTML = insights.map(item => `
    <div class="insight-card ${item.tone}">
      <h4>${item.title}</h4>
      <p>${item.text}</p>
    </div>
  `).join("");
}

function renderCategoryEcosystem(month) {
  const expenseEntries = month.filter(entry => entry.type === "expense" || entry.type === "breakfast");
  const totals = {};
  expenseEntries.forEach(entry => totals[entry.category] = (totals[entry.category] || 0) + entry.amount);
  const max = Math.max(...Object.values(totals), 1);

  const items = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 10);
  $("categoryEcosystem").innerHTML = items.length ? items.map(([category, value]) => {
    const pct = Math.round(value / max * 100);
    return `
      <div class="ecosystem-item">
        <div class="eco-head">
          <h4>${category}</h4>
          <strong>${money(value)}</strong>
        </div>
        <div class="meter-track">
          <div class="meter-fill" style="width:${pct}%"></div>
        </div>
      </div>
    `;
  }).join("") : emptyCard("No categories yet", "Add expenses to build category ecosystem.");
}

function renderHistory() {
  const query = el.searchInput.value.trim().toLowerCase();
  const type = el.filterType.value;
  const rows = state.entries.filter(entry => {
    const matchesQuery = !query || entry.title.toLowerCase().includes(query) || entry.category.toLowerCase().includes(query) || (entry.note || "").toLowerCase().includes(query);
    const matchesType = type === "all" || entry.type === type;
    return matchesQuery && matchesType;
  });

  $("historyBody").innerHTML = rows.length ? rows.map(entry => `
    <tr>
      <td>${formatDate(entry.date)}</td>
      <td>${escapeHtml(entry.title)}<div class="entry-meta">${escapeHtml(entry.note || "")}</div></td>
      <td>${entry.category}</td>
      <td>${entry.type}</td>
      <td>${entry.label}</td>
      <td class="entry-amount ${entry.type}">${entry.type === "expense" || entry.type === "breakfast" ? "-" : "+"}${money(entry.amount)}</td>
      <td><button class="delete-btn" onclick="deleteEntry('${entry.id}')">Delete</button></td>
    </tr>
  `).join("") : `<tr><td colspan="7">No entries found.</td></tr>`;
}

function deleteEntry(id) {
  const entry = state.entries.find(item => item.id === id);
  if (entry && entry.type === "saving") {
    const goal = state.goals.find(item => item.name === entry.category);
    if (goal) goal.saved = Math.max(0, goal.saved - entry.amount);
  }
  state.entries = state.entries.filter(item => item.id !== id);
  saveAll();
  render();
  showToast("Entry deleted.");
}
window.deleteEntry = deleteEntry;

function topExpenseCategory(entries) {
  const totals = {};
  entries.filter(entry => entry.type === "expense" || entry.type === "breakfast").forEach(entry => {
    totals[entry.category] = (totals[entry.category] || 0) + entry.amount;
  });
  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  return sorted.length ? sorted[0][0] : null;
}

function foodAppSpend(entries) {
  return sum(entries.filter(entry => /zomato|zepto|blinkit/i.test(`${entry.title} ${entry.category}`)).map(entry => entry.amount));
}

function getIncome(entries) {
  return state.settings.inHandSalary + state.settings.otherFixedIncome + sum(entries.filter(entry => entry.type === "income").map(entry => entry.amount));
}

function getSpent(entries) {
  return sum(entries.filter(entry => entry.type === "expense" || entry.type === "breakfast").map(entry => entry.amount));
}

function calculateStreak() {
  const uniqueDates = [...new Set(state.entries.map(entry => entry.date))].sort().reverse();
  if (!uniqueDates.length) return 0;
  let streak = 0;
  const cursor = new Date();
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

function calculateDailySafeSpend(moneyLeft) {
  const date = new Date();
  const lastDate = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const remaining = Math.max(1, lastDate - date.getDate() + 1);
  return Math.max(0, moneyLeft / remaining);
}

function clamp(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function sum(values) {
  return values.reduce((acc, value) => acc + Number(value || 0), 0);
}

function money(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function escapeHtml(text = "") {
  return text.replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[ch]));
}

function emptyCard(title, text) {
  return `<div class="entry-card"><h4>${title}</h4><p>${text}</p></div>`;
}

function animateCoinRain() {
  const holder = $("coinRain");
  for (let i = 0; i < 22; i += 1) {
    const coin = document.createElement("div");
    coin.className = "coin";
    coin.textContent = "₹";
    coin.style.left = `${30 + Math.random() * 40}%`;
    coin.style.top = `${10 + Math.random() * 35}px`;
    coin.style.animationDelay = `${Math.random() * 0.25}s`;
    holder.appendChild(coin);
    setTimeout(() => coin.remove(), 1500);
  }
}

function loadSampleData() {
  state.settings = clone(DEFAULT_SETTINGS);
  state.goals = clone(DEFAULT_GOALS);

  const entries = [
    sampleEntry(-7, "income", "Salary", 60000, "Salary credited", "Smart"),
    sampleEntry(-7, "expense", "Rent", 23000, "Rent payment", "Necessary"),
    sampleEntry(-6, "expense", "Mom", 10000, "Mom contribution", "Smart"),
    sampleEntry(-6, "expense", "Groceries", 540, "Zepto order", "Necessary"),
    sampleEntry(-5, "breakfast", "Office Breakfast", 90, "Office coffee", "Worth it"),
    sampleEntry(-5, "expense", "Food Delivery", 360, "Zomato dinner", "Worth it"),
    sampleEntry(-4, "expense", "Transport", 250, "Cab and metro", "Necessary"),
    sampleEntry(-4, "saving", "Emergency Fund", 2000, "Emergency saving", "Smart"),
    sampleEntry(-3, "expense", "Electricity", 3200, "Electricity bill", "Necessary"),
    sampleEntry(-3, "saving", "Travel Fund", 1500, "Travel fund saving", "Smart"),
    sampleEntry(-2, "expense", "Groceries", 420, "Blinkit order", "Necessary"),
    sampleEntry(-1, "breakfast", "Office Breakfast", 0, "Office free breakfast", "Smart"),
    sampleEntry(0, "expense", "Office Food", 120, "Office snack", "Impulse")
  ];

  entries.filter(entry => entry.type === "saving").forEach(entry => {
    const goal = state.goals.find(item => item.name === entry.category);
    if (goal) goal.saved += entry.amount;
  });

  state.entries = entries;
  saveAll();
  render();
  animateCoinRain();
  showToast("Sample island loaded.");
}

function sampleEntry(offset, type, category, amount, title, label) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return {
    id: crypto.randomUUID(),
    date: date.toISOString().slice(0, 10),
    type,
    category,
    amount,
    title,
    label,
    note: ""
  };
}

function exportBackup() {
  const payload = { entries: state.entries, settings: state.settings, goals: state.goals };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "money-mood-island-backup.json";
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
      showToast("Backup imported.");
    } catch {
      showToast("Could not import this backup.");
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

function clearData() {
  if (!confirm("Reset all Money Mood Island data?")) return;
  state.entries = [];
  state.settings = clone(DEFAULT_SETTINGS);
  state.goals = clone(DEFAULT_GOALS);
  saveAll();
  populateGoalOptions();
  fillForms();
  render();
  showToast("Island reset.");
}

function showToast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => $("toast").classList.remove("show"), 2300);
}

init();
