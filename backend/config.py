from datetime import datetime, timedelta

TIME_OFFSET_DAYS = 0

def get_simulated_now():
    global TIME_OFFSET_DAYS
    return datetime.utcnow() + timedelta(days=TIME_OFFSET_DAYS)

def add_simulated_days(days: int):
    global TIME_OFFSET_DAYS
    TIME_OFFSET_DAYS += days
    return TIME_OFFSET_DAYS

def reset_simulation():
    global TIME_OFFSET_DAYS
    TIME_OFFSET_DAYS = 0
