# 🚀 DEX AMM Project

## 📌 Overview
This project implements a simplified **Decentralized Exchange (DEX)** using the **Automated Market Maker (AMM)** model inspired by **Uniswap V2**.

The DEX enables decentralized, permissionless token trading **without order books** by relying on **liquidity pools** and the **constant product formula**.

### Users can:
- Provide liquidity and earn LP tokens
- Remove liquidity proportionally
- Swap between two ERC-20 tokens
- Earn trading fees as liquidity providers

---

## ✨ Features
- Initial and subsequent liquidity provision
- Liquidity removal with proportional share calculation
- Token swaps using constant product formula (`x * y = k`)
- **0.3% trading fee** distributed to liquidity providers
- LP token minting and burning
- Full event emission for all state-changing actions
- Comprehensive automated test suite (**27 test cases**)

---

## 🏗️ Architecture
The project follows a **single-pair AMM design** similar to Uniswap V2.

### Core Components

#### `DEX.sol`
- Manages liquidity pools
- Handles swaps, pricing, and fee logic
- Tracks reserves and LP ownership

#### `MockERC20.sol`
- Simple ERC-20 token used for testing

#### Tests
- Validate liquidity logic, swaps, fees, pricing, edge cases, and events

#### Dockerized Environment
- Ensures reproducible builds and consistent test execution

> LP token logic is integrated directly into `DEX.sol` using internal accounting via mappings.

---

## 📐 Mathematical Implementation

### Constant Product Formula
x * y = k

yaml
Copy code

Where:
- `x` = reserve of Token A  
- `y` = reserve of Token B  
- `k` = constant  

After each swap:
- `k` never decreases
- Fees remain in the pool, so `k` slightly increases over time

---

### Fee Calculation (0.3%)
amountInWithFee = amountIn * 997
numerator = amountInWithFee * reserveOut
denominator = (reserveIn * 1000) + amountInWithFee
amountOut = numerator / denominator

yaml
Copy code

- 99.7% of input is used for swaps
- 0.3% remains in the pool, rewarding LPs

---

### LP Token Minting

#### Initial Liquidity
liquidityMinted = sqrt(amountA * amountB)

shell
Copy code

#### Subsequent Liquidity
amountB = (amountA * reserveB) / reserveA
liquidityMinted = (amountA * totalLiquidity) / reserveA

yaml
Copy code

---

### Liquidity Removal
amountA = (liquidityBurned * reserveA) / totalLiquidity
amountB = (liquidityBurned * reserveB) / totalLiquidity

yaml
Copy code

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js (v18 recommended)
- Docker & Docker Compose
- Git

### Installation
```bash
git clone <your-repo-url>
cd dex-amm
docker-compose up -d
docker-compose exec app npm run compile
docker-compose exec app npm test
docker-compose exec app npm run coverage
docker-compose down
🧪 Running Tests Locally
bash
Copy code
npm install
npm run compile
npm test
📄 Contract Addresses
Not deployed to a public testnet for this submission.

⚠️ Known Limitations
Supports only a single token pair

Slippage protection and deadlines are not implemented

Solidity coverage may fail in Docker due to a known Hardhat and solidity-coverage compatibility issue; all functional tests pass successfully

🔐 Security Considerations
Solidity ^0.8.x with built-in overflow protection

Input validation for zero amounts and insufficient liquidity

Reverts on invalid operations

Fees remain in pool to prevent value leakage

Events emitted after state changes

No external price oracles

✅ Verification Checklist
✔ Contracts compile successfully
✔ 27 automated tests passing
✔ All required function signatures match exactly
✔ Docker build and execution succeed
✔ Repository structure follows specification

🏁 Conclusion
This project demonstrates a complete, secure, and well-tested AMM-based DEX implementation, faithfully following Uniswap-style mechanics.