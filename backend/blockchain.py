"""
AutoChain Blockchain Simulator
Simulates Polkadot Hub EVM contract deployment and NFT minting.
Handles: create_subscription_contract | track_bill | mint_nft
"""
import uuid
import hashlib
from datetime import datetime

# ── In-memory chain state ──────────────────────────────────────────────────
_contracts   = {}   # address → contract
_nfts        = {}   # token_id → nft
_bill_trackers = {} # tracker_id → bill
_tx_history  = []
_block_base  = 1_000_000


def _next_block() -> int:
    return _block_base + len(_tx_history)


def _make_hash(*parts) -> str:
    return hashlib.sha256(("".join(str(p) for p in parts) + datetime.utcnow().isoformat()).encode()).hexdigest()


def _tx_hash(*parts) -> str:
    return "0x" + _make_hash(*parts)[:64]


def _addr(*parts) -> str:
    return "0x" + _make_hash(*parts)[:40]


# ── Main router ────────────────────────────────────────────────────────────

def execute_blockchain_action(item: dict, automation_result: dict) -> dict:
    """Route to the correct simulation based on action."""
    action = item.get("action") or item.get("decision") or ""

    # Both old and new action names are accepted
    if action in ("create_subscription_contract", "deploy_contract"):
        return _deploy_subscription(item, automation_result)
    elif action == "mint_nft":
        return _mint_nft(item, automation_result)
    elif action in ("track_bill", "bill_alert"):
        return _track_bill(item, automation_result)
    else:
        return {"success": False, "message": f"Unknown action: {action}"}


# ── Subscription contract deployment ──────────────────────────────────────

def _deploy_subscription(item: dict, auto: dict) -> dict:
    name     = item.get("name", "Subscription")
    amount   = item.get("amount", "0")
    currency = item.get("currency", "INR")
    freq     = item.get("frequency", "monthly")
    duration = int(item.get("duration") or auto.get("contract_lifecycle", {}).get("duration_months") or 3)
    risk     = item.get("risk", "low")

    lifecycle = auto.get("contract_lifecycle", {})
    time_sim  = auto.get("time_simulation", {})

    contract_addr = _addr("sub", name, amount)
    tx            = _tx_hash("deploy", name, amount)
    block         = _next_block()

    # Solidity-like struct representation
    solidity_struct = {
        "name":      name,
        "amount":    int(float(amount)) if amount else 0,
        "startTime": int(datetime.utcnow().timestamp()),
        "duration":  duration * 30 * 86400,   # months → seconds
        "active":    True,
        "paused":    False
    }

    contract = {
        "contract_address": contract_addr,
        "tx_hash":          tx,
        "type":             "SubscriptionManager",
        "network":          "Polkadot Hub EVM (Simulated)",
        "chain_id":         420420421,
        "service_name":     name,
        "amount":           amount,
        "currency":         currency,
        "frequency":        freq,
        "duration_months":  duration,
        "risk":             risk,
        "solidity_struct":  solidity_struct,
        "lifecycle":        lifecycle,
        "time_simulation":  time_sim,
        "rules":            auto.get("rules_applied", []),
        "alert_messages":   auto.get("alert_messages", []),
        "abi_functions":    [
            "createSubscription(string,uint,uint) → uint",
            "autoCancel(address,uint)",
            "pauseSubscription(uint)",
            "resumeSubscription(uint)",
            "checkRenewalAlert(address,uint,uint) → bool",
            "isActive(address,uint) → bool",
            "isDurationExceeded(address,uint) → bool",
        ],
        "status":        "deployed",
        "block_number":  block,
        "deployed_at":   datetime.utcnow().isoformat() + "Z"
    }

    _contracts[contract_addr] = contract
    _tx_history.append({
        "tx_hash":   tx,
        "type":      "DEPLOY_SUBSCRIPTION_CONTRACT",
        "contract":  contract_addr,
        "timestamp": contract["deployed_at"]
    })

    return {
        "success":          True,
        "contract_address": contract_addr,
        "tx_hash":          tx,
        "network":          "Polkadot Hub EVM (Simulated)",
        "chain_id":         420420421,
        "block_number":     block,
        "solidity_struct":  solidity_struct,
        "explorer_url":     f"https://blockscout.polkadot.io/tx/{tx}",
        "message":          f"SubscriptionManager deployed for {name} — {duration}mo contract, risk: {risk}"
    }


# ── NFT minting ───────────────────────────────────────────────────────────

