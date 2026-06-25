const STORAGE_KEY = "comfort-expense-tracker-v1";
const CATEGORIES = [
  "Income",
  "Rent",
  "Bills",
  "WiFi",
  "Transport",
  "Food",
  "Groceries",
  "Shopping",
  "Health",
  "Family",
  "Beauty",
  "Entertainment",
  "Subscriptions",
  "Travel",
  "Education",
  "Uncategorized"
];

const NEED_CATEGORIES = new Set(["Rent", "Bills", "WiFi", "Transport", "Groceries", "Health", "Family", "Education"]);
const COMFORT_CATEGORIES = new Set(["Food", "Shopping", "Beauty", "Entertainment", "Subscriptions", "Travel", "Uncategorized"]);

const DEFAULT_BUDGET = {
  income: 66667,
  rent: 23000,
  family: 10000,
  transport: 5000,
  electricity: 5000,
  appliances: 2000,
  wifi: 500,
  comfort: 12000,
  savings: 8000
};

const DEFAULT_GOALS = [
  { id: crypto.randomUUID(), name: "Emergency Fund", target: 100000, saved: 0, deadline: "2026-12-31" },
  { id: crypto.randomUUID(), name: "Travel Fund", target: 50000, saved: 0, deadline: "2026-11-30" },
  { id: crypto.randomUUID(), name: "Gifts for Parents", target: 20000, saved: 0, deadline: "2026-08-15" },
  { id: crypto.randomUUID(), name: "Meta Glasses Fund", target: 70000, saved: 0, deadline: "2026-11-30" }
];

let state = loadState();
let previewTransactions = [];
let previewNotice = "";
let trendChart;
let categoryChart;

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        transactions: parsed.transactions || [],
        budget: { ...DEFAULT_BUDGET, ...(parsed.budget || {}) },
        goals: parsed.goals?.length ? parsed.goals : DEFAULT_GOALS
      };
    }
  } catch (error) {
    console.warn("Could not read saved tracker data", error);
  }
  return { transactions: [], budget: { ...DEFAULT_BUDGET }, goals: DEFAULT_GOALS };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const raw = String(value).trim();
  if (!raw) return 0;
  const isNegative = /^-/.test(raw) || /\bdr\b|debit/i.test(raw);
  const isCredit = /\bcr\b|credit/i.test(raw);
  const cleaned = raw.replace(/[₹,\s]/g, "").replace(/cr|dr|credit|debit/gi, "");
  const parsed = Number(cleaned.replace(/[()]/g, ""));
  if (!Number.isFinite(parsed)) return 0;
  if (isNegative && !isCredit) return -Math.abs(parsed);
  return parsed;
}

function parseDate(value) {
  if (!value) return new Date().toISOString().slice(0, 10);
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value === "number") {
    const excelDate = XLSX.SSF.parse_date_code(value);
    if (excelDate) {
      const date = new Date(Date.UTC(excelDate.y, excelDate.m - 1, excelDate.d));
      return date.toISOString().slice(0, 10);
    }
  }
  const raw = String(value).trim();
  const date = new Date(raw);
  if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);

  const match = raw.match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})/);
  if (match) {
    const day = Number(match[1]);
    const month = Number(match[2]);
    let year = Number(match[3]);
    if (year < 100) year += 2000;
    return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10);
  }
  return new Date().toISOString().slice(0, 10);
}

