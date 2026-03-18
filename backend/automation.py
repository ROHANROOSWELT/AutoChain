"""
AutoChain Automation Engine — Enhanced with Time Simulation
Subscriptions: auto-cancel by duration, auto-pause if inactive, renewal alerts
Bills: due-date alerts, high-usage detection, budget warnings
Purchases: warranty tracking, ownership proof
"""
from datetime import datetime, timedelta
from typing import Any
import uuid

from config import get_simulated_now


def apply_rules(item: dict) -> dict:
    """Dispatch to the correct automaton based on item type."""
    t = item.get("type", "")
    if t == "subscription":
        return _handle_subscription(item)
    elif t == "bill":
        return _handle_bill(item)
    elif t == "purchase":
        return _handle_purchase(item)
    return {"status": "unknown", "message": "No rules applied — unknown type"}


# ─────────────────────────────────────────────────────────────
# SUBSCRIPTION AUTOMATON
# Simulates: current time vs start time → state changes
# ─────────────────────────────────────────────────────────────
def _handle_subscription(item: dict) -> dict:
    params        = item.get("contract_params", {})
    duration_mo   = int(item.get("duration") or params.get("duration_months") or 3)
    alert_days    = params.get("alert_days_before", 3)
    auto_cancel   = params.get("auto_cancel", True)
    auto_pause    = params.get("auto_pause_if_inactive", True)

    # ── Time simulation ───────────────────────────────────────
    now         = get_simulated_now()
    start_time  = now                                               # contract created now
    expiry_time = start_time + timedelta(days=duration_mo * 30)    # e.g. 90 days
    next_renewal= start_time + timedelta(days=30)                  # first renewal in 30 days
    alert_date  = next_renewal - timedelta(days=alert_days)        # 3 days before renewal

    # ── Simulate elapsed time: pretend 0 days have passed ─────
    elapsed_days = 0          # fresh contract — nothing triggered yet
    simulated_now = now       # would be now + elapsed_days in a real keeper

    # Determine current status based on simulated time
    if auto_cancel and simulated_now >= expiry_time:
        contract_status = "cancelled"
        status_reason   = f"Auto-cancelled: duration of {duration_mo} months exceeded"
    elif simulated_now >= next_renewal:
        contract_status = "renewal_due"
        status_reason   = "Renewal period reached"
    elif simulated_now >= alert_date:
        contract_status = "alert_pending"
        status_reason   = f"Renewal alert window: {alert_days} days before renewal"
    else:
        contract_status = "active"
        status_reason   = "Contract running normally"

    # ── Rules applied ─────────────────────────────────────────
    rules_applied = []

    if auto_cancel:
        rules_applied.append({
            "rule":        "AUTO_CANCEL",
            "description": f"Contract auto-cancels after {duration_mo} months",
            "trigger_date": expiry_time.strftime("%Y-%m-%d"),
            "triggered":   contract_status == "cancelled",
            "status":      "triggered" if contract_status == "cancelled" else "scheduled"
        })

    if auto_pause:
        rules_applied.append({
            "rule":        "AUTO_PAUSE",
            "description": "Contract pauses automatically if marked inactive for 30+ days",
            "triggered":   False,
            "status":      "monitoring"
        })

    rules_applied.append({
        "rule":        "RENEWAL_ALERT",
        "description": f"Alert {alert_days} day(s) before each renewal cycle",
        "trigger_date": alert_date.strftime("%Y-%m-%d"),
        "triggered":   contract_status in ("alert_pending", "renewal_due"),
        "status":      "triggered" if contract_status in ("alert_pending", "renewal_due") else "scheduled"
    })

    # ── Alert messages for UI ──────────────────────────────────
    alert_messages = []
    if contract_status == "alert_pending":
        alert_messages.append(
            f"⚠️ Renewal alert: {item.get('name')} renews on {next_renewal.strftime('%b %d, %Y')}"
        )
    if contract_status == "cancelled":
        alert_messages.append(
            f"🚫 Auto-cancelled: {item.get('name')} contract has expired after {duration_mo} months"
        )

    return {
        "type":   "subscription",
        "action": "create_subscription_contract",
        "rules_applied":  rules_applied,
        "alert_messages": alert_messages,
        "time_simulation": {
            "simulated_now":       simulated_now.strftime("%Y-%m-%d %H:%M:%S UTC"),
            "start_time":          start_time.strftime("%Y-%m-%d"),
            "next_renewal":        next_renewal.strftime("%Y-%m-%d"),
            "expiry_time":         expiry_time.strftime("%Y-%m-%d"),
            "alert_date":          alert_date.strftime("%Y-%m-%d"),
            "elapsed_days":        elapsed_days,
            "days_until_renewal":  (next_renewal - simulated_now).days,
            "days_until_expiry":   (expiry_time - simulated_now).days,
        },
        "contract_lifecycle": {
            "created":      start_time.strftime("%Y-%m-%d"),
            "next_renewal": next_renewal.strftime("%Y-%m-%d"),
            "expiry":       expiry_time.strftime("%Y-%m-%d"),
            "status":       contract_status,
            "status_reason": status_reason,
            "duration_months": duration_mo,
        }
    }