def _mint_nft(item: dict, auto: dict) -> dict:
    token_id    = len(_nfts) + 1
    nft_details = auto.get("nft_details", {})
    name        = nft_details.get("item_name") or item.get("name", "Purchase")
    amount      = nft_details.get("amount") or item.get("amount", "0")
    currency    = nft_details.get("currency") or item.get("currency", "INR")
    symbol      = "₹" if currency == "INR" else "$"

    purchase_date    = nft_details.get("purchase_date", datetime.utcnow().strftime("%Y-%m-%d"))
    warranty_expiry  = nft_details.get("warranty_expiry", "")
    warranty_months  = nft_details.get("warranty_months", 12)
    warranty_state   = nft_details.get("warranty_state", "active")
    days_to_expiry   = nft_details.get("days_to_expiry", warranty_months * 30)
    ownership_id     = nft_details.get("ownership_id", _make_hash("own", token_id, name)[:36])
    grace_period_start = nft_details.get("grace_period_start", "")

    nft_contract  = _addr("nft_contract_autochain")
    owner_wallet  = _addr("user_wallet")
    tx            = _tx_hash("mint", token_id, name)
    block         = _next_block()
    purchase_ts   = int(datetime.utcnow().timestamp())
    warranty_ts   = purchase_ts + (warranty_months * 30 * 86400)
    amount_int    = int(float(amount)) if amount else 0

    # Solidity struct matching NFTReceipt.sol Receipt struct
    solidity_struct = {
        "itemName":           name,
        "amount":             amount_int,
        "currency":           currency,
        "purchaseTimestamp":  purchase_ts,
        "warrantyExpiry":     warranty_ts,
        "buyer":              owner_wallet,
        "warrantyActive":     warranty_state == "active",
        "tokenId":            token_id
    }

    # NFT metadata (ERC-721 tokenURI standard)
    metadata = {
        "name":        f"AutoChain Receipt #{token_id}: {name}",
        "description": f"Immutable proof of purchase for {name} — AutoChain NFT Receipt (ERC-721)",
        "attributes": [
            {"trait_type": "Item",               "value": name},
            {"trait_type": "Amount",             "value": f"{symbol}{amount}"},
            {"trait_type": "Currency",           "value": currency},
            {"trait_type": "Purchase Date",      "value": purchase_date},
            {"trait_type": "Warranty Expiry",    "value": warranty_expiry},
            {"trait_type": "Warranty Status",    "value": warranty_state.replace("_", " ").title()},
            {"trait_type": "Ownership Status",   "value": "Verified"},
            {"trait_type": "Contract Standard",  "value": "ERC-721"},
            {"trait_type": "Network",            "value": "Polkadot Hub EVM"},
        ],
        "image": f"https://autochain.io/nft/{token_id}.png"
    }

    # Warranty status object for frontend
    warranty_status = {
        "active":          warranty_state == "active",
        "state":           warranty_state,
        "expiry_date":     warranty_expiry,
        "grace_period_start": grace_period_start,
        "days_remaining":  days_to_expiry,
        "claim_status":    "unclaimed",
        "warranty_months": warranty_months
    }

    nft = {
        "token_id":         token_id,
        "tx_hash":          tx,
        "contract_address": nft_contract,
        "owner":            owner_wallet,
        "ownership_id":     ownership_id,
        "metadata":         metadata,
        "solidity_struct":  solidity_struct,
        "warranty_status":  warranty_status,
        "network":          "Polkadot Hub EVM (Simulated)",
        "rules":            auto.get("rules_applied", []),
        "alert_messages":   auto.get("alert_messages", []),
        "minted_at":        datetime.utcnow().isoformat() + "Z",
        "block_number":     block,
        "abi_functions": [
            "mintReceipt(address buyer, string itemName, uint256 amount, string currency, uint256 warrantyMonths, string tokenURI) → uint256",
            "isWarrantyValid(uint256 tokenId) → bool",
            "claimWarranty(uint256 tokenId)",
            "markWarrantyExpired(uint256 tokenId)",
            "getWarrantyStatus(uint256 tokenId) → (bool active, bool inGracePeriod, uint256 daysRemaining)",
            "getReceipt(uint256 tokenId) → Receipt",
            "getUserReceipts(address user) → uint256[]",
            "totalMinted() → uint256",
        ]
    }

    _nfts[token_id] = nft
    _tx_history.append({
        "tx_hash":   tx,
        "type":      "MINT_NFT",
        "token_id":  token_id,
        "name":      name,
        "timestamp": nft["minted_at"]
    })

    return {
        "success":          True,
        "token_id":         token_id,
        "tx_hash":          tx,
        "contract_address": nft_contract,
        "network":          "Polkadot Hub EVM (Simulated)",
        "block_number":     block,
        "explorer_url":     f"https://blockscout.polkadot.io/tx/{tx}",
        "metadata":         metadata,
        "solidity_struct":  solidity_struct,
        "warranty_status":  warranty_status,
        "ownership_id":     ownership_id,
        "owner_wallet":     owner_wallet,
        "message":          f"NFT Receipt #{token_id} minted for {name} — {symbol}{amount}"
    }



