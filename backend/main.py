"""
AutoChain FastAPI Backend
Main application with all routes
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import time

from ai_agent import analyze_text
from automation import apply_rules, send_renewal_confirmation
from config import add_simulated_days, reset_simulation, get_simulated_now
from storage import update_item_history, mark_subscription_renewed, get_item_history

app = FastAPI(
    title="AutoChain API",
    description="Autonomous AI agent for converting Web2 financial data into Web3 smart contracts",
    version="1.0.0"
)

# Allow all origins for hackathon/dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    text: str
    autonomous_mode: Optional[bool] = False


class ExecuteRequest(BaseModel):
    items: list
    autonomous_mode: Optional[bool] = False


@app.get("/")
def root():
    return {
        "app": "AutoChain",
        "version": "1.0.0",
        "status": "running",
        "description": "Autonomous AI agent for Web2 → Web3 financial asset conversion",
        "endpoints": ["/analyze", "/execute", "/pipeline", "/assets"]
    }


@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    """
    Step 1: AI analyzes text, extracts structured financial data, and makes decisions.
    Returns extracted items with AI decisions and reasoning.
    """
    if not req.text or len(req.text.strip()) < 3:
        raise HTTPException(status_code=400, detail="Input text is too short")
    
    start = time.time()
    result = analyze_text(req.text)
    elapsed = round(float(time.time() - start), 2)
    
    if not result.get("success"):
        raise HTTPException(status_code=500, detail="AI analysis failed")
    
    extraction = result.get("data") or {}
    items = extraction.get("items") or []

    return {
        "status": "analyzed",
        "elapsed_seconds": elapsed,
        "model_used": result.get("model"),
        "autonomous_mode": req.autonomous_mode,
        # Items exposed at root AND under extraction for frontend compatibility
        "items": items,
        "summary": extraction.get("summary", ""),
        "extraction": extraction,
        "item_count": len(items)
    }


@app.post("/execute")
def execute(req: ExecuteRequest):
    """
    Step 2: Apply automation rules and execute blockchain actions for each item.
    Each item goes through: automation rules → blockchain action
    """
    results = []
    
    for item in req.items:
        # Apply automation rules (no email on /execute — user just confirmed the item)
        automation_result = apply_rules(item, read_only=True)
        
        # Persist history; for subscriptions also store start time & duration
        if item.get("type") in ("bill", "subscription", "purchase"):
            sub_start = None
            duration_mo = None
            if item.get("type") == "subscription":
                # subscription_start is now (first registration)
                from datetime import datetime as _dt
                sub_start  = _dt.utcnow().isoformat()
                duration_mo = int(
                    item.get("duration")
                    or (item.get("contract_params") or {}).get("duration_months")
                    or 3
                )
            update_item_history(
                item.get("type"),
                item.get("bill_key") or item.get("name"),
                item.get("amount"),
                subscription_start=sub_start,
                duration_months=duration_mo,
            )

        results.append({
            "item": {
                "type": item.get("type"),
                "name": item.get("name"),
                "amount": item.get("amount"),
                "currency": item.get("currency"),
                "frequency": item.get("frequency"),
            },
            "decision": item.get("decision"),
            "reasoning": item.get("reasoning"),
            "automation": automation_result
        })
    
    return {
        "status": "prepared",
        "total_items": len(results),
        "results": results
    }


@app.post("/pipeline")
def pipeline(req: AnalyzeRequest):
    """
    Full pipeline: Analyze → Automate → Execute in one shot.
    This is the Autonomous Mode endpoint.
    """
    # Step 1: AI Analysis
    start = time.time()
    ai_result = analyze_text(req.text)
    
    if not ai_result.get("success"):
        raise HTTPException(status_code=500, detail="AI analysis failed")
    
    items = ai_result["data"].get("items", [])
    
    # Step 2: Apply rules
    execution_results = []
    for item in items:
        automation_result = apply_rules(item, read_only=True)
        
        # Persist history
        if item.get("type") in ("bill", "subscription", "purchase"):
            sub_start   = None
            duration_mo = None
            if item.get("type") == "subscription":
                from datetime import datetime as _dt
                sub_start   = _dt.utcnow().isoformat()
                duration_mo = int(
                    item.get("duration")
                    or (item.get("contract_params") or {}).get("duration_months")
                    or 3
                )
            update_item_history(
                item.get("type"),
                item.get("bill_key") or item.get("name"),
                item.get("amount"),
                subscription_start=sub_start,
                duration_months=duration_mo,
            )


        execution_results.append({
            "item": {
                "type": item.get("type"),
                "name": item.get("name"),
                "amount": item.get("amount"),
                "currency": item.get("currency"),
                "frequency": item.get("frequency"),
            },
            "decision": item.get("decision"),
            "reasoning": item.get("reasoning"),
            "automation": automation_result
        })
    
    elapsed = round(float(time.time() - start), 2)
    
    return {
        "status": "pipeline_complete",
        "elapsed_seconds": elapsed,
        "model_used": ai_result.get("model"),
        "autonomous_mode": req.autonomous_mode,
        "summary": ai_result["data"].get("summary"),
        "item_count": len(items),
        "ai_extraction": ai_result["data"],
        "execution_results": execution_results
    }


@app.api_route("/simulate/forward", methods=["GET", "POST"])
def simulate_forward(days: int = 30):
    """Fast-forward the simulated time and process any due alerts."""
    new_offset = add_simulated_days(days)
    
    # Process all historical subscriptions — increment renewal_count so each
    # 30-day advance fires exactly one "Pay or Cancel" email per subscription.
    from storage import load_history
    history = load_history()
    alert_triggered = 0
    
    for key, record in history.items():
        if record.get("type") == "subscription":
            apply_rules(record, read_only=False, increment_renewal=True)
            alert_triggered += 1
        elif record.get("type") == "bill":
            apply_rules(record, read_only=False)
            alert_triggered += 1

    return {
        "status": "time_advanced",
        "added_days": days,
        "total_offset": new_offset,
        "alerts_processed": alert_triggered,
        "current_simulated_time": get_simulated_now().strftime("%Y-%m-%d %H:%M:%S")
    }


@app.api_route("/simulate/reset", methods=["GET", "POST"])
def simulate_reset():
    """Reset the simulated time to real UTC now."""
    reset_simulation()
    return {
        "status": "time_reset",
        "current_simulated_time": get_simulated_now().strftime("%Y-%m-%d %H:%M:%S")
    }


@app.api_route("/simulate/pay", methods=["GET", "POST"])
def simulate_pay(key: str):
    """
    Simulate the user clicking PAY NOW after a renewal email.
    - Resets the subscription renewal_count so a new term starts
    - Sends a 'Subscription Renewed' confirmation email
    """
    from storage import get_item_history
    record = get_item_history("subscription", key.lower())
    if not record:
        raise HTTPException(status_code=404, detail=f"No subscription found for key '{key}'")
    
    duration_mo      = record.get("duration_months") or 3
    display_amount   = record.get("current_amount") or "0"
    display_currency = "INR"
    display_name     = record.get("key", key).capitalize()

    # Mark renewed in storage (resets renewal_count, updates subscription_start)
    mark_subscription_renewed(key.lower())

    # Send confirmation email
    send_renewal_confirmation(
        item_key=key,
        display_name=display_name,
        display_amount=display_amount,
        display_currency=display_currency,
        duration_mo=duration_mo,
    )

    return {
        "status": "renewed",
        "subscription": key,
        "message": f"{display_name} subscription renewed for {duration_mo} month(s). Confirmation email sent.",
        "current_simulated_time": get_simulated_now().strftime("%Y-%m-%d %H:%M:%S")
    }

class ReceiptRequest(BaseModel):
    item: dict
    tx_hash: str

@app.api_route("/simulate/email_receipt", methods=["POST"])
def email_receipt(req: ReceiptRequest):
    """
    Endpoint for frontend to call after transaction is confirmed on-chain.
    """
    from automation import send_transaction_completed_email
    send_transaction_completed_email(req.item, req.tx_hash)
    return {"status": "email_sent"}

@app.api_route("/assets", methods=["GET", "POST"])
def get_assets():
    """
    Returns all managed assets from history, enhanced with current simulated status.
    Used by the 'Managed Assets' panel in the frontend.
    """
    from storage import load_history
    history = load_history()
    
    contracts = []
    nfts = []
    
    for key, record in history.items():
        # Apply rules to get current simulated status (read_only to prevent email spam)
        auto = apply_rules(record, read_only=True)
        
        if record.get("type") == "subscription":
            contracts.append({
                "service_name": record.get("key", "").capitalize(),
                "status": auto.get("contract_lifecycle", {}).get("status", "active"),
                "amount": record.get("current_amount"),
                "currency": "INR", # Defaulting as per common usage
                "frequency": "monthly",
                "contract_address": "0xDynamicManaged",
                "lifecycle": auto.get("contract_lifecycle"),
                "time_simulation": auto.get("time_simulation")
            })
        elif record.get("type") == "purchase":
            nfts.append({
                "token_id": "888", # Simulated
                "contract_address": "0xNFTReceiptV3",
                "warranty_status": auto.get("nft_details", {}),
                "metadata": {
                    "attributes": [
                        {"trait_type": "Item", "value": record.get("key", "").capitalize()},
                        {"trait_type": "Price", "value": record.get("current_amount")}
                    ]
                }
            })
        # Bills are usually displayed in the main feed, but we can include them in contracts or history
    
    return {
        "total_contracts": len(contracts),
        "total_nfts": len(nfts),
        "total_transactions": len(contracts) + len(nfts),
        "contracts": contracts,
        "nfts": nfts,
        "transaction_history": [] # Optional
    }


@app.get("/health")
def health():
    return {"status": "healthy", "service": "AutoChain Backend"}
