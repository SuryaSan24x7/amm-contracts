// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {
    uint256 public constant FAUCET_AMOUNT = 1000 * 10**18; // 1,000 tokens per claim
    uint256 public constant COOLDOWN_PERIOD = 24 hours;

    // Mapping from user address to their last faucet claim timestamp
    mapping(address => uint256) public lastClaimTime;

    event FaucetClaimed(address indexed recipient, uint256 amount, uint256 timestamp);

    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        // Mint an initial supply to the deployer (Factory)
        _mint(msg.sender, 1000000000 * 10**decimals());
    }

    /**
     * @dev Faucet function: Users can claim free tokens once every 24 hours.
     */
    function faucet() external {
        require(
            block.timestamp >= lastClaimTime[msg.sender] + COOLDOWN_PERIOD,
            "Faucet: Cooldown period active. Try again in 24 hours."
        );

        lastClaimTime[msg.sender] = block.timestamp;
        _mint(msg.sender, FAUCET_AMOUNT);

        emit FaucetClaimed(msg.sender, FAUCET_AMOUNT, block.timestamp);
    }

    /**
     * @dev Helper view function to check how much time is left before a user can claim again.
     * Returns 0 if the user is eligible to claim now.
     */
    function getTimeUntilNextClaim(address user) external view returns (uint256) {
        uint256 nextAvailableTime = lastClaimTime[user] + COOLDOWN_PERIOD;
        if (block.timestamp >= nextAvailableTime) {
            return 0;
        }
        return nextAvailableTime - block.timestamp;
    }
}