function normaliseKey(key) {
  return String(key || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function findColumn(headers, aliases) {
  const normalized = headers.map((h) => ({ original: h, key: normaliseKey(h) }));
  return normalized.find((header) => aliases.some((alias) => header.key.includes(alias)))?.original;
}

function getMerchant(description) {
  const cleaned = String(description || "")
    .replace(/UPI|IMPS|NEFT|RTGS|ACH|POS|INB|ATM|TRANSFER|PAYMENT|DEBIT|CREDIT/gi, " ")
    .replace(/[0-9@_:\-/\\.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.split(" ").slice(0, 4).join(" ") || "Unknown";
}

function categorize(description, amount, type) {
  const text = String(description || "").toLowerCase();
  if (type === "income" || /salary|stipend|fellowship|payroll|credited by/i.test(text)) return "Income";
  const rules = [
    ["Rent", /rent|landlord|housing|flat|apartment/],
    ["Bills", /electricity|power|bill|utility|mseb|adani|tata power|water bill|gas/],
    ["WiFi", /wifi|internet|jiofiber|airtel|hathway|broadband/],
    ["Transport", /uber|ola|rapido|metro|train|irctc|fuel|petrol|diesel|auto|cab|bus/],
    ["Food", /zomato|swiggy|restaurant|cafe|starbucks|food|dining|eatclub|dominos|pizza|subway|mcdonald|burger|chaayos|biryani/],
    ["Groceries", /zepto|blinkit|instamart|grocery|dmart|reliance fresh|bigbasket|more supermarket|jiomart/],
    ["Shopping", /nykaa|myntra|amazon|flipkart|shopping|ajio|meesho|h&m|zara|westside|pantaloons/],
    ["Health", /pharmacy|apollo|tata 1mg|hospital|clinic|doctor|medical|diagnostic|thyrocare/],
    ["Family", /mother|mom|mummy|family|papa|dad|father|transfer to mother/],
    ["Beauty", /salon|parlour|beauty|makeup|skincare|clinique|lakme|urban company/],
    ["Entertainment", /netflix|prime video|hotstar|bookmyshow|spotify|movie|pvr|inox/],
    ["Subscriptions", /subscription|apple|google one|icloud|microsoft|notion|canva/],
    ["Travel", /flight|hotel|airbnb|makemytrip|goibibo|cleartrip|indigo|air india/],
    ["Education", /course|udemy|coursera|college|university|exam|education/]
  ];
  return rules.find(([, regex]) => regex.test(text))?.[0] || "Uncategorized";
}

function parseRows(rows, sourceName) {
  if (!rows.length) return [];
  const headers = Object.keys(rows[0] || {});
  const dateCol = findColumn(headers, ["date", "transactiondate", "valuedate", "txn", "postingdate"]);
  const descCol = findColumn(headers, ["description", "narration", "particular", "merchant", "remarks", "details", "transactiondetails"]);
  const amountCol = findColumn(headers, ["amount", "transactionamount", "amt"]);
  const debitCol = findColumn(headers, ["debit", "withdrawal", "withdraw", "paid", "dr"]);
  const creditCol = findColumn(headers, ["credit", "deposit", "received", "cr"]);

  return rows
    .map((row) => {
      const description = String(row[descCol] || row[headers[1]] || "").trim();
      const debit = toNumber(row[debitCol]);
      const credit = toNumber(row[creditCol]);
      const amountRaw = toNumber(row[amountCol]);
      let amount = 0;
      let type = "expense";

      if (credit > 0 && debit <= 0) {
        amount = Math.abs(credit);
        type = "income";
      } else if (debit > 0) {
        amount = Math.abs(debit);
        type = "expense";
      } else if (amountRaw < 0) {
        amount = Math.abs(amountRaw);
        type = "expense";
      } else if (amountRaw > 0) {
        amount = Math.abs(amountRaw);
        type = /salary|credit|deposit|fellowship|stipend/i.test(description) ? "income" : "expense";
      }

      const date = parseDate(row[dateCol] || row[headers[0]]);
      const category = categorize(description, amount, type);
      return {
        id: crypto.randomUUID(),
        date,
        description: description || "Imported transaction",
        amount,
        type,
        category,
        merchant: getMerchant(description),
        source: sourceName || "upload",
        selected: true
      };
    })
    .filter((tx) => tx.amount > 0 && tx.description);
}

function getSelectedMonth() {
  return document.getElementById("month-filter").value || "all";
}

function currentMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

function monthLabel(monthKey) {
  if (monthKey === "all") return "All months";
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

function filteredByMonth(transactions = state.transactions) {
  const selected = getSelectedMonth();
  if (selected === "all") return transactions;
  return transactions.filter((tx) => tx.date?.slice(0, 7) === selected);
}

function calculateSummary(transactions) {
  const income = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0);
  const expenses = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0);
  const savings = income - expenses;
  const fixed = Number(state.budget.rent) + Number(state.budget.family) + Number(state.budget.transport) + Number(state.budget.electricity) + Number(state.budget.appliances) + Number(state.budget.wifi);
  const needs = transactions.filter((t) => t.type === "expense" && NEED_CATEGORIES.has(t.category)).reduce((sum, t) => sum + Number(t.amount), 0);
  const comfort = transactions.filter((t) => t.type === "expense" && COMFORT_CATEGORIES.has(t.category)).reduce((sum, t) => sum + Number(t.amount), 0);
  const effectiveIncome = income || Number(state.budget.income) || 0;
  const savingsRate = effectiveIncome ? (savings / effectiveIncome) * 100 : 0;
  const comfortRatio = effectiveIncome ? (comfort / effectiveIncome) * 100 : 0;
  const fixedRatio = effectiveIncome ? (fixed / effectiveIncome) * 100 : 0;
  let score = 100;
  if (savings < 0) score -= 45;
  if (savingsRate < 10) score -= 18;
  if (fixedRatio > 60) score -= 18;
  if (comfortRatio > 25) score -= 14;
  if (expenses > effectiveIncome) score -= 20;
  score = Math.max(0, Math.min(100, Math.round(score)));
  return { income, expenses, savings, fixed, needs, comfort, savingsRate, comfortRatio, fixedRatio, score, effectiveIncome };
}

function updateMonthFilter() {
  const select = document.getElementById("month-filter");
  const current = select.value || currentMonthKey();
  const months = [...new Set(state.transactions.map((tx) => tx.date?.slice(0, 7)).filter(Boolean))].sort().reverse();
  select.innerHTML = `<option value="all">All months</option>` + months.map((month) => `<option value="${month}">${monthLabel(month)}</option>`).join("");
  select.value = months.includes(current) ? current : (months[0] || "all");
}

function setRing(score) {
  const ring = document.querySelector(".score-ring");
  const degrees = (score / 100) * 360;
  ring.style.background = `conic-gradient(var(--accent) ${degrees}deg, var(--accent-soft) ${degrees}deg 360deg)`;
  document.getElementById("score-ring-text").textContent = score;
}

function renderDashboard() {
  const transactions = filteredByMonth();
  const summary = calculateSummary(transactions);
  document.getElementById("income-total").textContent = formatCurrency(summary.income || state.budget.income);
  document.getElementById("expense-total").textContent = formatCurrency(summary.expenses);
  document.getElementById("savings-total").textContent = formatCurrency(summary.savings || ((summary.income || state.budget.income) - summary.expenses));
  document.getElementById("fixed-total").textContent = formatCurrency(summary.fixed);
  document.getElementById("income-subtext").textContent = getSelectedMonth() === "all" ? "All uploaded data" : monthLabel(getSelectedMonth());
  document.getElementById("expense-subtext").textContent = `${transactions.filter((t) => t.type === "expense").length} expense entries`;
  document.getElementById("fixed-subtext").textContent = `${Math.round(summary.fixedRatio)}% of planned income`;

  document.getElementById("comfort-score").textContent = `${summary.score}/100`;
  const message = summary.score >= 80 ? "You are in a comfortable zone." : summary.score >= 55 ? "You are managing, but flexible spending needs watching." : "Overspending risk. Reduce comfort spends and review fixed costs.";
  document.getElementById("comfort-message").textContent = message;
  setRing(summary.score);
  renderCharts();
  renderMerchants(transactions);
  renderComfortBreakdown(summary);
}

function renderCharts() {
  const monthly = {};
  state.transactions.forEach((tx) => {
    const month = tx.date?.slice(0, 7) || "Unknown";
    monthly[month] ||= { month, income: 0, expenses: 0 };
    if (tx.type === "income") monthly[month].income += Number(tx.amount);
    else monthly[month].expenses += Number(tx.amount);
  });
  const monthlyData = Object.values(monthly).sort((a, b) => a.month.localeCompare(b.month)).slice(-8);
  const trendCtx = document.getElementById("trend-chart");
  trendChart?.destroy();
  trendChart = new Chart(trendCtx, {
    type: "line",
    data: {
      labels: monthlyData.map((row) => monthLabel(row.month)),
      datasets: [
        { label: "Income", data: monthlyData.map((row) => row.income), tension: 0.38, fill: false },
        { label: "Expenses", data: monthlyData.map((row) => row.expenses), tension: 0.38, fill: false }
      ]
    },
    options: chartOptions("₹")
  });

  const selectedTx = filteredByMonth().filter((tx) => tx.type === "expense");
  const categoryTotals = {};
  selectedTx.forEach((tx) => { categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + Number(tx.amount); });
  const categoryData = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const categoryCtx = document.getElementById("category-chart");
  categoryChart?.destroy();
  categoryChart = new Chart(categoryCtx, {
    type: "doughnut",
    data: {
      labels: categoryData.map(([category]) => category),
      datasets: [{ data: categoryData.map(([, value]) => value), borderWidth: 0 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" }, tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${formatCurrency(ctx.raw)}` } } }
    }
  });
}

function chartOptions(prefix) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "bottom" }, tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.raw)}` } } },
    scales: {
      y: { ticks: { callback: (value) => `${prefix}${Number(value).toLocaleString("en-IN")}` }, grid: { color: "rgba(23, 32, 31, 0.08)" } },
      x: { grid: { display: false } }
    }
  };
}

function renderMerchants(transactions) {
  const totals = {};
  transactions.filter((tx) => tx.type === "expense").forEach((tx) => { totals[tx.merchant] = (totals[tx.merchant] || 0) + Number(tx.amount); });
  const rows = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 6);
  document.getElementById("merchant-list").innerHTML = rows.length ? rows.map(([merchant, value]) => `
    <div class="list-row"><div><strong>${escapeHtml(merchant)}</strong><br><span>Merchant spend</span></div><strong>${formatCurrency(value)}</strong></div>
  `).join("") : `<div class="empty-state">No merchant data yet.</div>`;
}

function renderComfortBreakdown(summary) {
  const income = summary.effectiveIncome || 1;
  const rows = [
    ["Needs", summary.needs, "Rent, groceries, family, bills"],
    ["Comfort", summary.comfort, "Food delivery, shopping, entertainment"],
    ["Savings", Math.max(0, summary.savings), "Money left after expenses"]
  ];
  document.getElementById("comfort-breakdown").innerHTML = rows.map(([name, value, note]) => `
    <div class="comfort-row"><div><strong>${name}</strong><br><span>${note}</span></div><strong>${formatCurrency(value)}<br><span>${Math.round((value / income) * 100)}%</span></strong></div>
  `).join("");
}

function renderTransactions() {
  const body = document.getElementById("transactions-body");
  const search = document.getElementById("transaction-search").value.toLowerCase();
  const category = document.getElementById("category-filter").value;
  const txs = filteredByMonth()
    .filter((tx) => !category || tx.category === category)
    .filter((tx) => `${tx.description} ${tx.merchant} ${tx.category}`.toLowerCase().includes(search))
    .sort((a, b) => b.date.localeCompare(a.date));

  body.innerHTML = txs.map((tx) => `
    <tr>
      <td>${tx.date}</td>
      <td>${escapeHtml(tx.description)}</td>
      <td>${escapeHtml(tx.merchant)}</td>
      <td>${categorySelect(tx.category, `data-id="${tx.id}" class="category-select transaction-category"`)}</td>
      <td>${tx.type}</td>
      <td class="amount-col ${tx.type === "income" ? "amount-income" : "amount-expense"}">${tx.type === "income" ? "+" : "-"}${formatCurrency(tx.amount)}</td>
      <td><button class="delete-row" data-delete="${tx.id}">Delete</button></td>
    </tr>
  `).join("");
  document.getElementById("empty-transactions").hidden = txs.length > 0;
}

function categorySelect(selected, attrs = "") {
  return `<select ${attrs}>${CATEGORIES.map((category) => `<option value="${category}" ${category === selected ? "selected" : ""}>${category}</option>`).join("")}</select>`;
}

function populateCategoryFilters() {
  document.getElementById("category-filter").innerHTML = `<option value="">All categories</option>` + CATEGORIES.map((c) => `<option value="${c}">${c}</option>`).join("");
  document.getElementById("manual-category").innerHTML = CATEGORIES.map((c) => `<option value="${c}">${c}</option>`).join("");
}

function renderBudget() {
  const fields = {
    "budget-income": "income",
    "budget-rent": "rent",
    "budget-family": "family",
    "budget-transport": "transport",
    "budget-electricity": "electricity",
    "budget-appliances": "appliances",
    "budget-wifi": "wifi",
    "budget-comfort": "comfort",
    "budget-savings": "savings"
  };
  Object.entries(fields).forEach(([id, key]) => { document.getElementById(id).value = state.budget[key] || 0; });
  const fixed = state.budget.rent + state.budget.family + state.budget.transport + state.budget.electricity + state.budget.appliances + state.budget.wifi;
  const left = state.budget.income - fixed - state.budget.comfort - state.budget.savings;
  document.getElementById("budget-note").textContent = `Planned fixed expenses are ${formatCurrency(fixed)}. After comfort budget and savings target, estimated leftover is ${formatCurrency(left)}.`;
}

function renderGoals() {
  const list = document.getElementById("goals-list");
  list.innerHTML = state.goals.map((goal) => {
    const progress = goal.target ? Math.min(100, Math.round((goal.saved / goal.target) * 100)) : 0;
    const deadline = goal.deadline ? new Date(goal.deadline) : null;
    const today = new Date();
    const monthsLeft = deadline ? Math.max(1, Math.ceil((deadline - today) / (1000 * 60 * 60 * 24 * 30))) : 1;
    const required = Math.max(0, Math.ceil((goal.target - goal.saved) / monthsLeft));
    return `
      <div class="goal-card" data-goal="${goal.id}">
        <div class="goal-top"><h4>${escapeHtml(goal.name)}</h4><button class="delete-row" data-delete-goal="${goal.id}">Delete</button></div>
        <div class="progress"><div style="width:${progress}%"></div></div>
        <p class="goal-meta">${formatCurrency(goal.saved)} saved of ${formatCurrency(goal.target)} · ${progress}% complete<br>Required monthly saving: ${formatCurrency(required)}</p>
        <div class="goal-inputs">
          <label>Saved <input type="number" value="${goal.saved}" data-goal-field="saved" data-goal-id="${goal.id}"></label>
          <label>Target <input type="number" value="${goal.target}" data-goal-field="target" data-goal-id="${goal.id}"></label>
        </div>
      </div>
    `;
  }).join("");
}

function renderInsights() {
  const transactions = filteredByMonth();
  const summary = calculateSummary(transactions);
  const expenseTx = transactions.filter((tx) => tx.type === "expense");
  const categoryTotals = {};
  expenseTx.forEach((tx) => { categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + Number(tx.amount); });
  const topCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const biggest = expenseTx.sort((a, b) => b.amount - a.amount)[0];
  const insights = [];

  insights.push(`Your fixed expenses are around ${Math.round(summary.fixedRatio)}% of your planned income. Try to keep this below 55–60% if you want breathing space.`);
  insights.push(`Your current savings rate is ${Math.round(summary.savingsRate)}%. A healthy first target is 10–15%, then slowly move higher.`);
  if (topCategories.length) insights.push(`Your top spending categories are ${topCategories.map(([c, v]) => `${c} (${formatCurrency(v)})`).join(", ")}.`);
  if (biggest) insights.push(`Your biggest single expense in this period is ${formatCurrency(biggest.amount)} for ${biggest.description}.`);
  if (summary.comfort > state.budget.comfort) insights.push(`Comfort spending is above your planned comfort budget by ${formatCurrency(summary.comfort - state.budget.comfort)}.`);
  else insights.push(`Comfort spending is within the planned comfort budget by ${formatCurrency(state.budget.comfort - summary.comfort)}.`);
  insights.push(`If you reduce comfort spends by 15%, you could save approximately ${formatCurrency(summary.comfort * 0.15)} more this month.`);

  document.getElementById("insights-list").innerHTML = insights.map((text, index) => `
    <div class="insight-card"><div class="insight-number">${index + 1}</div><p>${text}</p></div>
  `).join("");
}

function renderAll() {
  updateMonthFilter();
  renderDashboard();
  renderTransactions();
  renderBudget();
  renderGoals();
  renderInsights();
}

async function previewFile(file) {
  previewNotice = "";
  const lowerName = file.name.toLowerCase();
  try {
    if (lowerName.endsWith(".pdf")) {
      await previewPdfFile(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target.result;
        let rows = [];
        if (lowerName.endsWith(".csv")) {
          const workbook = XLSX.read(data, { type: "string" });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        } else {
          const workbook = XLSX.read(data, { type: "array" });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        }
        previewTransactions = removeDuplicates(parseRows(rows, file.name));
        if (!previewTransactions.length) {
          previewNotice = "We could read this file, but could not detect transaction rows. Please check the file format or try CSV/Excel.";
        }
        renderPreview();
      } catch (error) {
        console.error(error);
        showUploadError("This file could not be parsed. Please upload a clean CSV, Excel, or text-based PDF statement.");
      }
    };
    if (lowerName.endsWith(".csv")) reader.readAsText(file);
    else reader.readAsArrayBuffer(file);
  } catch (error) {
    console.error(error);
    showUploadError("This file could not be parsed. Please upload a clean CSV, Excel, or text-based PDF statement.");
  }
}

async function previewPdfFile(file) {
  if (!window.pdfjsLib) {
    showUploadError("PDF support could not load. Please check your internet connection, then refresh and try again.");
    return;
  }
  pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const lines = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const pageLines = groupPdfTextIntoLines(textContent.items || []);
      lines.push(...pageLines);
    }

    const extractedText = lines.join("\n").trim();
    if (!extractedText || extractedText.length < 40) {
      showUploadError("This looks like a scanned PDF. Text could not be extracted. Please upload CSV/Excel or a text-based PDF.");
      return;
    }

    const parsed = parsePdfLines(lines, file.name);
    previewTransactions = removeDuplicates(parsed);
    if (!previewTransactions.length) {
      previewNotice = "We could read the PDF, but could not detect transaction rows. Please upload CSV/Excel or a cleaner text-based PDF.";
    } else if (previewTransactions.length < 5) {
      previewNotice = "PDF parsing confidence is low. Please review the detected rows carefully before importing.";
    } else {
      previewNotice = "PDF imported locally. Please review the rows because PDF tables can sometimes shift columns.";
    }
    renderPreview();
  } catch (error) {
    console.error(error);
    if (error?.name === "PasswordException" || /password/i.test(error?.message || "")) {
      showUploadError("This PDF appears to be password protected. Please upload an unlocked PDF or CSV/Excel statement.");
      return;
    }
    showUploadError("We could not read this PDF. Please upload an unlocked text-based PDF, CSV, or Excel statement.");
  }
}

function groupPdfTextIntoLines(items) {
  const rows = [];
  items.forEach((item) => {
    const text = String(item.str || "").trim();
    if (!text) return;
    const x = Math.round(item.transform?.[4] || 0);
    const y = Math.round(item.transform?.[5] || 0);
    let row = rows.find((candidate) => Math.abs(candidate.y - y) <= 3);
    if (!row) {
      row = { y, parts: [] };
      rows.push(row);
    }
    row.parts.push({ x, text });
  });

  return rows
    .sort((a, b) => b.y - a.y)
    .map((row) => row.parts.sort((a, b) => a.x - b.x).map((part) => part.text).join(" ").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function parsePdfLines(lines, sourceName) {
  const transactions = [];
  const dateRegex = /\b(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|\d{4}[\/-]\d{1,2}[\/-]\d{1,2}|\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{2,4})\b/i;
  const amountRegex = /(?:₹\s*)?-?\d{1,3}(?:,\d{2,3})+(?:\.\d{1,2})?\s*(?:CR|DR)?|(?:₹\s*)?-?\d+(?:\.\d{1,2})\s*(?:CR|DR)?|\b\d+\s*(?:CR|DR)\b/gi;

  lines.forEach((line) => {
    const dateMatch = line.match(dateRegex);
    if (!dateMatch) return;

    const date = parseDate(dateMatch[1]);
    const afterDate = line.slice(dateMatch.index + dateMatch[0].length).trim();
    const amountMatches = [...afterDate.matchAll(amountRegex)].filter((match) => {
      const token = match[0];
      return /₹|,|\.|CR|DR|^-/.test(token);
    });
    if (!amountMatches.length) return;

    let chosen = amountMatches[0];
    const crMatch = amountMatches.find((match) => /\bCR\b/i.test(match[0]));
    const drMatch = amountMatches.find((match) => /\bDR\b/i.test(match[0]));
    if (crMatch) chosen = crMatch;
    else if (drMatch) chosen = drMatch;

    const rawAmount = chosen[0];
    const amount = Math.abs(toNumber(rawAmount));
    if (!amount) return;

    const description = afterDate.slice(0, chosen.index).replace(/\b(balance|debit|credit|withdrawal|deposit|amount|dr|cr)\b/gi, " ").replace(/\s+/g, " ").trim() || "PDF transaction";
    const lower = `${description} ${rawAmount} ${line}`.toLowerCase();
    let type = "expense";
    if (/\bcr\b|credit|deposit|salary|stipend|fellowship|refund/.test(lower) && !/\bdr\b/.test(rawAmount.toLowerCase())) type = "income";
    if (/\bdr\b|debit|withdrawal|paid|payment/.test(lower) || /^-/.test(rawAmount.trim())) type = "expense";

    transactions.push({
      id: crypto.randomUUID(),
      date,
      description,
      amount,
      type,
      category: categorize(description, amount, type),
      merchant: getMerchant(description),
      source: sourceName || "pdf upload",
      selected: true
    });
  });

  return transactions;
}

function showUploadError(message) {
  previewTransactions = [];
  previewNotice = message;
  alert(message);
}

function removeDuplicates(transactions) {
  const existingKeys = new Set(state.transactions.map((tx) => `${tx.date}|${tx.description}|${tx.amount}|${tx.type}`));
  return transactions.filter((tx) => !existingKeys.has(`${tx.date}|${tx.description}|${tx.amount}|${tx.type}`));
}

function renderPreview() {
  const panel = document.getElementById("preview-panel");
  panel.hidden = false;
  const income = previewTransactions.filter((tx) => tx.type === "income").reduce((sum, tx) => sum + tx.amount, 0);
  const expenses = previewTransactions.filter((tx) => tx.type === "expense").reduce((sum, tx) => sum + tx.amount, 0);
  document.getElementById("preview-title").textContent = `${previewTransactions.length} new transactions detected`;
  document.getElementById("preview-summary").innerHTML = `
    <span class="summary-pill">Income: ${formatCurrency(income)}</span>
    <span class="summary-pill">Expenses: ${formatCurrency(expenses)}</span>
    <span class="summary-pill">Duplicates skipped automatically</span>
    ${previewNotice ? `<span class="summary-pill warning-pill">${escapeHtml(previewNotice)}</span>` : ""}
  `;
  document.getElementById("preview-body").innerHTML = previewTransactions.map((tx) => `
    <tr>
      <td><input type="checkbox" checked data-preview-check="${tx.id}"></td>
      <td>${tx.date}</td>
      <td>${escapeHtml(tx.description)}</td>
      <td class="${tx.type === "income" ? "amount-income" : "amount-expense"}">${formatCurrency(tx.amount)}</td>
      <td>${tx.type}</td>
      <td>${categorySelect(tx.category, `data-preview-category="${tx.id}" class="category-select"`)}</td>
    </tr>
  `).join("");
  panel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function importPreview() {
  const selectedIds = new Set([...document.querySelectorAll("[data-preview-check]")].filter((input) => input.checked).map((input) => input.dataset.previewCheck));
  const categoryMap = Object.fromEntries([...document.querySelectorAll("[data-preview-category]")].map((select) => [select.dataset.previewCategory, select.value]));
  const imported = previewTransactions
    .filter((tx) => selectedIds.has(tx.id))
    .map(({ selected, ...tx }) => ({ ...tx, category: categoryMap[tx.id] || tx.category }));
  state.transactions = [...state.transactions, ...imported];
  saveState();
  previewTransactions = [];
  previewNotice = "";
  document.getElementById("preview-panel").hidden = true;
  renderAll();
  switchView("dashboard");
}

function loadSampleData() {
  const month = currentMonthKey();
  const sample = [
    ["Salary credit", 66667, "income", "Income", 1],
    ["Rent payment to landlord", 23000, "expense", "Rent", 2],
    ["Transfer to mom", 10000, "expense", "Family", 3],
    ["Zepto groceries", 2450, "expense", "Groceries", 5],
    ["Zomato dinner", 780, "expense", "Food", 6],
    ["Ola office commute", 420, "expense", "Transport", 7],
    ["Electricity bill", 5100, "expense", "Bills", 8],
    ["Airtel WiFi", 499, "expense", "WiFi", 9],
    ["Myntra shopping", 3200, "expense", "Shopping", 10],
    ["Apollo pharmacy", 860, "expense", "Health", 11],
    ["Appliance rent", 2000, "expense", "Bills", 12],
    ["Swiggy lunch", 390, "expense", "Food", 13],
    ["Metro card recharge", 1000, "expense", "Transport", 14],
    ["Nykaa skincare", 1650, "expense", "Beauty", 16]
  ].map(([description, amount, type, category, day]) => ({
    id: crypto.randomUUID(),
    date: `${month}-${String(day).padStart(2, "0")}`,
    description,
    amount,
    type,
    category,
    merchant: getMerchant(description),
    source: "sample"
  }));
  state.transactions = [...state.transactions, ...sample];
  saveState();
  renderAll();
}

function switchView(viewId) {
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active-view", view.id === viewId));
  document.querySelectorAll(".nav-item").forEach((btn) => btn.classList.toggle("active", btn.dataset.view === viewId));
  const label = document.querySelector(`.nav-item[data-view="${viewId}"]`)?.textContent || "Dashboard";
  document.getElementById("page-title").textContent = label;
  if (viewId === "dashboard") renderDashboard();
  if (viewId === "transactions") renderTransactions();
  if (viewId === "budget") renderBudget();
  if (viewId === "goals") renderGoals();
  if (viewId === "insights") renderInsights();
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
}

function exportJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `comfort-expense-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function importJson(file) {
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const parsed = JSON.parse(event.target.result);
      state = {
        transactions: parsed.transactions || [],
        budget: { ...DEFAULT_BUDGET, ...(parsed.budget || {}) },
        goals: parsed.goals || DEFAULT_GOALS
      };
      saveState();
      renderAll();
      alert("Backup imported successfully.");
    } catch {
      alert("This backup file could not be read.");
    }
  };
  reader.readAsText(file);
}

