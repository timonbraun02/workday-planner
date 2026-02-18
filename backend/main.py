from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from datetime import date, timedelta
from typing import List, Optional
import holidays

app = FastAPI(title="Workday Planner API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PlanRequest(BaseModel):
    start_date: date
    end_date: date
    home_office_days: int = Field(ge=0)
    vacation_days: int = Field(ge=0, default=0)
    sick_days: int = Field(ge=0, default=0)
    four_day_week: bool = False
    custom_closed_dates: List[date] = []
    bundesland: Optional[str] = None


class PlanResponse(BaseModel):
    total_calendar_days: int
    total_workdays: int
    required_office_days: int
    home_office_days: int
    vacation_days: int
    sick_days: int
    weekend_days: int
    public_holidays: int
    custom_closed_days: int
    four_day_week_off_days: int
    office_attendance_percentage: float
    workday_breakdown: dict


def get_german_holidays(start_year: int, end_year: int, bundesland: Optional[str] = None) -> set:
    """Get German public holidays for the date range"""
    holiday_set = set()
    for year in range(start_year, end_year + 1):
        holiday_set.update(holidays.Germany(years=year, prov=bundesland).keys())
    return holiday_set


def is_workday(day: date, german_holidays: set, custom_closed: set) -> bool:
    """Check if a day is a regular workday"""
    if day.weekday() >= 5:  # Weekend
        return False
    if day in german_holidays:
        return False
    if day in custom_closed:
        return False
    return True


@app.post("/api/calculate", response_model=PlanResponse)
async def calculate_plan(request: PlanRequest):
    if request.start_date > request.end_date:
        raise HTTPException(status_code=400, detail="Start date must be before end date")
    
    german_holidays = get_german_holidays(request.start_date.year, request.end_date.year, request.bundesland)
    custom_closed = set(request.custom_closed_dates)
    
    current = request.start_date
    total_workdays = 0
    weekend_days = 0
    public_holidays_count = 0
    custom_closed_count = 0
    four_day_week_off_days = 0

    # Track workdays per calendar week for 4-day-week calculation
    workdays_per_week: dict[tuple[int, int], int] = {}

    while current <= request.end_date:
        if current.weekday() >= 5:
            weekend_days += 1
        elif current in german_holidays:
            public_holidays_count += 1
        elif current in custom_closed:
            custom_closed_count += 1
        else:
            total_workdays += 1
            week_key = current.isocalendar()[:2]  # (year, week)
            workdays_per_week[week_key] = workdays_per_week.get(week_key, 0) + 1
        current += timedelta(days=1)

    total_calendar_days = (request.end_date - request.start_date).days + 1

    if request.four_day_week:
        for week_key, count in workdays_per_week.items():
            if count > 4:
                four_day_week_off_days += count - 4
        total_workdays -= four_day_week_off_days
    
    available_workdays = total_workdays - request.vacation_days - request.sick_days
    
    if available_workdays < 0:
        raise HTTPException(
            status_code=400, 
            detail="Vacation and sick days exceed available workdays"
        )
    
    if request.home_office_days > available_workdays:
        raise HTTPException(
            status_code=400,
            detail="Home office days cannot exceed available workdays"
        )
    
    required_office_days = available_workdays - request.home_office_days
    
    office_percentage = (
        (required_office_days / available_workdays * 100) 
        if available_workdays > 0 else 0
    )
    
    workday_breakdown = {
        "total_workdays_in_period": total_workdays,
        "available_after_absence": available_workdays,
        "weekend_days": weekend_days,
        "public_holidays": public_holidays_count,
        "custom_closed": custom_closed_count,
        "four_day_week_off_days": four_day_week_off_days
    }
    
    return PlanResponse(
        total_calendar_days=total_calendar_days,
        total_workdays=total_workdays,
        required_office_days=required_office_days,
        home_office_days=request.home_office_days,
        vacation_days=request.vacation_days,
        sick_days=request.sick_days,
        weekend_days=weekend_days,
        public_holidays=public_holidays_count,
        custom_closed_days=custom_closed_count,
        four_day_week_off_days=four_day_week_off_days,
        office_attendance_percentage=round(office_percentage, 2),
        workday_breakdown=workday_breakdown
    )


@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}
