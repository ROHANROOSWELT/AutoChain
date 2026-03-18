"""
AutoChain AI Agent — Enhanced Subscription, Bill & Purchase Module
Extraction + Decision Engine with risk levels, durations, and structured outputs
"""
import os
import re
import json
from datetime import datetime
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

# ─────────────────────────────────────────────
# SYSTEM PROMPTS — one per step
# ─────────────────────────────────────────────

EXTRACTION_PROMPT = """You are AutoChain Extractor — an AI that reads financial text and pulls out structured financial events.

OUTPUT RULES (JSON only, no prose):
Return a JSON object with key "items" containing a list. For each financial event detected:

SUBSCRIPTIONS — recurring payments (monthly / weekly / yearly):
{
  "type": "subscription",
  "name": "<service name>",
  "amount": "<number only>",
  "currency": "INR or USD",
  "frequency": "monthly | weekly | yearly",
  "raw_text": "<matching phrase from input>"
}
Examples: Netflix ₹499/month, Spotify $9.99/month, annual plan $99/year

BILLS — utility / service bills (electricity, internet, mobile, water, gas):
{
  "type": "bill",
  "name": "<bill name>",
  "amount": "<number only>",
  "currency": "INR or USD",
  "due_date": "<date if mentioned, else null>",
  "raw_text": "<matching phrase>"
}

PURCHASES — one-time buys, receipts, orders:
{
  "type": "purchase",
  "name": "<item name>",
  "amount": "<number only>",
  "currency": "INR or USD",
  "raw_text": "<matching phrase>"
}

Extract ALL events found. Return {"items": [...]}"""

DECISION_PROMPT = """You are AutoChain Decision Engine — given extracted financial items, you decide what blockchain action to take and assess risk.

For SUBSCRIPTIONS → action must be "create_subscription_contract":
{
  "action": "create_subscription_contract",
  "duration": "<integer months, default 3>",
  "risk": "low | medium | high",
  "reason": "<one sentence explanation>",
  "contract_params": {
    "duration_months": <int>,
    "auto_cancel": true,
    "auto_pause_if_inactive": true,
    "alert_days_before": 3
  }
}
Risk rules: < ₹200/$5 = low, ₹200–₹1000/$5–$25 = medium, > ₹1000/$25 = high

For BILLS → action must be "track_bill":
{
  "action": "track_bill",
  "risk": "normal | high",
  "reason": "<one sentence>",
  "bill_params": {
    "due_date": "<estimated or null>",
    "alert_threshold": 80,
    "budget_limit": null
  }
}
Risk: if amount > ₹2000/$50 mark high

For PURCHASES → action must be "mint_nft":
{
  "action": "mint_nft",
  "reason": "Proof of ownership",
  "nft_params": {
    "item_name": "<name>",
    "warranty_months": 12
  }
}

Return {"decisions": [...]} — one decision object per item, same order as input."""

COMBINED_SYSTEM_PROMPT = """You are AutoChain, an autonomous AI financial agent.

Given raw financial text, you will:
1. Extract all financial events (subscriptions, bills, purchases)
2. Make a blockchain action decision for each with risk assessment

OUTPUT FORMAT (strict JSON):
{
  "items": [
    {
      "type": "subscription | bill | purchase",
      "name": "",
      "amount": "",
      "currency": "INR | USD",
      "frequency": "monthly | weekly | yearly | one-time",
      "raw_text": "",
      "decision": "create_subscription_contract | track_bill | mint_nft",
      "action": "create_subscription_contract | track_bill | mint_nft",
      "duration": "<months if subscription, else null>",
      "risk": "low | medium | high | normal",
      "reason": "<one sentence>",
      "contract_params": { "duration_months": 3, "auto_cancel": true, "auto_pause_if_inactive": true, "alert_days_before": 3 },
      "bill_params": { "due_date": null, "alert_threshold": 80, "budget_limit": null },
      "nft_params": { "item_name": "", "warranty_months": 12 }
    }
  ],
  "summary": "Found X subscription(s), Y bill(s), Z purchase(s). Ready to execute N blockchain action(s).",
  "autonomous_recommended": true
}

SUBSCRIPTION risk: amount < 200 INR/$5 = low, 200-1000 INR/$5-25 = medium, >1000 INR/$25 = high
BILL risk: normal unless amount > 2000 INR/$50 → high
PURCHASE default: mint_nft with 12-month warranty

Only include relevant param blocks per type. Return JSON only."""


