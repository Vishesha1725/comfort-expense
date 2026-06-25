# Comfort Expense Tracker

A local-first personal finance tracker that can run as a static website on Vercel.

## Features

- Upload CSV, XLSX, XLS, and text-based PDF bank statements
- Kotak Mahindra Bank savings account statement parser support
- Auto-detect income and expenses using withdrawal/deposit/balance movement
- Auto-categorise common expenses such as food, groceries, bills, transport, shopping, health, subscriptions, investments, travel, and family transfers
- Review transactions before importing
- Dashboard with income, expenses, savings, comfort spending, category charts, trends, and insights
- Budget setup and savings goals
- Export/import local JSON backup
- Data is saved only in browser localStorage

## Privacy

Uploaded files are processed in the browser. The website does not send statement data to a backend server.

## Best upload format

CSV or Excel is still the most accurate. PDF support works best for text-based bank statements. Password-protected or scanned/image-only PDFs may not parse correctly.

## Vercel setup

Use these settings:

- Framework Preset: Other
- Build Command: leave empty
- Install Command: leave empty
- Output Directory: public

## Project structure

```text
public/
  index.html
  styles.css
  app.js
vercel.json
README.md
```
