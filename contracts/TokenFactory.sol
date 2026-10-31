// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./TestToken.sol";

/**
 * @title TestTokenFactory
 * @dev Deploys 5 test tokens for AMM and liquidity pool testing.
 */
contract TestTokenFactory {
    address[] public deployedTokens;

    event TokensCreated(address[] tokens);

    constructor() {
        // Define 5 distinct test tokens with names and symbols
        string[5] memory names = ["Alpha Token", "Beta Token", "Gamma Coin", "Delta Cash", "Omega Dollar"];
        string[5] memory symbols = ["ALPHA", "BETA", "GAMMA", "DELTA", "OMEGA"];

        for (uint256 i = 0; i < 5; i++) {
            TestToken newToken = new TestToken(names[i], symbols[i]);
            deployedTokens.push(address(newToken));
        }

        emit TokensCreated(deployedTokens);
    }

    /**
     * @dev Returns the full list of deployed test token addresses.
     */
    function getDeployedTokens() external view returns (address[] memory) {
        return deployedTokens;
    }
}