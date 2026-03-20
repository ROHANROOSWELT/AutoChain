import json
import os
from datetime import datetime

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
HISTORY_FILE = os.path.join(DATA_DIR, "bill_history.json")

def _ensure_data_dir():
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)

def load_history():
    """Load bill history from JSON file."""
    _ensure_data_dir()
    if not os.path.exists(HISTORY_FILE):
        return {}
    
    try:
        with open(HISTORY_FILE, "r") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading history: {e}")
        return {}

def save_history(history):
    """Save bill history to JSON file."""
    _ensure_data_dir()
    try:
        with open(HISTORY_FILE, "w") as f:
            json.dump(history, f, indent=4)
        return True
    except Exception as e:
        print(f"Error saving history: {e}")
        return False

def get_item_history(item_type, item_key):
    """Get historical data for a specific item."""
    history = load_history()
    key = f"{item_type}:{item_key.lower()}"
    return history.get(key)

def update_item_history(item_type, item_key, current_amount,
                        subscription_start=None, duration_months=None):
    """
    Update the historical record for an item (subscription, bill, purchase).
    Moves current_amount to previous_amount and sets new current_amount.
    For subscriptions, also persists subscription_start and duration_months
    (only on first write; never overwritten afterwards).
    renewal_count starts at 0 and is incremented separately via increment_renewal_count().
    """
    history = load_history()
    key = f"{item_type}:{item_key.lower()}"
    
    # Get existing record or create new one
    record = history.get(key, {
        "type": item_type,
        "key": item_key,
        "previous_amount": None,
        "current_amount": "0",
        "last_updated": None,
        # Subscription-specific fields (default None for bills/purchases)
        "subscription_start": None,
        "duration_months": None,
        "renewal_count": 0,
    })

    # Update amount fields
    record["previous_amount"] = record["current_amount"]
    record["current_amount"] = str(current_amount)
    record["last_updated"] = datetime.utcnow().isoformat()

    # Subscription-specific: write on first creation only
    if item_type == "subscription":
        if record.get("subscription_start") is None:
            record["subscription_start"] = (
                subscription_start or datetime.utcnow().isoformat()
            )
        if record.get("duration_months") is None and duration_months is not None:
            record["duration_months"] = int(duration_months)
        if "renewal_count" not in record:
            record["renewal_count"] = 0

    history[key] = record
    return save_history(history)


def increment_renewal_count(item_type, item_key) -> int:
    """
    Increment the renewal_count for a subscription by 1 and persist.
    Returns the new renewal_count.
    """
    history = load_history()
    key = f"{item_type}:{item_key.lower()}"
    record = history.get(key)
    if record is None:
        return 0
    record["renewal_count"] = record.get("renewal_count", 0) + 1
    history[key] = record
    save_history(history)
    return record["renewal_count"]


def mark_subscription_renewed(item_key: str):
    """
    After the user pays/renews, bump renewal_count and update subscription_start
    to NOW so the next billing cycle restarts from today.
    """
    history = load_history()
    key = f"subscription:{item_key.lower()}"
    record = history.get(key)
    if record is None:
        return False
    record["renewal_count"] = 0                          # reset within new term
    record["subscription_start"] = datetime.utcnow().isoformat()
    history[key] = record
    return save_history(history)
