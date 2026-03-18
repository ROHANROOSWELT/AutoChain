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
from blockchain import execute_blockchain_action, get_all_assets, get_nft_by_id

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
    
    return {
        "status": "analyzed",
        "elapsed_seconds": elapsed,
        "model_used": result.get("model"),
        "autonomous_mode": req.autonomous_mode,
        "extraction": result["data"],
        "item_count": len(result["data"].get("items", []))
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
        
        # Execute blockchain action
        blockchain_result = execute_blockchain_action(item, automation_result)
        
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
            "automation": automation_result,
            "blockchain": blockchain_result
        })
    
    successful = sum(1 for r in results if r["blockchain"].get("success"))
    
    return {
        "status": "executed",
        "total_items": len(results),
        "successful_actions": successful,
        "failed_actions": len(results) - successful,
        "results": results,
        "network": "Polkadot Hub EVM (Simulated)"
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
    
    # Step 2: Apply rules + Execute for each item
    execution_results = []
    for item in items:
        automation_result = apply_rules(item)
        blockchain_result = execute_blockchain_action(item, automation_result)
        
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
            "automation": automation_result,
            "blockchain": blockchain_result
        })
    
    elapsed = round(time.time() - start, 2)
    successful = sum(1 for r in execution_results if r["blockchain"].get("success"))
    
    return {
        "status": "pipeline_complete",
        "elapsed_seconds": elapsed,
        "model_used": ai_result.get("model"),
        "autonomous_mode": req.autonomous_mode,
        "summary": ai_result["data"].get("summary"),
        "item_count": len(items),
        "successful_actions": successful,
        "ai_extraction": ai_result["data"],
        "execution_results": execution_results,
        "network": "Polkadot Hub EVM (Simulated)"
    }


@app.get("/assets")
def get_assets():
    """Get all deployed contracts, minted NFTs, and tracked bills."""
    return get_all_assets()


@app.get("/nft/{token_id}")
def get_nft(token_id: int):
    """Look up a specific minted NFT Receipt by token ID."""
    nft = get_nft_by_id(token_id)
    if not nft:
        raise HTTPException(status_code=404, detail=f"NFT #{token_id} not found")
    return {"status": "found", "nft": nft}


@app.get("/health")
def health():
    return {"status": "healthy", "service": "AutoChain Backend"}
