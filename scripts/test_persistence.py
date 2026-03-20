import httpx
import json
import os
import time

BASE_URL = "http://127.0.0.1:8002"

def test_persistence():
    print("🚀 Starting Persistence Test...")
    
    # 1. First Analysis - Initial Baseline
    print("\n--- Phase 1: Initial Analysis ---")
    payload = {"text": "My electricity bill is ₹2000", "autonomous_mode": False}
    resp = httpx.post(f"{BASE_URL}/analyze", json=payload, verify=False)
    if resp.status_code != 200:
        print(f"❌ Analysis failed: {resp.text}")
        return
    
    data = resp.json()
    items = data.get("items", [])
    elec = next((i for i in items if "electricity" in i["name"].lower()), None)
    
    if not elec:
        print("❌ Electricity bill not detected")
        return
    
    print(f"✅ Detected: {elec['name']} - Amount: {elec['amount']}")
    print(f"AI Reasoning: {elec['reasoning'][1]}") # Should show default prior
    
    # 2. Execution - Save to history
    print("\n--- Phase 2: Execution (Saving to History) ---")
    exec_payload = {"items": items, "autonomous_mode": False}
    resp = httpx.post(f"{BASE_URL}/execute", json=exec_payload, verify=False)
    if resp.status_code != 200:
        print(f"❌ Execution failed: {resp.text}")
        return
    print("✅ Execution successful. History should be updated.")

    # 3. Second Analysis - Should use history from phase 2
    print("\n--- Phase 3: Second Analysis (Verify History) ---")
    payload = {"text": "My electricity bill is ₹3500", "autonomous_mode": False}
    resp = httpx.post(f"{BASE_URL}/analyze", json=payload, verify=False)
    data = resp.json()
    items = data.get("items", [])
    elec = next((i for i in items if "electricity" in i["name"].lower()), None)
    
    if not elec:
        print("❌ Electricity bill not detected in second run")
        return
    
    print(f"✅ Detected: {elec['name']} - Current: {elec['amount']} - Prior: {elec['previous_amount']}")
    print(f"AI Reasoning: {elec['reasoning'][1]}")
    
    # Check if prior is 2000
    if float(elec['previous_amount']) == 2000:
        print("\n✨ SUCCESS: Persistent history working! Prior usage was correctly retrieved as ₹2000.")
    else:
        print(f"\n❌ FAILURE: Prior usage was {elec['previous_amount']}, expected 2000.")

if __name__ == "__main__":
    test_persistence()
