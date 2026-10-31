# AMM & Faucet Token Demo (Hardhat 3)

This project showcases a custom Constant-Product Automated Market Maker (AMM) styled after Uniswap V2, paired with a multi-token Faucet Factory built using Hardhat 3, Solidity, and TypeScript (`mocha` and `ethers.js`).

To learn more about Hardhat 3, please visit the [Getting Started guide](https://hardhat.org/docs/getting-started#getting-started-with-hardhat-3). To share your feedback, join the [Hardhat 3 Telegram group](https://hardhat.org/hardhat3-telegram-group) or open an issue in the [GitHub issue tracker](https://github.com/NomicFoundation/hardhat/issues/new).

---

## Project Architecture & Overview

This repository contains the following core components:

- **`TestToken.sol`**: An ERC-20 test token featuring a built-in 24-hour rate-limited faucet mechanism to supply users with free testing tokens.
- **`TestTokenFactory.sol`**: Automatically deploys 5 distinct test tokens (*Alpha, Beta, Gamma, Delta, Omega*) in a single transaction for immediate ecosystem experimentation.
- **`BaseAMM.sol`**: A constant-product liquidity pool contract ($x \cdot y = k$) that inherits from ERC-20 to act as its own LP token, featuring a 0.3% swap fee accruing directly to liquidity providers.
- **`AMMFactory.sol`**: Deploys, sorts, and tracks unique liquidity pool pairs with built-in duplicate prevention.
- **Comprehensive TypeScript Test Suite (`20+ tests`)**: Covers factory deployment, faucet cooldown guardrails, liquidity additions/removals, exact-output swaps, slippage protection, and constant-product invariant fuzz testing.

---

## Getting Started & Usage

### Installation

Clone the repository and install dependencies using your preferred package manager:

```shell
npm install
```

### Running Tests

To run the complete test suite (including negative tests and fuzz invariants) across your Hardhat 3 configuration:

```shell
npx hardhat test
```

You can also run specific profiles or test runners as supported by your Hardhat 3 setup.

---

### Deploying Contracts

#### 1. Local Simulation Network
To deploy your contracts or test migrations locally using Hardhat 3's simulated environments:

```shell
npx hardhat ignition deploy ignition/modules/DeployAMM.ts
```

#### 2. Sepolia Testnet Deployment
To deploy your project to the Sepolia testnet, you must configure your private key and RPC provider URL via Hardhat's configuration variables or keystore plugin.

Set your Sepolia private key using `hardhat-keystore`:

```shell
npx hardhat keystore set SEPOLIA_PRIVATE_KEY
```

Set your Sepolia RPC URL if not already defined in your config:

```shell
npx hardhat keystore set SEPOLIA_RPC_URL
```

Once configured, run the deployment targeting Sepolia:

```shell
npx hardhat ignition deploy --network sepolia ignition/modules/DeployAMM.ts
```