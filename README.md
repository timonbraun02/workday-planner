# Workday Planner

A tool for efficient workday planning and calculating required office days to maximize home office usage.

## Features

- **Flexible Date Range**: Custom start and end dates with quick-select options
- **4-Day Work Week**: Optional configuration for 4-day work weeks
- **Multiple Input Parameters**:
  - Home office days
  - Vacation days
  - Sick days
- **Automatic Consideration**:
  - Weekends
  - German public holidays
  - Custom office closure dates
- **Quick Date Selection**:
  - Current year
  - Today to year end
  - Next month

## Tech Stack

- **Backend**: Python 3.11, FastAPI
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Deployment**: Docker & Docker Compose

## Prerequisites

- Docker
- Docker Compose

## Installation & Running

### Using Docker Compose (Recommended)

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

The application will be available at:
- Frontend: http://localhost
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Manual Setup

#### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

#### Frontend

Serve the `frontend/index.html` file with any web server, or simply open it in a browser.

## API Endpoints

### POST /api/calculate

Calculate workday planning based on provided parameters.

**Request Body:**
```json
{
  "start_date": "2024-01-01",
  "end_date": "2024-12-31",
  "home_office_days": 50,
  "vacation_days": 25,
  "sick_days": 5,
  "four_day_week": false,
  "custom_closed_dates": []
}
```

**Response:**
```json
{
  "total_calendar_days": 366,
  "total_workdays": 254,
  "required_office_days": 174,
  "home_office_days": 50,
  "vacation_days": 25,
  "sick_days": 5,
  "weekend_days": 104,
  "public_holidays": 8,
  "custom_closed_days": 0,
  "office_attendance_percentage": 77.68,
  "workday_breakdown": {
    "total_workdays_in_period": 254,
    "available_after_absence": 224,
    "weekend_days": 104,
    "public_holidays": 8,
    "custom_closed": 0
  }
}
```

### GET /api/health

Health check endpoint.

## Usage

1. Select your desired date range using the quick-select buttons or manual date inputs
2. Enter your planned home office days
3. (Optional) Enter vacation and sick days
4. (Optional) Enable 4-day work week
5. Click "Berechnen" to calculate
6. View your required office days and statistics

## Development

### Project Structure

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
└── README.md
```

### Adding Custom Closed Dates

Custom closed dates can be added through the API by including them in the `custom_closed_dates` array:

```json
{
  "custom_closed_dates": ["2024-12-24", "2024-12-31"]
}
```

## License

MIT
