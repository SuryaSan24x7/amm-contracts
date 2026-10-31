// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AMMTestToken
 * @dev Implementation of the AMM Test ERC-20 token.
 */
contract AMMTestToken is ERC20, Ownable {
    
    constructor(uint256 initialSupply) 
        ERC20("AMM Test", "AMMT") 
        Ownable(msg.sender) 
    {
        // Mints the initial supply to the deployer's address
        // Note: 18 decimals is standard, so 1000 tokens = 1000 * 10^18
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }

    /**
     * @dev Optional: Allows the owner to mint more tokens if needed for testing.
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}