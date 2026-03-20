"""
AutoChain Automation Engine — Enhanced with Time Simulation
Subscriptions: renewal-cycle alerts (email per 30-day cycle), post-revival confirmation
Bills: due-date alerts, high-usage detection, budget warnings
Purchases: warranty tracking, ownership proof + first-mint email
"""
from datetime import datetime, timedelta
from typing import Any
import uuid

from config import get_simulated_now
from mail_service import send_email


def apply_rules(item: dict, read_only: bool = False, increment_renewal: bool = False) -> dict:
    """Dispatch to the correct automaton based on item type."""
    t = item.get("type", "")
    if t == "subscription":
        return _handle_subscription(item, read_only=read_only, increment_renewal=increment_renewal)
    elif t == "bill":
        return _handle_bill(item, read_only=read_only)
    elif t == "purchase":
        return _handle_purchase(item, read_only=read_only)
    return {"status": "unknown", "message": "No rules applied — unknown type"}


# ─────────────────────────────────────────────────────────────
# SUBSCRIPTION AUTOMATON
#
# Timeline for "Netflix 499 for 3 months":
#   Day  0  → registered, NO email
#   Day +30 → simulate forward  → renewal 1  → "Pay or Cancel" email
#   Day +60 → simulate forward  → renewal 2  → "Pay or Cancel" email
#   Day +90 → simulate forward  → renewal 3  → "Subscription Expired — Renew or Cancel" email
#   PAY NOW → /simulate/pay     → "Subscription Renewed ✅" email
# ─────────────────────────────────────────────────────────────
def _handle_subscription(item: dict, read_only: bool = False, increment_renewal: bool = False) -> dict:
    from storage import get_item_history, increment_renewal_count

    params         = item.get("contract_params", {})
    duration_mo    = int(item.get("duration") or params.get("duration_months") or 3)
    alert_days     = params.get("alert_days_before", 3)

    now = get_simulated_now()

    # ── Resolve subscription start & renewal_count from storage ──────────
    item_key  = item.get("bill_key") or item.get("name") or item.get("key") or ""
    persisted = get_item_history("subscription", item_key.lower()) if item_key else None

    if persisted:
        # Use the stored start time (when the user first registered this sub)
        sub_start_str = persisted.get("subscription_start") or persisted.get("last_updated")
        duration_mo   = persisted.get("duration_months") or duration_mo
        renewal_count = persisted.get("renewal_count", 0)
    else:
        sub_start_str = item.get("last_updated")
        renewal_count = 0

    if sub_start_str:
        try:
            start_time = datetime.fromisoformat(sub_start_str.replace("Z", ""))
        except (ValueError, TypeError):
            start_time = now
    else:
        start_time = now

    # ── If this call is from "simulate forward", tick renewal_count up ────
    if increment_renewal and not read_only and item_key:
        renewal_count = increment_renewal_count("subscription", item_key.lower())

    # ── Calculate cycle boundaries ────────────────────────────────────────
    total_duration_days = duration_mo * 30          # e.g. 90 for 3-month plan
    expiry_time         = start_time + timedelta(days=total_duration_days)

    # Which renewal window is the user in?
    # renewal_count=1 → first 30-day cycle complete, etc.
    current_cycle_end   = start_time + timedelta(days=renewal_count * 30)
    prev_cycle_end      = start_time + timedelta(days=max(0, renewal_count - 1) * 30)
    elapsed_days        = (now - start_time).days

    # ── Status logic ──────────────────────────────────────────────────────
    is_expired   = now >= expiry_time
    is_last_cycle = renewal_count >= duration_mo   # e.g. 3 cycles for 3-month plan
    renewal_due  = renewal_count > 0 and (now >= current_cycle_end or increment_renewal)

    if is_expired or is_last_cycle:
        contract_status = "expired"
        status_reason   = f"Subscription reached end of {duration_mo}-month term"
    elif renewal_due:
        contract_status = "renewal_due"
        status_reason   = f"Renewal {renewal_count} of {duration_mo} due"
    else:
        contract_status = "active"
        status_reason   = "Contract running — awaiting first billing cycle"

    # ── Build rules_applied ───────────────────────────────────────────────
    rules_applied = [{
        "rule":        "RENEWAL_ALERT",
        "description": f"Alert at end of each 30-day billing cycle",
        "triggered":   contract_status in ("renewal_due", "expired"),
        "status":      "triggered" if contract_status in ("renewal_due", "expired") else "scheduled",
        "renewal_count": renewal_count,
        "duration_months": duration_mo,
    }]

    # ── Alert messages for UI and email ──────────────────────────────────
    alert_messages = []
    name_val         = item.get("name") or item.get("key") or "Subscription"
    display_name     = name_val.capitalize() if isinstance(name_val, str) else name_val
    display_amount   = item.get("amount") or item.get("current_amount") or "0"
    display_currency = item.get("currency") or "INR"
    sim_time_str     = now.strftime("%Y-%m-%d %H:%M:%S")

    if not read_only and (renewal_due or is_expired) and item_key:
        if is_expired or is_last_cycle:
            # ── Expiry / Final renewal email ──────────────────────────────
            subject = f"ACTION REQUIRED: {display_name} Subscription Expired"
            body = (
                f"--- AutoChain Security Alert ---\n"
                f"Simulated Date/Time: {sim_time_str}\n\n"
                f"Your {display_name} subscription has reached the end of its "
                f"{duration_mo}-month term.\n"
                f"Amount: {display_currency} {display_amount}\n\n"
                f"Please choose an action:\n"
                f"1. [ RENEW ] - Start a new {duration_mo}-month subscription contract.\n"
                f"2. [ CANCEL ] - Let the subscription lapse.\n\n"
                f"If no action is taken, the autonomous agent will follow your default governance rules."
            )
            alert_messages.append(f"🔴 Subscription expired: {display_name} — {duration_mo}-month term complete")
            alert_messages.append("📧 Simulation: Expiry 'Renew or Cancel' alert sent to user")
            send_email(subject, body)
        else:
            # ── Mid-term renewal email ────────────────────────────────────
            next_cycle_end = start_time + timedelta(days=(renewal_count + 1) * 30)
            subject = f"ACTION REQUIRED: {display_name} Subscription Renewal (Cycle {renewal_count}/{duration_mo})"
            body = (
                f"--- AutoChain Security Alert ---\n"
                f"Simulated Date/Time: {sim_time_str}\n\n"
                f"Your {display_name} subscription billing cycle {renewal_count} of {duration_mo} is complete.\n"
                f"Amount: {display_currency} {display_amount}\n\n"
                f"Next billing date: {next_cycle_end.strftime('%b %d, %Y')}\n\n"
                f"Please choose an action:\n"
                f"1. [ PAY NOW ] - Authorize the smart contract to proceed with payment.\n"
                f"2. [ CANCEL ] - Terminate the subscription before the next billing cycle.\n\n"
                f"If no action is taken, the autonomous agent will follow your default governance rules."
            )
            alert_messages.append(f"⚠️ Renewal cycle {renewal_count}/{duration_mo} complete for {display_name}")
            alert_messages.append("📧 Simulation: Renewal 'Cancel or Pay' alert sent to user")
            send_email(subject, body)

    return {
        "type":   "subscription",
        "action": "create_subscription_contract",
        "rules_applied":  rules_applied,
        "alert_messages": alert_messages,
        "time_simulation": {
            "simulated_now":       now.strftime("%Y-%m-%d %H:%M:%S UTC"),
            "start_time":          start_time.strftime("%Y-%m-%d"),
            "expiry_time":         expiry_time.strftime("%Y-%m-%d"),
            "elapsed_days":        elapsed_days,
            "renewal_count":       renewal_count,
            "duration_months":     duration_mo,
            "days_until_expiry":   max(0, (expiry_time - now).days),
        },
        "contract_lifecycle": {
            "created":         start_time.strftime("%Y-%m-%d"),
            "expiry":          expiry_time.strftime("%Y-%m-%d"),
            "status":          contract_status,
            "status_reason":   status_reason,
            "duration_months": duration_mo,
            "renewal_count":   renewal_count,
        }
    }


