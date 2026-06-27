# MoneyQuest Pixel OS

A production-ready local-first finance tracker with a clean pixel profile-board aesthetic.

## Setup

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Output directory:

```text
dist
```

## Deploy

Cloudflare Pages:
- Build command: `npm run build`
- Output directory: `dist`

Netlify:
- Build command: `npm run build`
- Publish directory: `dist`

Vercel:
- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`

GitHub Pages:
- Run `npm run build`
- Deploy the generated `dist` folder with your preferred Pages workflow.

## Notes

- Data is stored in browser LocalStorage through Zustand persistence.
- No backend or paid APIs are required.
- Default salary/fixed-cost values are editable in Settings.
- Mom Bucket is separate and excluded from fixed costs unless protected.
- WiFi only counts from the configured start month.
