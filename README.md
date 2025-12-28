🚀 DEX AMM Project
📌 Overview

This project implements a simplified Decentralized Exchange (DEX) using the Automated Market Maker (AMM) model inspired by Uniswap V2.

The DEX enables decentralized, permissionless token trading without order books by relying on liquidity pools and the constant product formula.

Users can:

Provide liquidity and earn LP tokens

Remove liquidity proportionally

Swap between two ERC-20 tokens

Earn trading fees as liquidity providers

✨ Features

Initial and subsequent liquidity provision

Liquidity removal with proportional share calculation

Token swaps using constant product formula (x * y = k)

0.3% trading fee distributed to liquidity providers

LP token minting and burning

Full event emission for all state-changing actions

Comprehensive automated test suite (27 test cases)

🏗️ Architecture

The project follows a single-pair AMM design similar to Uniswap V2.

Core Components
DEX.sol

Manages liquidity pools

Handles swaps, pricing, and fee logic

Tracks reserves and LP ownership

MockERC20.sol

Simple ERC-20 token used for testing

Tests

Validate liquidity logic, swaps, fees, pricing, edge cases, and events

Dockerized Environment

Ensures reproducible builds and consistent test execution

LP token logic is integrated directly into DEX.sol using internal accounting via mappings.

📐 Mathematical Implementation
Constant Product Formula

The pool invariant is defined as:

x * y = k


Where:

x = reserve of Token A

y = reserve of Token B

k = constant

After each swap:

k never decreases

Fees remain in the pool, so k slightly increases over time

Fee Calculation (0.3%)

A 0.3% fee is applied on every swap:

amountInWithFee = amountIn * 997
numerator = amountInWithFee * reserveOut
denominator = (reserveIn * 1000) + amountInWithFee
amountOut = numerator / denominator


Only 99.7% of input is used for swap calculation

0.3% remains in the pool, rewarding LPs

LP Token Minting
Initial Liquidity

For the first liquidity provider:

liquidityMinted = sqrt(amountA * amountB)


Sets the initial price

Establishes pool reserves

Subsequent Liquidity

Liquidity must follow the existing price ratio:

amountB = (amountA * reserveB) / reserveA


LP tokens minted:

liquidityMinted = (amountA * totalLiquidity) / reserveA

Liquidity Removal

LPs receive proportional reserves:

amountA = (liquidityBurned * reserveA) / totalLiquidity
amountB = (liquidityBurned * reserveB) / totalLiquidity

⚙️ Setup Instructions
Prerequisites

Node.js (v18 recommended)

Docker & Docker Compose

Git

Installation
1️⃣ Clone the repository
git clone <your-repo-url>
cd dex-amm

2️⃣ Start Docker environment
docker-compose up -d

3️⃣ Compile contracts
docker-compose exec app npm run compile

4️⃣ Run tests
docker-compose exec app npm test

5️⃣ Run coverage
docker-compose exec app npm run coverage

6️⃣ Stop Docker
docker-compose down

🧪 Running Tests Locally (Without Docker)
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

No external price oracles (AMM-based pricing only)

✅ Verification Checklist

✔ Contracts compile successfully
✔ 27 automated tests passing
✔ All required function signatures match exactly
✔ Docker build and execution succeed
✔ Repository structure follows specification
✔ Events emitted correctly
✔ Mathematical invariants preserved
✔ ≥25 test cases implemented

🏁 Conclusion

This project demonstrates a complete, secure, and well-tested AMM-based DEX implementation.
It faithfully follows Uniswap-style mechanics while remaining simple, readable, and production-aware.