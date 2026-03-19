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
from automation import apply_rules
from config import add_simulated_days, reset_simulation

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
    elapsed = round(time.time() - start, 2)
    
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
        # Apply automation rules
        automation_result = apply_rules(item)
        
        # Execute blockchain action -> REMOVED FOR POLKADOT HUB LIVE MIGRATION
        
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
        automation_result = apply_rules(item)
        
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
    
    elapsed = round(time.time() - start, 2)
    
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


@app.get("/health")
def health():
    return {"status": "healthy", "service": "AutoChain Backend"}
