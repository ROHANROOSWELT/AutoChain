// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title BillTracker
 * @dev On-chain bill tracking with due-date and high-usage alerts
 *      Deployable on Polkadot Hub EVM (chain ID: 420420421)
 */
contract BillTracker {

    // ─── Struct ────────────────────────────────────────────────────────
    struct Bill {
        string  name;           // e.g. "Electricity Bill"
        uint    amount;         // current bill amount (smallest unit, e.g. paise)
        uint    previousAmount; // last month's amount for comparison
        uint    dueDate;        // unix timestamp of due date
        uint    registeredAt;   // when this entry was created
        bool    paid;           // has it been marked as paid?
        bool    alertFired;     // has the due-soon alert fired?
        uint8   alertDaysBefore;// days before due to alert (default 3)
    }

    // ─── State ─────────────────────────────────────────────────────────
    address public owner;
    uint    public constant HIGH_USAGE_THRESHOLD = 200000; // 2000 INR in paise
    uint    public constant SPIKE_THRESHOLD_PCT  = 20;     // 20% increase = abnormal

    mapping(address => mapping(uint => Bill)) public bills;
    mapping(address => uint) public billCount;

    // ─── Events ────────────────────────────────────────────────────────
    event BillRegistered(
        address indexed user,
        uint    indexed billId,
        string  name,
        uint    amount,
        uint    dueDate
    );

    event DueSoonAlert(
        address indexed user,
        uint    indexed billId,
        string  name,
        uint    dueDate,
        uint    daysRemaining
    );

    event HighUsageAlert(
        address indexed user,
        uint    indexed billId,
        string  name,
        uint    amount,
        string  message
    );

    event AbnormalIncreaseAlert(
        address indexed user,
        uint    indexed billId,
        string  name,
        uint    previousAmount,
        uint    currentAmount,
        uint    increasePercent
    );

    event BillPaid(
        address indexed user,
        uint    indexed billId,
        string  name,
        uint    amount,
        uint    paidAt
    );

    event BudgetWarning(
        address indexed user,
        uint    indexed billId,
        string  name,
        uint    amount,
        string  message
    );

    // ─── Modifier ──────────────────────────────────────────────────────
    modifier billExists(address user, uint billId) {
        require(billId < billCount[user], "BillTracker: bill not found");
        _;
    }

    // ─── Constructor ───────────────────────────────────────────────────
    constructor() {
        owner = msg.sender;
    }

    // ─── Core Functions ────────────────────────────────────────────────

    /**
     * @notice Register a new bill for tracking
     * @param name            Human-readable bill name (e.g. "Electricity Bill")
     * @param amount          Current bill amount in smallest unit (paise)
     * @param previousAmount  Last month's amount for spike comparison
     * @param dueDateTimestamp Unix timestamp when bill is due
     * @param alertDaysBefore Days before due date to fire the alert
     * @return billId The new bill ID for this user
     */
    function registerBill(
        string  memory name,
        uint    amount,
        uint    previousAmount,
        uint    dueDateTimestamp,
        uint8   alertDaysBefore
    ) external returns (uint billId) {
        billId = billCount[msg.sender];

        bills[msg.sender][billId] = Bill({
            name:            name,
            amount:          amount,
            previousAmount:  previousAmount,
            dueDate:         dueDateTimestamp,
            registeredAt:    block.timestamp,
            paid:            false,
            alertFired:      false,
            alertDaysBefore: alertDaysBefore
        });

        billCount[msg.sender]++;

        emit BillRegistered(msg.sender, billId, name, amount, dueDateTimestamp);

        // Auto-check on registration
        _checkAndEmitAlerts(msg.sender, billId);

        return billId;
    }

    /**
     * @notice Check and emit all applicable alerts for a bill.
     *         Designed to be called by a keeper / automation bot periodically.
     */
    function checkAlerts(address user, uint billId)
        external
        billExists(user, billId)
    {
        _checkAndEmitAlerts(user, billId);
    }

    /**
     * @notice Mark a bill as paid
     */
    function markPaid(uint billId)
        external
        billExists(msg.sender, billId)
    {
        Bill storage b = bills[msg.sender][billId];
        require(!b.paid, "BillTracker: already paid");
        b.paid = true;
        emit BillPaid(msg.sender, billId, b.name, b.amount, block.timestamp);
    }

    /**
     * @notice Update bill amount for next cycle
     */
    function updateAmount(uint billId, uint newAmount, uint newDueDate)
        external
        billExists(msg.sender, billId)
    {
        Bill storage b = bills[msg.sender][billId];
        b.previousAmount = b.amount;
        b.amount         = newAmount;
        b.dueDate        = newDueDate;
        b.paid           = false;
        b.alertFired     = false;

        _checkAndEmitAlerts(msg.sender, billId);
    }

    // ─── Views ─────────────────────────────────────────────────────────

    function getBill(address user, uint billId)
        external
        view
        billExists(user, billId)
        returns (Bill memory)
    {
        return bills[user][billId];
    }

    function isDueSoon(address user, uint billId)
        external
        view
        billExists(user, billId)
        returns (bool, uint daysRemaining)
    {
        Bill storage b = bills[user][billId];
        if (b.paid || block.timestamp >= b.dueDate) return (false, 0);
        uint secondsLeft = b.dueDate - block.timestamp;
        daysRemaining = secondsLeft / 1 days;
        return (daysRemaining <= b.alertDaysBefore, daysRemaining);
    }

    function isHighUsage(address user, uint billId)
        external
        view
        billExists(user, billId)
        returns (bool)
    {
        return bills[user][billId].amount >= HIGH_USAGE_THRESHOLD;
    }

    function isAbnormalIncrease(address user, uint billId)
        external
        view
        billExists(user, billId)
        returns (bool, uint increasePercent)
    {
        Bill storage b = bills[user][billId];
        if (b.previousAmount == 0) return (false, 0);
        if (b.amount <= b.previousAmount) return (false, 0);
        increasePercent = ((b.amount - b.previousAmount) * 100) / b.previousAmount;
        return (increasePercent >= SPIKE_THRESHOLD_PCT, increasePercent);
    }

    // ─── Internal ──────────────────────────────────────────────────────

    function _checkAndEmitAlerts(address user, uint billId) internal {
        Bill storage b = bills[user][billId];
        if (b.paid) return;

        // Due-soon alert
        if (block.timestamp < b.dueDate) {
            uint secondsLeft  = b.dueDate - block.timestamp;
            uint daysRemaining= secondsLeft / 1 days;
            if (daysRemaining <= b.alertDaysBefore && !b.alertFired) {
                b.alertFired = true;
                emit DueSoonAlert(user, billId, b.name, b.dueDate, daysRemaining);
            }
        }

        // High usage alert
        if (b.amount >= HIGH_USAGE_THRESHOLD) {
            emit HighUsageAlert(
                user, billId, b.name, b.amount,
                "Bill amount exceeds high-usage threshold of 2000 INR"
            );
        }

        // Abnormal increase alert
        if (b.previousAmount > 0 && b.amount > b.previousAmount) {
            uint increasePercent = ((b.amount - b.previousAmount) * 100) / b.previousAmount;
            if (increasePercent >= SPIKE_THRESHOLD_PCT) {
                emit AbnormalIncreaseAlert(
                    user, billId, b.name,
                    b.previousAmount, b.amount, increasePercent
                );
            }
        }

        // Budget warning (simulated: amount > 80% of assumed budget)
        uint assumedBudget = HIGH_USAGE_THRESHOLD * 2; // 4000 INR
        if (b.amount * 100 >= assumedBudget * 80) {
            emit BudgetWarning(
                user, billId, b.name, b.amount,
                "Bill is consuming more than 80% of your estimated monthly budget"
            );
        }
    }
}
