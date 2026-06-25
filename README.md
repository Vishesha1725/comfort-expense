# Comfort Expense Tracker

A private, aesthetic, browser-based personal finance tracker.

## What it does

- Upload Excel/CSV/PDF bank statements
- Auto-detect date, description, debit, credit, and amount columns
- Text-based PDF support using PDF.js in the browser
- Auto-categorise transactions
- Review transactions before import
- Dashboard with income, expenses, savings, fixed costs, comfort score, charts, top merchants
- Transactions table with search, filters, category edit, and delete
- Budget setup with default Thane monthly costs
- Savings goals with progress bars
- Rule-based insights
- Export/import JSON backup
- LocalStorage persistence

## Privacy

This version is browser-only. Uploaded files are processed locally in the browser and saved to localStorage. PDF parsing also runs locally in the browser. CSV/Excel is still the most accurate format; scanned/password-protected PDFs may not parse. There is no backend, database, login, or bank connection.

## Deploy on Vercel

This is a static website. It does not need npm install or npm run build.

Recommended Vercel settings:

- Framework Preset: Other
- Build Command: leave empty
- Output Directory: public
- Install Command: leave empty

The included `vercel.json` already sets `outputDirectory` to `public`.

## How to run locally

Open `public/index.html` directly in your browser.

Or use VS Code Live Server.

## File structure

```text
public/
  index.html
  styles.css
  app.js
vercel.json
README.md
```
