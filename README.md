# DEX AMM Project

## Overview
This project implements a simplified Decentralized Exchange (DEX) using an Automated Market Maker (AMM) model similar to Uniswap V2. It allows users to add/remove liquidity, swap between two ERC-20 tokens, and earn fees as liquidity providers.

## Features
- Initial and subsequent liquidity provision
- Liquidity removal with proportional share calculation
- Token swaps using constant product formula (x * y = k)
- 0.3% trading fee for liquidity providers
- LP token minting and burning (internally tracked)

## Architecture
The system consists of:
- `DEX.sol`: Core AMM logic, liquidity management, swaps, and pricing
- `MockERC20.sol`: ERC-20 token used for testing
- Hardhat-based test suite with 25+ test cases
- Dockerized execution environment

## Mathematical Implementation

### Constant Product Formula
The AMM follows:
x * y = k

markdown
Copy code
Where:
- x = reserve of token A
- y = reserve of token B
- k = constant value

### Fee Calculation
Each swap applies a 0.3% fee:
amountInWithFee = amountIn * 997
amountOut = (amountInWithFee * reserveOut) / (reserveIn * 1000 + amountInWithFee)

bash
Copy code
The fee remains in the pool, increasing k over time.

### LP Token Minting
- Initial liquidity:
liquidityMinted = sqrt(amountA * amountB)

diff
Copy code
- Subsequent liquidity:
liquidityMinted = (amountA * totalLiquidity) / reserveA

bash
Copy code

## Setup Instructions

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Git

### Installation (Docker)
```bash
git clone https://github.com/Chopra-14/dex-amm.git
cd dex-amm
docker-compose up -d
docker-compose exec app npm run compile
docker-compose exec app npm test
Running Locally
bash
Copy code
npm install
npm run compile
npm test
Contract Addresses
Not deployed to a public testnet.

Known Limitations
Single trading pair only

No slippage protection

No deadline parameter

Security Considerations
Uses Solidity 0.8+ overflow protection

Uses OpenZeppelin SafeERC20

Reentrancy protected using ReentrancyGuard

Input validation for all user-facing functions