def analyze_text(user_text: str) -> dict:
    """Run AI analysis — real OpenAI or mock fallback."""
    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key or api_key.startswith("your_"):
        return _mock_analysis(user_text)

    try:
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": COMBINED_SYSTEM_PROMPT},
                {"role": "user",   "content": f"Analyze this financial data:\n\n{user_text}"}
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
            max_tokens=2000
        )
        result = json.loads(response.choices[0].message.content)
        # Normalise: ensure both `decision` and `action` fields exist
        for item in result.get("items", []):
            if "action" not in item and "decision" in item:
                item["action"] = item["decision"]
            if "decision" not in item and "action" in item:
                item["decision"] = item["action"]
        return {"success": True, "data": result, "model": "gpt-4o-mini"}

    except Exception as e:
        return _mock_analysis(user_text)


# ─────────────────────────────────────────────
# MOCK ANALYSIS (no API key needed)
# ─────────────────────────────────────────────

def _risk_for_amount(amount_str: str, currency: str) -> str:
    try:
        amt = float(amount_str)
    except Exception:
        return "low"
    if currency == "INR":
        if amt < 200:   return "low"
        if amt <= 1000: return "medium"
        return "high"
    else:  # USD
        if amt < 5:    return "low"
        if amt <= 25:  return "medium"
        return "high"