# ── Bill tracker ──────────────────────────────────────────────────────────

def _track_bill(item: dict, auto: dict) -> dict:
    tracker_id  = "BILL-" + uuid.uuid4().hex[:8].upper()
    name        = item.get("name", "Bill")
    amount      = item.get("amount", "0")
    currency    = item.get("currency", "INR")
    risk        = item.get("risk", "normal")
    prev_amount = item.get("previous_amount", amount)
    due_date    = item.get("dueDate") or auto.get("tracking", {}).get("due_date", "")
    is_abnormal = item.get("is_abnormal", False)
    increase_pct= item.get("increase_pct", 0)

    tx    = _tx_hash("bill", tracker_id, name)
    block = _next_block()

    # Solidity-like struct for BillTracker.sol
    solidity_struct = {
        "name":           name,
        "amount":         int(float(amount)) if amount else 0,
        "previousAmount": int(float(prev_amount)) if prev_amount else 0,
        "dueDate":        due_date,
        "paid":           False,
        "alertFired":     False,
        "alertDaysBefore": 3
    }

    # Simulated events that BillTracker.sol would emit
    emitted_events = []
    if is_abnormal:
        emitted_events.append({
            "event": "AbnormalIncreaseAlert",
            "data": {
                "name": name,
                "previousAmount": f"₹{prev_amount}",
                "currentAmount": f"₹{amount}",
                "increasePercent": f"{increase_pct}%"
            }
        })
    if float(amount) > 2000:
        emitted_events.append({
            "event": "HighUsageAlert",
            "data": {"name": name, "amount": f"₹{amount}", "message": "Exceeds ₹2000 threshold"}
        })
    if auto.get("tracking", {}).get("due_soon"):
        emitted_events.append({
            "event": "DueSoonAlert",
            "data": {"name": name, "dueDate": due_date, "daysRemaining": auto.get("tracking", {}).get("days_until_due")}
        })

    tracker = {
        "tracker_id":           tracker_id,
        "tx_hash":              tx,
        "contract":             "BillTracker.sol",
        "name":                 name,
        "amount":               amount,
        "previous_amount":      prev_amount,
        "currency":             currency,
        "risk":                 risk,
        "due_date":             due_date,
        "is_abnormal":          is_abnormal,
        "increase_pct":         increase_pct,
        "solidity_struct":      solidity_struct,
        "emitted_events":       emitted_events,
        "tracking":             auto.get("tracking", {}),
        "historical_comparison":auto.get("historical_comparison", {}),
        "rules":                auto.get("rules_applied", []),
        "alert_messages":       auto.get("alert_messages", []),
        "abi_functions": [
            "registerBill(string,uint,uint,uint,uint8) → uint",
            "checkAlerts(address,uint)",
            "markPaid(uint)",
            "updateAmount(uint,uint,uint)",
            "isDueSoon(address,uint) → bool,uint",
            "isAbnormalIncrease(address,uint) → bool,uint",
        ],
        "network":              "Polkadot Hub EVM (Simulated)",
        "registered_at":        datetime.utcnow().isoformat() + "Z",
        "block_number":         block
    }

    _bill_trackers[tracker_id] = tracker
    _tx_history.append({
        "tx_hash":    tx,
        "type":       "BILL_ALERT" if (is_abnormal or float(amount) > 2000) else "TRACK_BILL",
        "tracker_id": tracker_id,
        "name":       name,
        "timestamp":  tracker["registered_at"]
    })

    return {
        "success":              True,
        "tracker_id":           tracker_id,
        "tx_hash":              tx,
        "network":              "Polkadot Hub EVM (Simulated)",
        "block_number":         block,
        "explorer_url":         f"https://blockscout.polkadot.io/tx/{tx}",
        "solidity_struct":      solidity_struct,
        "emitted_events":       emitted_events,
        "tracking":             auto.get("tracking", {}),
        "historical_comparison":auto.get("historical_comparison", {}),
        "rules_applied":        auto.get("rules_applied", []),
        "alert_messages":       auto.get("alert_messages", []),
        "message":              f"Bill tracker registered for {name} — risk: {risk}"
    }


# ── Assets registry ───────────────────────────────────────────────────────

def get_all_assets() -> dict:
    return {
        "contracts":         list(_contracts.values()),
        "nfts":              list(_nfts.values()),
        "bill_trackers":     list(_bill_trackers.values()),
        "transaction_history": _tx_history[-20:],
        "network":           "Polkadot Hub EVM (Simulated)",
        "total_contracts":   len(_contracts),
        "total_nfts":        len(_nfts),
        "total_bill_trackers": len(_bill_trackers),
        "total_transactions":len(_tx_history)
    }


def get_nft_by_id(token_id: int) -> dict | None:
    """Return a specific NFT by token ID, or None if not found."""
    return _nfts.get(token_id)