# ─────────────────────────────────────────────────────────────
# BILL AUTOMATON
# Simulates: due-date countdown, historical spike detection, budget warnings
# ─────────────────────────────────────────────────────────────
def _handle_bill(item: dict) -> dict:
    params       = item.get("bill_params", {})
    threshold    = params.get("alert_threshold", 80)
    amount       = float(item.get("amount", 0) or 0)
    prev_amount  = float(params.get("previous_amount") or item.get("previous_amount") or amount)
    risk         = item.get("risk", "normal")
    is_abnormal  = item.get("is_abnormal", False) or params.get("is_abnormal", False)
    increase_pct = float(item.get("increase_pct") or params.get("increase_pct") or 0)

    # ── Due-date simulation ────────────────────────────────────
    now = get_simulated_now()
    # Use provided due_date or fall back to end of month
    due_date_str = params.get("due_date") or item.get("dueDate")
    if due_date_str and due_date_str not in ("end of month", None):
        try:
            due = datetime.strptime(due_date_str, "%Y-%m-%d")
        except ValueError:
            due = datetime(now.year, now.month + 1 if now.month < 12 else 1,
                           1, tzinfo=None) - timedelta(days=1)
    else:
        if now.month == 12:
            due = datetime(now.year + 1, 1, 1) - timedelta(days=1)
        else:
            due = datetime(now.year, now.month + 1, 1) - timedelta(days=1)

    days_left      = max(0, (due - now).days)
    due_soon       = days_left <= 5
    overdue        = days_left == 0 and now.date() > due.date()
    high_usage     = risk == "high" or amount > 2000
    budget_warning = amount >= (threshold / 100) * (amount * 1.25)  # simulated budget

    # ── Rules ──────────────────────────────────────────────────
    rules_applied = []

    # Rule 1: Due date alert
    alert_trigger = due - timedelta(days=3)
    rules_applied.append({
        "rule":         "DUE_DATE_ALERT",
        "description":  f"Send alert 3 days before due date — due on {due.strftime('%b %d, %Y')}",
        "trigger_date": alert_trigger.strftime("%Y-%m-%d"),
        "triggered":    due_soon or overdue,
        "days_remaining": days_left,
        "status":       "triggered" if (due_soon or overdue) else "scheduled"
    })

    # Rule 2: Abnormal increase detection
    rules_applied.append({
        "rule":         "ABNORMAL_INCREASE_DETECTION",
        "description":  (
            f"Compare with previous month (₹{prev_amount:.0f}). "
            f"Current: ₹{amount:.0f}. Change: {increase_pct:+.1f}%"
        ),
        "previous_amount":  prev_amount,
        "current_amount":   amount,
        "increase_pct":     increase_pct,
        "threshold_pct":    20,
        "triggered":        is_abnormal,
        "status":           "triggered" if is_abnormal else "monitoring"
    })

    # Rule 3: Budget warning
    rules_applied.append({
        "rule":         "BUDGET_WARNING",
        "description":  f"Warn when bill exceeds {threshold}% of monthly budget",
        "threshold_percent": threshold,
        "triggered":    budget_warning and high_usage,
        "status":       "triggered" if (budget_warning and high_usage) else "monitoring"
    })

    # Rule 4: High usage flag
    rules_applied.append({
        "rule":         "HIGH_USAGE_FLAG",
        "description":  "Flag bills exceeding ₹2000 as high-value",
        "triggered":    high_usage,
        "status":       "triggered" if high_usage else "monitoring"
    })

    # ── Alert messages (meaningful insights) ───────────────────
    alert_messages = []

    if overdue:
        alert_messages.append(
            f"🚨 OVERDUE: {item.get('name')} was due on {due.strftime('%b %d')} — immediate action required!"
        )
    elif due_soon:
        alert_messages.append(
            f"🔔 Due soon: {item.get('name')} is due in {days_left} day(s) on {due.strftime('%b %d, %Y')}"
        )

    if is_abnormal:
        alert_messages.append(
            f"⚠️ Spike detected: {item.get('name')} increased {increase_pct:+.1f}% "
            f"(₹{prev_amount:.0f} → ₹{amount:.0f}). Possible high usage or billing error."
        )

    if high_usage and not is_abnormal:
        alert_messages.append(
            f"💰 High-value alert: {item.get('name')} is ₹{amount:.0f}, exceeds ₹2000 threshold."
        )

    if budget_warning and high_usage:
        alert_messages.append(
            f"📊 Budget warning: {item.get('name')} is consuming a significant portion of your monthly budget."
        )

    # ── Historical comparison for UI ──────────────────────────
    historical_comparison = {
        "previous_month":   f"₹{prev_amount:.0f}",
        "current_month":    f"₹{amount:.0f}",
        "change":           f"{increase_pct:+.1f}%",
        "trend":            "↑ spike" if increase_pct > 20 else ("↑ increase" if increase_pct > 0 else ("↓ decrease" if increase_pct < 0 else "→ stable")),
        "is_abnormal":      is_abnormal,
        "status":           "🔴 Abnormal" if is_abnormal else ("🟡 High" if high_usage else "🟢 Normal")
    }

    return {
        "type":   "bill",
        "action": "bill_alert",
        "rules_applied":         rules_applied,
        "alert_messages":        alert_messages,
        "historical_comparison": historical_comparison,
        "tracking": {
            "due_date":       due.strftime("%Y-%m-%d"),
            "days_until_due": days_left,
            "due_soon":       due_soon,
            "overdue":        overdue,
            "budget_status":  "high" if high_usage else "within_limit",
            "risk":           risk,
            "status":         "tracked"
        }
    }