def send_renewal_confirmation(item_key: str, display_name: str,
                               display_amount: str, display_currency: str, duration_mo: int):
    """Send a 'Subscription Renewed' confirmation email after user pays."""
    from config import get_simulated_now
    now = get_simulated_now()
    sim_time_str = now.strftime("%Y-%m-%d %H:%M:%S")
    new_expiry   = now + timedelta(days=duration_mo * 30)

    subject = f"✅ Subscription Renewed: {display_name}"
    body = (
        f"--- AutoChain Confirmation ---\n"
        f"Simulated Date/Time: {sim_time_str}\n\n"
        f"Great news! Your {display_name} subscription has been successfully renewed.\n"
        f"Amount Charged: {display_currency} {display_amount}\n"
        f"New Term: {duration_mo} month(s)\n"
        f"Next Renewal Date: {new_expiry.strftime('%b %d, %Y')}\n\n"
        f"The smart contract has been re-activated. "
        f"AutoChain will monitor and alert you before the next billing cycle.\n\n"
        f"Thank you for using AutoChain."
    )
    send_email(subject, body)


# ─────────────────────────────────────────────────────────────
# BILL AUTOMATON
# ─────────────────────────────────────────────────────────────
def _handle_bill(item: dict, read_only: bool = False) -> dict:
    params       = item.get("bill_params", {})
    threshold    = params.get("alert_threshold", 80)
    amount       = float(item.get("amount") or item.get("current_amount") or 0)
    prev_amount  = float(params.get("previous_amount") or item.get("previous_amount") or amount)
    risk         = item.get("risk", "normal")
    is_abnormal  = item.get("is_abnormal", False) or params.get("is_abnormal", False)
    increase_pct = float(item.get("increase_pct") or params.get("increase_pct") or 0)

    # ── Due-date simulation ────────────────────────────────────
    now = get_simulated_now()
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
    budget_warning = amount >= (threshold / 100) * (amount * 1.25)

    # ── Rules ──────────────────────────────────────────────────
    rules_applied = []
    alert_trigger = due - timedelta(days=3)
    rules_applied.append({
        "rule":         "DUE_DATE_ALERT",
        "description":  f"Send alert 3 days before due date — due on {due.strftime('%b %d, %Y')}",
        "trigger_date": alert_trigger.strftime("%Y-%m-%d"),
        "triggered":    due_soon or overdue,
        "days_remaining": days_left,
        "status":       "triggered" if (due_soon or overdue) else "scheduled"
    })
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
    rules_applied.append({
        "rule":         "BUDGET_WARNING",
        "description":  f"Warn when bill exceeds {threshold}% of monthly budget",
        "threshold_percent": threshold,
        "triggered":    budget_warning and high_usage,
        "status":       "triggered" if (budget_warning and high_usage) else "monitoring"
    })
    rules_applied.append({
        "rule":         "HIGH_USAGE_FLAG",
        "description":  "Flag bills exceeding ₹2000 as high-value",
        "triggered":    high_usage,
        "status":       "triggered" if high_usage else "monitoring"
    })

    # ── Alert messages ─────────────────────────────────────────
    alert_messages = []
    name_val         = item.get("name") or item.get("key") or "Bill"
    display_name     = name_val.capitalize() if isinstance(name_val, str) else name_val
    display_amount   = item.get("amount") or item.get("current_amount") or "0"
    display_currency = item.get("currency") or "INR"

    if overdue:
        alert_messages.append(
            f"🚨 OVERDUE: {display_name} (₹{amount:.0f}) was due on {due.strftime('%b %d')} — immediate action required!"
        )
        alert_messages.append("📧 Simulation: Critical overdue notice sent to user")
    elif due_soon:
        alert_messages.append(
            f"🔔 Due soon: {display_name} (₹{amount:.0f}) is due in {days_left} day(s) on {due.strftime('%b %d, %Y')}"
        )
        alert_messages.append("📧 Simulation: Upcoming bill reminder email sent to user")

    if is_abnormal:
        alert_messages.append(
            f"🔔 ON-CHAIN SPIKE: {display_name} increased by {increase_pct:+.1f}% (₹{prev_amount:.0f} → ₹{amount:.0f})"
        )
    if high_usage:
        alert_messages.append(
            f"🔔 ON-CHAIN ALERT: {display_name} amount (₹{amount:.0f}) exceeds high-usage threshold of 2000 INR"
        )
    if budget_warning and high_usage:
        alert_messages.append(
            f"🔔 ON-CHAIN WARNING: {display_name} is consuming more than {threshold}% of your estimated monthly budget"
        )

    # ── Email ──────────────────────────────────────────────────
    if not read_only and (overdue or due_soon or is_abnormal or high_usage or budget_warning):
        analysis_subject = f"ACTION REQUIRED: {display_name} Bill Payment Alert"
        sim_time_str = now.strftime("%Y-%m-%d %H:%M:%S")
        analysis_body = (
            f"--- AutoChain Security Alert ---\n"
            f"Simulated Date/Time: {sim_time_str}\n\n"
            f"Final Analysis for {display_name}:\n"
        )
        for msg in alert_messages:
            if "📧" not in msg:
                analysis_body += f"- {msg}\n"
        analysis_body += (
            f"\nAmount: {display_currency} {display_amount}\n"
            f"Due Date: {due.strftime('%b %d, %Y')}\n\n"
            f"Please choose an action:\n"
            f"1. [ PAY NOW ] - Execute the payment on-chain.\n"
            f"2. [ CANCEL/DISPUTE ] - Halt payment and review charges.\n\n"
            f"Scheduled Action: Bill Tracked & Monitored on Polkadot Hub."
        )
        send_email(analysis_subject, analysis_body)

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
# ─────────────────────────────────────────────────────────────
def _handle_purchase(item: dict, read_only: bool = False) -> dict:
    params         = item.get("nft_params", {})
    warranty_mo    = int(params.get("warranty_months", 12))

    name_val         = params.get("item_name") or item.get("name") or item.get("key") or "Purchase"
    display_name     = name_val.capitalize() if isinstance(name_val, str) else name_val
    display_amount   = item.get("amount") or item.get("current_amount") or "0"
    display_currency = item.get("currency") or "INR"

    item_name = display_name
    amount    = display_amount
    currency  = display_currency

    now = get_simulated_now()

    last_updated = item.get("last_updated")
    if last_updated:
        try:
            start_time = datetime.fromisoformat(last_updated.replace("Z", ""))
        except (ValueError, TypeError):
            start_time = now
    else:
        start_time = now

    warranty_expiry  = start_time + timedelta(days=warranty_mo * 30)
    grace_start      = warranty_expiry - timedelta(days=30)
    days_to_expiry   = (warranty_expiry - now).days
    ownership_id     = str(uuid.uuid4())

    # Detect first-time mint: no last_updated stored means brand-new item
    is_first_mint    = last_updated is None

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

    alert_messages = []
    if warranty_state == "grace_period":
        alert_messages.append(
            f"⚠️ Warranty expiring soon for {item_name} — expires {warranty_expiry.strftime('%b %d, %Y')}"
        )
    elif warranty_state == "expired":
        alert_messages.append(f"🔴 Warranty has expired for {item_name}")

    # ── First-mint confirmation email ─────────────────────────
    if not read_only and is_first_mint:
        sim_time_str = now.strftime("%Y-%m-%d %H:%M:%S")
        subject = f"✅ Purchase Confirmed & NFT Minted: {item_name}"
        body = (
            f"--- AutoChain Purchase Receipt ---\n"
            f"Simulated Date/Time: {sim_time_str}\n\n"
            f"Your purchase has been recorded on-chain as an NFT.\n\n"
            f"Item: {item_name}\n"
            f"Amount: {currency} {amount}\n"
            f"Ownership ID: {ownership_id}\n"
            f"Warranty: {warranty_mo} month(s) — valid until {warranty_expiry.strftime('%b %d, %Y')}\n\n"
            f"AutoChain will alert you 30 days before your warranty expires.\n"
            f"Your ownership is now immutably stored on the blockchain."
        )
        send_email(subject, body)
        alert_messages.append("📧 Simulation: Purchase NFT confirmation sent to user")

    return {
        "type":   "purchase",
        "action": "mint_nft",
        "rules_applied":  rules_applied,
        "alert_messages": alert_messages,
        "nft_details": {
            "item_name":          item_name,
            "amount":             amount,
            "currency":           currency,
            "purchase_date":      now.strftime("%Y-%m-%d"),
            "purchase_time":      now.strftime("%H:%M:%S UTC"),
            "warranty_months":    warranty_mo,
            "warranty_expiry":    warranty_expiry.strftime("%Y-%m-%d"),
            "warranty_state":     warranty_state,
            "grace_period_start": grace_start.strftime("%Y-%m-%d"),
            "days_to_expiry":     days_to_expiry,
            "ownership_id":       ownership_id,
            "ownership_status":   "verified",
            "status":             "minted"
        }
    }