function addManualTransaction(event) {
  event.preventDefault();
  const description = document.getElementById("manual-description").value;
  const type = document.getElementById("manual-type").value;
  const tx = {
    id: crypto.randomUUID(),
    date: document.getElementById("manual-date").value || new Date().toISOString().slice(0, 10),
    description,
    amount: Math.abs(Number(document.getElementById("manual-amount").value)),
    type,
    category: document.getElementById("manual-category").value || categorize(description, 0, type),
    merchant: getMerchant(description),
    source: "manual"
  };
  state.transactions.push(tx);
  saveState();
  document.getElementById("transaction-dialog").close();
  document.getElementById("transaction-form").reset();
  renderAll();
}

function addGoal() {
  const name = prompt("Goal name", "New Savings Goal");
  if (!name) return;
  const target = Number(prompt("Target amount", "50000") || 0);
  const deadline = prompt("Deadline YYYY-MM-DD", "2026-12-31") || "";
  state.goals.push({ id: crypto.randomUUID(), name, target, saved: 0, deadline });
  saveState();
  renderGoals();
}

function bindEvents() {
  document.querySelectorAll(".nav-item").forEach((btn) => btn.addEventListener("click", () => switchView(btn.dataset.view)));
  document.getElementById("month-filter").addEventListener("change", () => { renderDashboard(); renderTransactions(); renderInsights(); });
  document.getElementById("sample-data-btn").addEventListener("click", loadSampleData);
  document.getElementById("quick-add-btn").addEventListener("click", () => {
    document.getElementById("manual-date").value = new Date().toISOString().slice(0, 10);
    document.getElementById("transaction-dialog").showModal();
  });
  document.getElementById("close-dialog-btn").addEventListener("click", () => document.getElementById("transaction-dialog").close());
  document.getElementById("transaction-form").addEventListener("submit", addManualTransaction);

  document.getElementById("choose-file-btn").addEventListener("click", () => document.getElementById("file-input").click());
  document.getElementById("file-input").addEventListener("change", (event) => event.target.files[0] && previewFile(event.target.files[0]));
  const dropZone = document.getElementById("drop-zone");
  ["dragenter", "dragover"].forEach((eventName) => dropZone.addEventListener(eventName, (event) => { event.preventDefault(); dropZone.classList.add("dragover"); }));
  ["dragleave", "drop"].forEach((eventName) => dropZone.addEventListener(eventName, (event) => { event.preventDefault(); dropZone.classList.remove("dragover"); }));
  dropZone.addEventListener("drop", (event) => event.dataTransfer.files[0] && previewFile(event.dataTransfer.files[0]));
  document.getElementById("cancel-preview-btn").addEventListener("click", () => { previewTransactions = []; previewNotice = ""; document.getElementById("preview-panel").hidden = true; });
  document.getElementById("import-preview-btn").addEventListener("click", importPreview);

  document.getElementById("transaction-search").addEventListener("input", renderTransactions);
  document.getElementById("category-filter").addEventListener("change", renderTransactions);
  document.getElementById("transactions-body").addEventListener("change", (event) => {
    if (event.target.matches(".transaction-category")) {
      const tx = state.transactions.find((item) => item.id === event.target.dataset.id);
      if (tx) tx.category = event.target.value;
      saveState(); renderAll();
    }
  });
  document.getElementById("transactions-body").addEventListener("click", (event) => {
    const id = event.target.dataset.delete;
    if (id && confirm("Delete this transaction?")) {
      state.transactions = state.transactions.filter((tx) => tx.id !== id);
      saveState(); renderAll();
    }
  });

  document.getElementById("save-budget-btn").addEventListener("click", () => {
    state.budget = {
      income: Number(document.getElementById("budget-income").value),
      rent: Number(document.getElementById("budget-rent").value),
      family: Number(document.getElementById("budget-family").value),
      transport: Number(document.getElementById("budget-transport").value),
      electricity: Number(document.getElementById("budget-electricity").value),
      appliances: Number(document.getElementById("budget-appliances").value),
      wifi: Number(document.getElementById("budget-wifi").value),
      comfort: Number(document.getElementById("budget-comfort").value),
      savings: Number(document.getElementById("budget-savings").value)
    };
    saveState(); renderAll(); alert("Budget saved.");
  });

  document.getElementById("add-goal-btn").addEventListener("click", addGoal);
  document.getElementById("goals-list").addEventListener("input", (event) => {
    const goalId = event.target.dataset.goalId;
    const field = event.target.dataset.goalField;
    if (!goalId || !field) return;
    const goal = state.goals.find((item) => item.id === goalId);
    if (goal) goal[field] = Number(event.target.value);
    saveState(); renderGoals(); renderInsights();
  });
  document.getElementById("goals-list").addEventListener("click", (event) => {
    const id = event.target.dataset.deleteGoal;
    if (id && confirm("Delete this goal?")) {
      state.goals = state.goals.filter((goal) => goal.id !== id);
      saveState(); renderGoals();
    }
  });

  document.getElementById("export-json-btn").addEventListener("click", exportJson);
  document.getElementById("import-json-input").addEventListener("change", (event) => event.target.files[0] && importJson(event.target.files[0]));
  document.getElementById("clear-data-btn").addEventListener("click", () => {
    if (confirm("Clear all tracker data from this browser?")) {
      state = { transactions: [], budget: { ...DEFAULT_BUDGET }, goals: DEFAULT_GOALS };
      saveState(); renderAll();
    }
  });
}

populateCategoryFilters();
bindEvents();
renderAll();
