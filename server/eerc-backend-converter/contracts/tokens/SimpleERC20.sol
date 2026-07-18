// (c) 2025, Ava Labs, Inc. All rights reserved.
// See the file LICENSE for licensing terms.

// SPDX-License-Identifier: Ecosystem

pragma solidity 0.8.27;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract SimpleERC20 is ERC20 {
    // token decimals
    uint8 public decimals_;
    
    // Faucet functionality
    uint256 public constant FAUCET_AMOUNT = 1000 * 10**18; // 1000 tokens
    uint256 public constant FAUCET_COOLDOWN = 24 hours;
    mapping(address => uint256) public lastFaucetClaim;
    
    event FaucetClaimed(address indexed user, uint256 amount, uint256 timestamp);

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimal
    ) ERC20(name, symbol) {
        decimals_ = decimal;
    }

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }

    function decimals() public view virtual override returns (uint8) {
        return decimals_;
    }
    
    /**
     * @dev Allows anyone to claim tokens from the faucet once every 24 hours
     */
    function claimFromFaucet() external {
        require(
            block.timestamp >= lastFaucetClaim[msg.sender] + FAUCET_COOLDOWN,
            "Faucet: Cooldown period not elapsed"
        );
        
        lastFaucetClaim[msg.sender] = block.timestamp;
        _mint(msg.sender, FAUCET_AMOUNT);
        
        emit FaucetClaimed(msg.sender, FAUCET_AMOUNT, block.timestamp);
    }
    
    /**
     * @dev Returns the timestamp when the user can next claim from the faucet
     */
    function getNextFaucetClaimTime(address user) external view returns (uint256) {
        return lastFaucetClaim[user] + FAUCET_COOLDOWN;
    }
    
    /**
     * @dev Returns whether the user can currently claim from the faucet
     */
    function canClaimFromFaucet(address user) external view returns (bool) {
        return block.timestamp >= lastFaucetClaim[user] + FAUCET_COOLDOWN;
    }
}
