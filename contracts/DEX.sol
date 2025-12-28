// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @title AMM-based Decentralized Exchange
/// @notice Implements a Uniswap V2–style constant product AMM
contract DEX is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // -------------------------
    // State Variables
    // -------------------------
    address public tokenA;
    address public tokenB;

    uint256 public reserveA;
    uint256 public reserveB;

    uint256 public totalLiquidity;
    mapping(address => uint256) public liquidity;

    // -------------------------
    // Events (MUST match spec)
    // -------------------------
    event LiquidityAdded(
        address indexed provider,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidityMinted
    );

    event LiquidityRemoved(
        address indexed provider,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidityBurned
    );

    event Swap(
        address indexed trader,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    // -------------------------
    // Constructor
    // -------------------------
    /// @notice Initialize the DEX with two token addresses
    constructor(address _tokenA, address _tokenB) {
        require(_tokenA != _tokenB, "Same token");
        tokenA = _tokenA;
        tokenB = _tokenB;
    }

    // -------------------------
    // Liquidity Management
    // -------------------------

    /// @notice Add liquidity to the pool
    function addLiquidity(uint256 amountA, uint256 amountB)
        external
        nonReentrant
        returns (uint256 liquidityMinted)
    {
        require(amountA > 0 && amountB > 0, "Zero amount");

        IERC20(tokenA).safeTransferFrom(msg.sender, address(this), amountA);
        IERC20(tokenB).safeTransferFrom(msg.sender, address(this), amountB);

        if (totalLiquidity == 0) {
            // First liquidity provider sets initial price
            liquidityMinted = _sqrt(amountA * amountB);
        } else {
            // Maintain existing price ratio
            require(
                amountB * reserveA == amountA * reserveB,
                "Ratio mismatch"
            );

            liquidityMinted = (amountA * totalLiquidity) / reserveA;
        }

        require(liquidityMinted > 0, "Insufficient liquidity minted");

        liquidity[msg.sender] += liquidityMinted;
        totalLiquidity += liquidityMinted;

        reserveA += amountA;
        reserveB += amountB;

        emit LiquidityAdded(
            msg.sender,
            amountA,
            amountB,
            liquidityMinted
        );
    }

    /// @notice Remove liquidity from the pool
    function removeLiquidity(uint256 liquidityAmount)
        external
        nonReentrant
        returns (uint256 amountA, uint256 amountB)
    {
        require(liquidityAmount > 0, "Zero liquidity");
        require(liquidity[msg.sender] >= liquidityAmount, "Not enough LP");

        amountA = (liquidityAmount * reserveA) / totalLiquidity;
        amountB = (liquidityAmount * reserveB) / totalLiquidity;

        liquidity[msg.sender] -= liquidityAmount;
        totalLiquidity -= liquidityAmount;

        reserveA -= amountA;
        reserveB -= amountB;

        IERC20(tokenA).safeTransfer(msg.sender, amountA);
        IERC20(tokenB).safeTransfer(msg.sender, amountB);

        emit LiquidityRemoved(
            msg.sender,
            amountA,
            amountB,
            liquidityAmount
        );
    }

    // -------------------------
    // Swaps
    // -------------------------

    /// @notice Swap token A for token B
    function swapAForB(uint256 amountAIn)
        external
        nonReentrant
        returns (uint256 amountBOut)
    {
        require(amountAIn > 0, "Zero input");

        amountBOut = getAmountOut(amountAIn, reserveA, reserveB);
        require(amountBOut > 0, "Zero output");

        IERC20(tokenA).safeTransferFrom(
            msg.sender,
            address(this),
            amountAIn
        );
        IERC20(tokenB).safeTransfer(msg.sender, amountBOut);

        reserveA += amountAIn;
        reserveB -= amountBOut;

        emit Swap(
            msg.sender,
            tokenA,
            tokenB,
            amountAIn,
            amountBOut
        );
    }

    /// @notice Swap token B for token A
    function swapBForA(uint256 amountBIn)
        external
        nonReentrant
        returns (uint256 amountAOut)
    {
        require(amountBIn > 0, "Zero input");

        amountAOut = getAmountOut(amountBIn, reserveB, reserveA);
        require(amountAOut > 0, "Zero output");

        IERC20(tokenB).safeTransferFrom(
            msg.sender,
            address(this),
            amountBIn
        );
        IERC20(tokenA).safeTransfer(msg.sender, amountAOut);

        reserveB += amountBIn;
        reserveA -= amountAOut;

        emit Swap(
            msg.sender,
            tokenB,
            tokenA,
            amountBIn,
            amountAOut
        );
    }

    // -------------------------
    // View Functions
    // -------------------------

    /// @notice Get price of token A in terms of token B
    function getPrice() external view returns (uint256 price) {
        require(reserveA > 0, "No liquidity");
        price = reserveB / reserveA;
    }

    /// @notice Get current reserves
    function getReserves()
        external
        view
        returns (uint256 _reserveA, uint256 _reserveB)
    {
        return (reserveA, reserveB);
    }

    /// @notice Calculate output amount with 0.3% fee
    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) public pure returns (uint256 amountOut) {
        require(amountIn > 0, "Zero input");
        require(reserveIn > 0 && reserveOut > 0, "No liquidity");

        uint256 amountInWithFee = amountIn * 997;
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 1000) + amountInWithFee;

        amountOut = numerator / denominator;
    }

    // -------------------------
    // Internal Helpers
    // -------------------------
    function _sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
}
