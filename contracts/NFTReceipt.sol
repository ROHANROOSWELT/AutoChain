// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NFTReceipt
 * @dev Mint NFTs as immutable proof of purchase receipts on Polkadot Hub EVM
 * Each NFT represents a purchase with warranty tracking
 */
contract NFTReceipt is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;
    
    struct Receipt {
        string itemName;
        uint256 amount;          // in wei
        string currency;
        uint256 purchaseTimestamp;
        uint256 warrantyExpiry;
        address buyer;
        bool warrantyActive;
    }
    
    mapping(uint256 => Receipt) public receipts;
    mapping(address => uint256[]) public userReceipts;
    
    event ReceiptMinted(
        uint256 indexed tokenId,
        address indexed buyer,
        string itemName,
        uint256 amount,
        uint256 warrantyExpiry
    );
    event WarrantyExpired(uint256 indexed tokenId);
    event WarrantyClaimed(uint256 indexed tokenId, address indexed buyer);
    
    constructor() ERC721("AutoChain NFT Receipt", "ACNR") Ownable(msg.sender) {}
    
    /**
     * @dev Mint an NFT receipt for a purchase
     * @param buyer Address of the buyer
     * @param itemName Name of the purchased item
     * @param amount Purchase amount
     * @param currency Currency string (e.g., "INR", "USD")
     * @param warrantyMonths Warranty duration in months
     * @param tokenURI IPFS/HTTP URI for NFT metadata
     */
    function mintReceipt(
        address buyer,
        string memory itemName,
        uint256 amount,
        string memory currency,
        uint256 warrantyMonths,
        string memory tokenURI
    ) external onlyOwner returns (uint256 tokenId) {
        tokenId = _nextTokenId++;
        
        uint256 warrantyExpiry = block.timestamp + (warrantyMonths * 30 days);
        
        receipts[tokenId] = Receipt({
            itemName: itemName,
            amount: amount,
            currency: currency,
            purchaseTimestamp: block.timestamp,
            warrantyExpiry: warrantyExpiry,
            buyer: buyer,
            warrantyActive: true
        });
        
        userReceipts[buyer].push(tokenId);
        
        _safeMint(buyer, tokenId);
        _setTokenURI(tokenId, tokenURI);
        
        emit ReceiptMinted(tokenId, buyer, itemName, amount, warrantyExpiry);
        return tokenId;
    }
    
    /**
     * @dev Check if warranty is still valid
     */
    function isWarrantyValid(uint256 tokenId) external view returns (bool) {
        require(tokenId < _nextTokenId, "Token does not exist");
        return block.timestamp <= receipts[tokenId].warrantyExpiry;
    }
    
    /**
     * @dev Claim warranty (marks it as used)
     */
    function claimWarranty(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not NFT owner");
        Receipt storage r = receipts[tokenId];
        require(r.warrantyActive, "Warranty already claimed");
        require(block.timestamp <= r.warrantyExpiry, "Warranty expired");
        
        r.warrantyActive = false;
        emit WarrantyClaimed(tokenId, msg.sender);
    }
    
    /**
     * @dev Mark warranty as expired (called by keeper)
     */
    function markWarrantyExpired(uint256 tokenId) external {
        require(tokenId < _nextTokenId, "Token does not exist");
        Receipt storage r = receipts[tokenId];
        require(block.timestamp > r.warrantyExpiry, "Warranty still valid");
        require(r.warrantyActive, "Already expired");
        
        r.warrantyActive = false;
        emit WarrantyExpired(tokenId);
    }
    
    function getReceipt(uint256 tokenId) external view returns (Receipt memory) {
        require(tokenId < _nextTokenId, "Token does not exist");
        return receipts[tokenId];
    }
    
    function getUserReceipts(address user) external view returns (uint256[] memory) {
        return userReceipts[user];
    }
    
    function totalMinted() external view returns (uint256) {
        return _nextTokenId;
    }

    /**
     * @dev Returns full warranty status in one call
     * @return active Whether warranty is still active (unclaimed and not expired)
     * @return inGracePeriod Whether within 30-day grace period before expiry
     * @return daysRemaining Days until warranty expires (0 if already expired)
     */
    function getWarrantyStatus(uint256 tokenId)
        external
        view
        returns (bool active, bool inGracePeriod, uint256 daysRemaining)
    {
        require(tokenId < _nextTokenId, "Token does not exist");
        Receipt storage r = receipts[tokenId];

        if (block.timestamp > r.warrantyExpiry) {
            return (false, false, 0);
        }

        uint256 remaining = r.warrantyExpiry - block.timestamp;
        uint256 gracePeriod = 30 days;
        bool inGrace = remaining <= gracePeriod;

        return (r.warrantyActive, inGrace, remaining / 1 days);
    }
}
