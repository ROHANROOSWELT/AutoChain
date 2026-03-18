// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SubscriptionManager {
    struct Subscription {
        string name;
        uint256 amount;
        uint256 duration;
        uint256 nextRenewal;
        bool active;
    }
    
    mapping(address => Subscription[]) public userSubscriptions;
    
    event SubscriptionCreated(address indexed user, string name, uint256 amount, uint256 duration);
    event SubscriptionCancelled(address indexed user, uint256 index);

    // Create a new subscription
    function createSubscription(string memory _name, uint256 _amount, uint256 _duration) public {
        uint256 renewal = block.timestamp + (_duration * 30 days);
        userSubscriptions[msg.sender].push(Subscription({
            name: _name,
            amount: _amount,
            duration: _duration,
            nextRenewal: renewal,
            active: true
        }));
        emit SubscriptionCreated(msg.sender, _name, _amount, _duration);
    }
    
    // Get all subscriptions for a user
    function getSubscriptions(address _user) public view returns (Subscription[] memory) {
        return userSubscriptions[_user];
    }
    
    // Cancel a subscription by index
    function cancelSubscription(uint256 _index) public {
        require(_index < userSubscriptions[msg.sender].length, "Invalid index");
        userSubscriptions[msg.sender][_index].active = false;
        emit SubscriptionCancelled(msg.sender, _index);
    }
}
