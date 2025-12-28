// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title Mock ERC20 Token for Testing
/// @notice Simple ERC20 token used for DEX testing
contract MockERC20 is ERC20 {
    constructor(string memory name, string memory symbol)
        ERC20(name, symbol)
    {
        _mint(msg.sender, 1_000_000 ether);
    }

    /// @notice Mint tokens for testing
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