# ─────────────────────────────────────────────────────────────
# PURCHASE AUTOMATON
# Simulates: NFT minting with warranty & ownership tracking
# ─────────────────────────────────────────────────────────────
def _handle_purchase(item: dict) -> dict:
    params         = item.get("nft_params", {})
    warranty_mo    = int(params.get("warranty_months", 12))
    item_name      = params.get("item_name", item.get("name", "Purchase"))
    amount         = item.get("amount", "0")
    currency       = item.get("currency", "INR")

    now              = get_simulated_now()
    warranty_expiry  = now + timedelta(days=warranty_mo * 30)
    grace_start      = warranty_expiry - timedelta(days=30)   # 30-day alert window
    days_to_expiry   = (warranty_expiry - now).days
    ownership_id     = str(uuid.uuid4())

    # Warranty lifecycle state
    if now >= warranty_expiry:
        warranty_state = "expired"
    elif now >= grace_start:
        warranty_state = "grace_period"
    else:
        warranty_state = "active"

    rules_applied = [
        {
            "rule":         "OWNERSHIP_PROOF",
            "description":  "NFT minted as immutable on-chain proof of ownership",
            "triggered":    True,
            "status":       "executed",
            "ownership_id": ownership_id
        },
        {
            "rule":         "WARRANTY_TRACKING",
            "description":  f"Warranty active for {warranty_mo} months from purchase date",
            "expiry_date":  warranty_expiry.strftime("%Y-%m-%d"),
            "days_remaining": days_to_expiry,
            "triggered":    False,
            "status":       warranty_state
        },
        {
            "rule":         "WARRANTY_EXPIRY_ALERT",
            "description":  "Alert 30 days before warranty expires",
            "trigger_date": grace_start.strftime("%Y-%m-%d"),
            "triggered":    warranty_state == "grace_period",
            "status":       "triggered" if warranty_state == "grace_period" else "scheduled"
        },
        {
            "rule":         "METADATA_STORAGE",
            "description":  "Purchase metadata stored immutably in NFT token URI",
            "triggered":    True,
            "status":       "stored"
        }
    ]

    # Alert messages for UI
    alert_messages = []
    if warranty_state == "grace_period":
        alert_messages.append(
            f"⚠️ Warranty expiring soon for {item_name} — expires {warranty_expiry.strftime('%b %d, %Y')}"
        )
    elif warranty_state == "expired":
        alert_messages.append(
            f"🔴 Warranty has expired for {item_name}"
        )

    return {
        "type":   "purchase",
        "action": "mint_nft",
        "rules_applied":  rules_applied,
        "alert_messages": alert_messages,
        "nft_details": {
            "item_name":        item_name,
            "amount":           amount,
            "currency":         currency,
            "purchase_date":    now.strftime("%Y-%m-%d"),
            "purchase_time":    now.strftime("%H:%M:%S UTC"),
            "warranty_months":  warranty_mo,
            "warranty_expiry":  warranty_expiry.strftime("%Y-%m-%d"),
            "warranty_state":   warranty_state,
            "grace_period_start": grace_start.strftime("%Y-%m-%d"),
            "days_to_expiry":   days_to_expiry,
            "ownership_id":     ownership_id,
            "ownership_status": "verified",
            "status":           "minted"
        }
    }