def send_transaction_completed_email(item: dict, tx_hash: str):
    """Send an email receipt after a transaction is confirmed on-chain."""
    from config import get_simulated_now
    now = get_simulated_now()
    sim_time_str = now.strftime("%Y-%m-%d %H:%M:%S")
    
    item_type = item.get("type", "transaction")
    name_val = item.get("name") or item.get("key") or "Item"
    display_name = name_val.capitalize() if isinstance(name_val, str) else name_val
    amount = item.get("amount") or item.get("current_amount") or "0"
    currency = item.get("currency") or "INR"
    
    subject = f"✅ Transaction Successful: {display_name}"
    
    body = (
        f"--- AutoChain Transaction Receipt ---\n"
        f"Simulated Date/Time: {sim_time_str}\n\n"
        f"Your {item_type} payment has been successfully processed and confirmed on-chain.\n\n"
        f"Item: {display_name}\n"
        f"Amount Paid: {currency} {amount}\n"
        f"Transaction Hash: {tx_hash}\n\n"
    )
    
    if item_type == "subscription":
        duration_mo = item.get("duration") or 3
        body += f"Subscription Term: {duration_mo} month(s)\n"
    elif item_type == "bill":
        body += f"Thank you for keeping your utility bills up to date. This bill has been registered on-chain.\n"
    elif item_type == "purchase":
        body += f"Your digital receipt and warranty have been minted as an NFT.\n"
        
    body += "\nAutoChain secures your financial assets on Polkadot Hub."
    
    send_email(subject, body)