def _mock_analysis(user_text: str) -> dict:
    text_lower = user_text.lower()
    items: list[dict] = []

    # ── Subscriptions ──────────────────────────────────────────────────
    SUBS = {
        "netflix":          ("Netflix",               "499",  "INR", "monthly"),
        "spotify":          ("Spotify",               "199",  "INR", "monthly"),
        "amazon prime":     ("Amazon Prime",          "299",  "INR", "monthly"),
        "prime video":      ("Prime Video",           "299",  "INR", "monthly"),
        "youtube premium":  ("YouTube Premium",       "189",  "INR", "monthly"),
        "hotstar":          ("Disney+ Hotstar",       "299",  "INR", "monthly"),
        "notion":           ("Notion",                "10",   "USD", "monthly"),
        "github":           ("GitHub Pro",            "4",    "USD", "monthly"),
        "adobe":            ("Adobe Creative Cloud",  "54.99","USD", "monthly"),
        "chatgpt":          ("OpenAI ChatGPT Plus",   "20",   "USD", "monthly"),
        "openai":           ("OpenAI ChatGPT Plus",   "20",   "USD", "monthly"),
        "figma":            ("Figma",                 "12",   "USD", "monthly"),
        "slack":            ("Slack Pro",             "7.25", "USD", "monthly"),
        "zoom":             ("Zoom Pro",              "15",   "USD", "monthly"),
        "dropbox":          ("Dropbox Plus",          "11.99","USD", "monthly"),
        "microsoft 365":    ("Microsoft 365",         "6.99", "USD", "monthly"),
        "apple music":      ("Apple Music",           "99",   "INR", "monthly"),
        "swiggy one":       ("Swiggy One",            "179",  "INR", "monthly"),
        "zomato pro":       ("Zomato Pro",            "149",  "INR", "monthly"),
    }

    for keyword, (name, amount, currency, freq) in SUBS.items():
        if keyword in text_lower:
            risk = _risk_for_amount(amount, currency)
            items.append({
                "type": "subscription",
                "name": name,
                "amount": amount,
                "currency": currency,
                "frequency": freq,
                "raw_text": f"{name} {currency} {amount}/{freq}",
                "decision": "create_subscription_contract",
                "action": "create_subscription_contract",
                "duration": "3",
                "risk": risk,
                "reason": (
                    f"Recurring {freq} subscription of {'₹' if currency=='INR' else '$'}{amount} detected. "
                    f"Risk level: {risk}. Creating autonomous smart contract with auto-cancel after 3 months, "
                    f"auto-pause if inactive, and renewal alert 3 days before each cycle."
                ),
                "contract_params": {
                    "duration_months": 3,
                    "auto_cancel": True,
                    "auto_pause_if_inactive": True,
                    "alert_days_before": 3
                }
            })

    # ── Bills ──────────────────────────────────────────────────────────
    # Each entry: keyword → (name, current_amount, previous_amount, currency, due_offset_days)
    BILLS = {
        "electricity": ("Electricity Bill", "2800", "1500", "INR", 12),
        "internet":    ("Internet Bill",     "999",  "999",  "INR", 18),
        "broadband":   ("Broadband Bill",    "799",  "799",  "INR", 18),
        "mobile":      ("Mobile Bill",       "499",  "499",  "INR", 22),
        "water":       ("Water Bill",        "300",  "300",  "INR", 28),
        "gas":         ("Gas Bill",          "1800", "800",  "INR", 25),
        "wifi":        ("WiFi Bill",         "799",  "799",  "INR", 18),
        "dth":         ("DTH Bill",          "350",  "350",  "INR", 5),
        "landline":    ("Landline Bill",     "250",  "250",  "INR", 20),
        "maintenance": ("Maintenance Bill",  "2500", "2000", "INR", 10),
    }

    from datetime import datetime, timedelta
    today = datetime.utcnow()

    for keyword, (name, amount, prev_amount, currency, due_offset) in BILLS.items():
        if keyword in text_lower:
            curr_amt = float(amount)
            prev_amt = float(prev_amount)
            increase_pct = ((curr_amt - prev_amt) / prev_amt * 100) if prev_amt > 0 else 0
            is_abnormal = increase_pct > 20   # >20% spike = abnormal
            is_high_value = curr_amt > 2000
            bill_risk = "high" if (is_high_value or is_abnormal) else "normal"

            due_date = (today + timedelta(days=due_offset)).strftime("%Y-%m-%d")

            # Build reason with historical insight
            if is_abnormal and is_high_value:
                reason = (
                    f"⚠️ HIGH ALERT: {name} spiked {increase_pct:.0f}% from "
                    f"₹{prev_amt:.0f} to ₹{curr_amt:.0f}. "
                    f"Amount exceeds ₹2000 threshold. Immediate budget review recommended."
                )
            elif is_abnormal:
                reason = (
                    f"⚠️ Abnormal increase detected: {name} rose {increase_pct:.0f}% "
                    f"from ₹{prev_amt:.0f} last month to ₹{curr_amt:.0f} this month. "
                    f"Possible high-usage or billing error."
                )
            elif is_high_value:
                reason = (
                    f"High-value bill: {name} is ₹{curr_amt:.0f}, exceeding the ₹2000 alert threshold. "
                    f"No unusual spike vs last month (₹{prev_amt:.0f})."
                )
            else:
                reason = (
                    f"Regular bill: {name} is ₹{curr_amt:.0f}, consistent with last month "
                    f"(₹{prev_amt:.0f}). Due on {due_date}."
                )

            items.append({
                "type": "bill",
                "name": name,
                "amount": amount,
                "currency": currency,
                "frequency": "monthly",
                "dueDate": due_date,
                "raw_text": f"{name} ₹{amount}",
                "decision": "bill_alert",
                "action": "bill_alert",
                "risk": bill_risk,
                "is_abnormal": is_abnormal,
                "increase_pct": round(increase_pct, 1),
                "previous_amount": prev_amount,
                "reason": reason,
                "bill_params": {
                    "due_date": due_date,
                    "alert_threshold": 80,
                    "budget_limit": None,
                    "previous_amount": prev_amount,
                    "increase_pct": round(increase_pct, 1),
                    "is_abnormal": is_abnormal
                }
            })


    # ── Purchases ──────────────────────────────────────────────────────
    PURCHASES = {
        "iphone":   ("iPhone",         "79999", "INR"),
        "laptop":   ("Laptop",         "58000", "INR"),
        "macbook":  ("MacBook",        "129900","INR"),
        "airpods":  ("AirPods",        "14999", "INR"),
        "samsung":  ("Samsung Phone",  "45000", "INR"),
        "amazon":   ("Amazon Order",   "2499",  "INR"),
        "flipkart": ("Flipkart Order", "1999",  "INR"),
        "bought":   ("Purchase",       "1499",  "INR"),
        "ordered":  ("Purchase",       "1499",  "INR"),
        "receipt":  ("Purchase",       "999",   "INR"),
    }

    # Regex patterns to extract amount from raw text
    INR_PATTERN = re.compile(r'[₹rR][sS]?\.?\s*(\d[\d,]*(?:\.\d{1,2})?)')
    USD_PATTERN = re.compile(r'\$\s*(\d[\d,]*(?:\.\d{1,2})?)')

    seen_purchase_keys: set = set()
    for keyword, (name, default_amount, currency) in PURCHASES.items():
        if keyword in text_lower and keyword not in seen_purchase_keys:
            seen_purchase_keys.add(keyword)

            # Try to extract amount from raw text around the keyword
            amount = default_amount
            if currency == "INR":
                m = INR_PATTERN.search(user_text)
                if m:
                    amount = m.group(1).replace(",", "")
            else:
                m = USD_PATTERN.search(user_text)
                if m:
                    amount = m.group(1).replace(",", "")

            purchase_ts = datetime.utcnow().isoformat() + "Z"
            items.append({
                "type": "purchase",
                "name": name,
                "amount": amount,
                "currency": currency,
                "frequency": "one-time",
                "raw_text": f"{name} ({'₹' if currency == 'INR' else '$'}{amount})",
                "decision": "mint_nft",
                "action": "mint_nft",
                "risk": "low",
                "reason": (
                    f"One-time purchase of {'₹' if currency == 'INR' else '$'}{amount} detected. "
                    f"Minting as ERC-721 NFT Receipt on Polkadot Hub EVM with 12-month warranty tracking "
                    f"and immutable proof of ownership."
                ),
                "nft_params": {
                    "item_name": name,
                    "warranty_months": 12,
                    "timestamp": purchase_ts,
                    "purchase_amount": amount,
                    "currency": currency
                }
            })

    # Default demo item if nothing matched
    if not items:
        items.append({
            "type": "subscription",
            "name": "Demo Service",
            "amount": "9.99",
            "currency": "USD",
            "frequency": "monthly",
            "raw_text": user_text[:80],
            "decision": "create_subscription_contract",
            "action": "create_subscription_contract",
            "duration": "3",
            "risk": "low",
            "reason": "Demo mode: recurring payment pattern inferred. Creating autonomous contract.",
            "contract_params": {
                "duration_months": 3,
                "auto_cancel": True,
                "auto_pause_if_inactive": True,
                "alert_days_before": 3
            }
        })

    n_sub  = sum(1 for i in items if i["type"] == "subscription")
    n_bill = sum(1 for i in items if i["type"] == "bill")
    n_purch= sum(1 for i in items if i["type"] == "purchase")

    return {
        "success": True,
        "data": {
            "items": items,
            "summary": (
                f"Found {n_sub} subscription(s), {n_bill} bill(s), {n_purch} purchase(s). "
                f"Ready to execute {len(items)} blockchain action(s)."
            ),
            "autonomous_recommended": len(items) > 0
        },
        "model": "mock-agent-v2 (demo mode — add OPENAI_API_KEY for real AI)"
    }
