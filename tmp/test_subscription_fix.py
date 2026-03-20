"""
Quick functional test for the subscription email fix (ASCII-only output).
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Mock email so we don't actually send
sent_emails = []
import mail_service
mail_service.send_email = lambda subj, body: sent_emails.append(subj)

from ai_agent import _extract_duration_months
from storage import update_item_history, increment_renewal_count, get_item_history, save_history
from automation import _handle_subscription

# Reset history
save_history({})

# 1. Duration parsing
tests = [
    ("netflix for 499 for 3 months", 3),
    ("spotify monthly",              1),
    ("amazon prime for 1 year",     12),
    ("youtube premium 6 months",     6),
    ("hotstar 2 years",             24),
]
for text, expected in tests:
    got = _extract_duration_months(text)
    assert got == expected, f"FAIL: '{text}' -> {got}, expected {expected}"
print("[PASS] Duration parsing: all 5 cases correct")

# 2. Storage fields
update_item_history("subscription", "netflix", "499",
                    subscription_start="2026-01-01T00:00:00", duration_months=3)
rec = get_item_history("subscription", "netflix")
assert rec["subscription_start"] == "2026-01-01T00:00:00"
assert rec["duration_months"] == 3
assert rec["renewal_count"]   == 0
print("[PASS] Storage: subscription_start, duration_months, renewal_count=0 stored")

# 3. Increment
for i in range(1, 4):
    cnt = increment_renewal_count("subscription", "netflix")
    assert cnt == i, f"FAIL: expected {i}, got {cnt}"
print("[PASS] Storage: renewal_count increments 1->2->3")

# 4. No email on Day 0
save_history({})
update_item_history("subscription", "netflixtest", "499",
                    subscription_start="2026-01-01T00:00:00", duration_months=3)
sent_emails.clear()
_handle_subscription({
    "type": "subscription", "name": "Netflixtest", "bill_key": "netflixtest",
    "amount": "499", "currency": "INR",
    "contract_params": {"duration_months": 3, "alert_days_before": 3},
}, read_only=False, increment_renewal=False)
assert len(sent_emails) == 0, f"FAIL: email sent on Day 0 -- {sent_emails}"
print("[PASS] No email on Day 0 (subscription just registered)")

# 5. Cycle 1 email
sent_emails.clear()
item = {"type": "subscription", "name": "Netflixtest", "bill_key": "netflixtest",
        "amount": "499", "currency": "INR",
        "contract_params": {"duration_months": 3, "alert_days_before": 3}}
_handle_subscription(item, read_only=False, increment_renewal=True)
assert len(sent_emails) == 1, f"FAIL: expected 1 email, got {len(sent_emails)}"
assert "Cycle 1/3" in sent_emails[0], f"FAIL: subject wrong: {sent_emails[0]}"
print(f"[PASS] Email 1: {sent_emails[0]}")

# 6. Cycle 2 email
sent_emails.clear()
_handle_subscription(item, read_only=False, increment_renewal=True)
assert len(sent_emails) == 1
print(f"[PASS] Email 2: {sent_emails[0]}")

# 7. Cycle 3 / expiry email
sent_emails.clear()
_handle_subscription(item, read_only=False, increment_renewal=True)
assert len(sent_emails) == 1
assert "Expired" in sent_emails[0], f"FAIL: expected expiry email, got: {sent_emails[0]}"
print(f"[PASS] Email 3 (expiry): {sent_emails[0]}")

print("\n[ALL TESTS PASSED] No spam, correct timing, correct renewal cycle")
