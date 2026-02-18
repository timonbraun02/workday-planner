# Workday Planner

A self-hosted tool for workday planning and daily work time tracking. Calculate required office days, optimize home office usage, and track your daily hours.

## Features

### HO-Planer
- Flexible date ranges with quick-select (current year, today to year end, next month)
- 4-day work week support (per-week calculation, not a flat 20% cut)
- German public holidays with per-state support (all 16 Bundeslaender)
- Custom office closure dates
- Tracks home office, vacation, and sick days
- Shows required office days per week and per month

### Arbeitszeitrechner
- Enter start time, end time, and break duration
- "Jetzt" button to set end time to current time
- Calculates gross time, break, and net working hours
- Fully client-side, no backend needed

## Tech Stack

- **Backend**: Python 3.11, FastAPI, [holidays](https://pypi.org/project/holidays/)
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Deployment**: Docker & Docker Compose, nginx reverse proxy

## Quick Start

```bash
docker-compose up --build -d
```

The app is available at `http://<host>:80` by default.

### Custom Port

Create a `.env` file next to `docker-compose.yml`:

```
PORT=8085
```

Or pass it inline (Linux/Mac):

```bash
PORT=8085 docker-compose up --build -d
```

### Stop

```bash
docker-compose down
```

## API

### POST /api/calculate

```json
{
  "start_date": "2026-01-01",
  "end_date": "2026-12-31",
  "home_office_days": 50,
  "vacation_days": 25,
  "sick_days": 5,
  "four_day_week": false,
  "custom_closed_dates": [],
  "bundesland": "BY"
}
```

`bundesland` is optional. Valid values: `BW`, `BY`, `BE`, `BB`, `HB`, `HH`, `HE`, `MV`, `NI`, `NW`, `RP`, `SL`, `SN`, `ST`, `SH`, `TH`. Omit for federal holidays only.

### GET /api/health

Health check endpoint.

## Project Structure

```
workday-planner/
├── backend/
│   ├── Dockerfile
│   ├── main.py
│   └── requirements.txt
├── frontend/
│   ├── Dockerfile
│   ├── index.html
│   └── nginx.conf
├── docker-compose.yml
├── .env
└── README.md
```

## License

MIT
