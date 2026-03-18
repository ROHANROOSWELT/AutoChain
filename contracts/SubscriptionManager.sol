// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SubscriptionManager
 * @dev Autonomous subscription contract on Polkadot Hub EVM
 *
 * Struct matches AutoChain spec:
 *   name, amount, startTime, duration, active, paused
 *
 * Features:
 *   - createSubscription
 *   - autoCancel       (can be called by keeper when duration exceeded)
 *   - pauseSubscription / resumeSubscription
 *   - Renewal alerts via events
 */
contract SubscriptionManager {

    // ─── Struct ────────────────────────────────────────────────────────
    struct Subscription {
        string  name;           // service name, e.g. "Netflix"
        uint    amount;         // payment amount (in wei or smallest unit)
        uint    startTime;      // unix timestamp when contract was created
        uint    duration;       // total duration in seconds
        bool    active;         // is the subscription currently active?
        bool    paused;         // is the subscription paused?
    }

    // ─── State ─────────────────────────────────────────────────────────
    address public owner;

    // user → subscriptionId → Subscription
    mapping(address => mapping(uint => Subscription)) public subscriptions;
    mapping(address => uint) public subscriptionCount;

    // track alert fires to avoid duplicate events
    mapping(address => mapping(uint => bool)) private _alertFired;

    // ─── Events ────────────────────────────────────────────────────────
    event SubscriptionCreated(
        address indexed user,
        uint    indexed subId,
        string  name,
        uint    amount,
        uint    startTime,
        uint    duration
    );

    event SubscriptionRenewed(
        address indexed user,
        uint    indexed subId,
        uint    nextRenewalTime
    );

    event SubscriptionAutoCancelled(
        address indexed user,
        uint    indexed subId,
        string  reason
    );

    event SubscriptionPaused(
        address indexed user,
        uint    indexed subId
    );

    event SubscriptionResumed(
        address indexed user,
        uint    indexed subId,
        uint    newNextRenewal
    );

    event RenewalAlert(
        address indexed user,
        uint    indexed subId,
        uint    renewalTime,
        uint    daysUntilRenewal
    );

    // ─── Modifiers ─────────────────────────────────────────────────────
    modifier onlyOwner() {
        require(msg.sender == owner, "SubscriptionManager: not owner");
        _;
    }

    modifier exists(address user, uint subId) {
        require(subId < subscriptionCount[user], "SubscriptionManager: not found");
        _;
    }

    // ─── Constructor ───────────────────────────────────────────────────
    constructor() {
        owner = msg.sender;
    }

    // ─── Core Functions ────────────────────────────────────────────────

    /**
     * @notice Create a new autonomous subscription
     * @param name        Human-readable service name
     * @param amount      Payment amount (wei)
     * @param durationDays Total subscription lifetime in days
     * @return subId      The new subscription ID for this user
     */
    function createSubscription(
        string memory name,
        uint          amount,
        uint          durationDays
    ) external returns (uint subId) {
        uint durationSec = durationDays * 1 days;
        uint start       = block.timestamp;

        subId = subscriptionCount[msg.sender];

        subscriptions[msg.sender][subId] = Subscription({
            name:      name,
            amount:    amount,
            startTime: start,
            duration:  durationSec,
            active:    true,
            paused:    false
        });

        subscriptionCount[msg.sender]++;

        emit SubscriptionCreated(
            msg.sender, subId, name, amount, start, durationSec
        );

        return subId;
    }

    /**
     * @notice Auto-cancel a subscription if its duration has been exceeded.
     *         Designed to be called by an off-chain keeper / automation bot.
     * @param user  Subscriber address
     * @param subId Subscription ID
     */
    function autoCancel(address user, uint subId)
        external
        exists(user, subId)
    {
        Subscription storage sub = subscriptions[user][subId];
        require(sub.active, "SubscriptionManager: already inactive");

        uint expiryTime = sub.startTime + sub.duration;
        require(
            block.timestamp >= expiryTime,
            "SubscriptionManager: duration not yet exceeded"
        );

        sub.active = false;
        emit SubscriptionAutoCancelled(
            user,
            subId,
            string(abi.encodePacked("Duration of ", _uint2str(sub.duration / 1 days), " days exceeded"))
        );
    }

    /**
     * @notice Pause a subscription (stops renewal processing)
     */
    function pauseSubscription(uint subId)
        external
        exists(msg.sender, subId)
    {
        Subscription storage sub = subscriptions[msg.sender][subId];
        require(sub.active,   "SubscriptionManager: not active");
        require(!sub.paused,  "SubscriptionManager: already paused");

        sub.paused = true;
        emit SubscriptionPaused(msg.sender, subId);
    }

    /**
     * @notice Resume a previously paused subscription
     */
    function resumeSubscription(uint subId)
        external
        exists(msg.sender, subId)
    {
        Subscription storage sub = subscriptions[msg.sender][subId];
        require(sub.active,  "SubscriptionManager: not active");
        require(sub.paused,  "SubscriptionManager: not paused");

        sub.paused = false;

        // Next renewal = now + 30 days
        uint nextRenewal = block.timestamp + 30 days;
        emit SubscriptionResumed(msg.sender, subId, nextRenewal);
    }

    /**
     * @notice Check and emit renewal alert if within alertWindow of next renewal.
     *         Keeper calls this periodically.
     * @param user        Subscriber address
     * @param subId       Subscription ID
     * @param alertWindow Seconds before renewal to start alerting (e.g. 3 days = 259200)
     * @return shouldAlert Whether an alert was emitted
     */
    function checkRenewalAlert(
        address user,
        uint    subId,
        uint    alertWindow
    )
        external
        exists(user, subId)
        returns (bool shouldAlert)
    {
        Subscription storage sub = subscriptions[user][subId];
        if (!sub.active || sub.paused) return false;

        // Next renewal = startTime + 30 days (simplified; in prod use cycle tracking)
        uint nextRenewal = sub.startTime + 30 days;
        uint alertStart  = nextRenewal > alertWindow ? nextRenewal - alertWindow : 0;

        if (block.timestamp >= alertStart && block.timestamp < nextRenewal) {
            uint daysLeft = (nextRenewal - block.timestamp) / 1 days;
            emit RenewalAlert(user, subId, nextRenewal, daysLeft);
            return true;
        }
        return false;
    }

    // ─── Views ─────────────────────────────────────────────────────────

    function getSubscription(address user, uint subId)
        external
        view
        exists(user, subId)
        returns (Subscription memory)
    {
        return subscriptions[user][subId];
    }

    function isActive(address user, uint subId)
        external
        view
        returns (bool)
    {
        return subscriptions[user][subId].active;
    }

    function isDurationExceeded(address user, uint subId)
        external
        view
        exists(user, subId)
        returns (bool)
    {
        Subscription storage sub = subscriptions[user][subId];
        return block.timestamp >= sub.startTime + sub.duration;
    }

    // ─── Internal helpers ──────────────────────────────────────────────

    function _uint2str(uint v) internal pure returns (string memory) {
        if (v == 0) return "0";
        uint temp = v; uint digits;
        while (temp != 0) { digits++; temp /= 10; }
        bytes memory buf = new bytes(digits);
        while (v != 0) { digits--; buf[digits] = bytes1(uint8(48 + v % 10)); v /= 10; }
        return string(buf);
    }
}
