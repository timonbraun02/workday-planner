# Workday Planner

A simple, self-contained browser tool for workday planning and daily work time tracking. No server, no dependencies — just open the HTML file.

**Live:** [https://&lt;dein-username&gt;.github.io/workday-planner](https://github.com)

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
│   └── index.html
├── .github/
│   └── workflows/
│       └── deploy.yml
└── README.md
```

## License

MIT
