// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./BaseAMM.sol"; // Ensure this matches your file path

/**
 * @title AMMFactory
 * @dev Deploys and tracks BaseAMM liquidity pools.
 */
contract AMMFactory {
    // Mapping from token A -> token B -> pool address
    mapping(address => mapping(address => bool)) public isPair;
    mapping(address => mapping(address => address)) public getPair;
    
    // Array to hold all deployed pool addresses
    address[] public allPairs;

    // Event emitted when a new pool is created
    event PairCreated(address indexed token0, address indexed token1, address pair, uint256 length);

    /**
     * @dev Creates a liquidity pool for two tokens.
     * Tokens are sorted automatically to ensure consistent pair addressing regardless of input order.
     */
    function createPair(address tokenA, address tokenB) external returns (address pair) {
        require(tokenA != tokenB, "IDENTICAL_ADDRESSES");
        
        // Sort tokens to prevent duplicate pools (e.g., TokenA/TokenB vs TokenB/TokenA)
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        
        require(token0 != address(0), "ZERO_ADDRESS");
        require(getPair[token0][token1] == address(0), "PAIR_EXISTS"); // Single check is sufficient due to sorting

        // Deploy the new AMM pool contract using 'new'
        BaseAMM newPool = new BaseAMM(token0, token1);
        pair = address(newPool);

        // Update mappings and store
        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair; // Populate reverse mapping for convenience
        isPair[token0][token1] = true;
        isPair[token1][token0] = true;
        
        allPairs.push(pair);

        emit PairCreated(token0, token1, pair, allPairs.length);
    }

    /**
     * @dev Returns the total number of pairs created through the factory.
     */
    function allPairsLength() external view returns (uint256) {
        return allPairs.length;
    }
}