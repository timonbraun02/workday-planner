# Workday Planner

A self-contained, single-file browser tool for home office planning and daily work time tracking. No installation, no dependencies — just open and use.

## Features

### HO-Planer
- Flexible date ranges with quick-select (current year, today to year end, next month)
- German public holidays — all 16 Bundesländer supported
- 4-day work week support
- Tracks home office, vacation, and sick days
- Shows required office days total, per week, and per month

### Arbeitszeitrechner
- Enter start time, end time, and break duration
- "Jetzt" button sets end time to current time
- Shows gross time, break, and net working hours
- Warns about German Arbeitszeitgesetz (ArbZG) violations

### Advanced HO Day Planer
- Plan home office days visually across all 12 months
- Interactive spline chart (Canvas) — drag data points up/down with mouse or touch
- Configurable annual HO budget with live remaining-days counter
- Dashed average budget line for orientation
- Color-coded warnings:
  - 🟡 Yellow warning at ≥ 90 % budget usage
  - 🔴 Red alert when budget is exceeded (shows exact overage)
- Month cards with +/− steppers and available workdays per month
- Fully responsive and Dark Mode compatible

### General
- Dark / Light mode toggle (persisted via localStorage)
- Fully client-side — works offline, no server required

## Usage

Open [index.html](frontend/index.html) in any browser — no installation needed.

Or use the live version on GitHub Pages.

## Deployment

Pushes to `main` automatically deploy to GitHub Pages via GitHub Actions.

To enable GitHub Pages in a new repo:
1. Go to **Settings → Pages**
2. Set source to **GitHub Actions**

## Project Structure

```
workday-planner/
├── frontend/
│   └── index.html      ← entire app (HTML + CSS + JS, single file)
├── .github/
│   └── workflows/
│       └── deploy.yml
└── README.md
```

## License

MIT
