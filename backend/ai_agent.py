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
  "reasoning": [
    "<short bullet point 1>",
    "<short bullet point 2>",
    "<short bullet point 3>"
  ],
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
  "reasoning": [
    "<short explanation of what was found>"
  ],
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
  "reasoning": [
    "Proof of ownership required",
    "On-chain warranty enabled"
  ],
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
      "reasoning": ["<sentence 1>", "<sentence 2>"],
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
        
        # Deduplication
        seen = set()
        deduped = []
        for item in result.get("items", []):
            # Normalise
            if "action" not in item and "decision" in item:
                item["action"] = item["decision"]
            if "decision" not in item and "action" in item:
                item["decision"] = item["action"]
            
            # Form unique key
            key = (item.get("name", "").lower(), item.get("type", ""), item.get("amount", ""))
            if key not in seen:
                seen.add(key)
                deduped.append(item)
        
        result.setdefault("items", [])
        result["items"] = deduped
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

    # Regex patterns to extract amount from raw text dynamically
    INR_PATTERN = re.compile(r'[₹rR][sS]?\.?\s*(\d[\d,]*(?:\.\d{1,2})?)')
    USD_PATTERN = re.compile(r'\$\s*(\d[\d,]*(?:\.\d{1,2})?)')

    def _extract_amts(kw, def_curr, def_prev, currency):
        idx = text_lower.find(kw)
        if idx != -1:
            seg = user_text[idx:idx+120]
            matches = INR_PATTERN.findall(seg) if currency == 'INR' else USD_PATTERN.findall(seg)
            if len(matches) >= 2:
                return matches[0].replace(",", ""), matches[1].replace(",", "")
            elif len(matches) == 1:
                return matches[0].replace(",", ""), def_prev
        return def_curr, def_prev

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
            amount, _ = _extract_amts(keyword, amount, "0", currency)
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
                "reasoning": [
                    f"Recurring {freq} subscription detected (Risk: {risk})",
                    "Classified as autonomous subscription contract",
                    "Configured auto-cancel and auto-pause bounds"
                ],
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
            amount, prev_amount = _extract_amts(keyword, amount, prev_amount, currency)
            curr_amt = float(amount)
            prev_amt = float(prev_amount)
            increase_pct = ((curr_amt - prev_amt) / prev_amt * 100) if prev_amt > 0 else 0
            is_abnormal = increase_pct > 20   # >20% spike = abnormal
            is_high_value = curr_amt > 2000
            bill_risk = "high" if (is_high_value or is_abnormal) else "normal"

            due_date = (today + timedelta(days=due_offset)).strftime("%Y-%m-%d")

            # Build reason with historical insight
            if is_abnormal and is_high_value:
                reasoning = [
                    f"⚠️ HIGH ALERT: {increase_pct:.0f}% abnormal spike detected",
                    f"Prior usage: ₹{prev_amt:.0f} → Current: ₹{curr_amt:.0f}",
                    "Exceeds ₹2000 mandatory review threshold"
                ]
            elif is_abnormal:
                reasoning = [
                    f"⚠️ Abnormal usage spike: {increase_pct:.0f}% higher than last month",
                    f"Prior usage: ₹{prev_amt:.0f} → Current: ₹{curr_amt:.0f}",
                    "Triggered bill verification rules"
                ]
            elif is_high_value:
                reasoning = [
                    f"High-value utility expense (₹{curr_amt:.0f})",
                    "Exceeds standard ₹2000 monitoring threshold",
                    "No abnormal spike vs previous period"
                ]
            else:
                reasoning = [
                    f"Nominal utility expense (₹{curr_amt:.0f})",
                    f"Matched with historical usage (₹{prev_amt:.0f})",
                    f"Due for settlement by {due_date}"
                ]

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
                "reasoning": reasoning,
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

    seen_purchase_keys = set()
    for keyword, (name, default_amount, currency) in PURCHASES.items():
        if keyword in text_lower and keyword not in seen_purchase_keys:
            seen_purchase_keys.add(keyword)
            amount, _ = _extract_amts(keyword, default_amount, "0", currency)

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
                "reasoning": [
                    f"One-time asset purchase detected ({'₹' if currency == 'INR' else '$'}{amount})",
                    "Eligible for ERC-721 Proof of Ownership receipt",
                    "Activating 12-month automated warranty tracking"
                ],
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
            "reasoning": [
                "Demo mode inferred unknown pattern",
                "Defaulting to autonomous contract structure"
            ],
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

    # Final Deduplication pass for mock
    seen = set()
    deduped = []
    for item in items:
        key = (item.get("name", "").lower(), item.get("type", ""), item.get("amount", ""))
        if key not in seen:
            seen.add(key)
            deduped.append(item)

    return {
        "success": True,
        "data": {
            "items": deduped if deduped is not None else [],
            "summary": (
                f"Found {n_sub} subscription(s), {n_bill} bill(s), {n_purch} purchase(s). "
                f"Ready to execute {len(items)} blockchain action(s)."
            ),
            "autonomous_recommended": len(items) > 0
        },
        "model": "mock-agent-v2 (demo mode — add OPENAI_API_KEY for real AI)"
    }
