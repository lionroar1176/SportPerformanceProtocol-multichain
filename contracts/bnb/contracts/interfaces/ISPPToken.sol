// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title ISPPToken
 * @dev Interface for SPP Token with burn functionality
 */
interface ISPPToken is IERC20 {
    /**
     * @dev Burns tokens from the caller's balance
     * @param amount Amount of tokens to burn
     */
    function burn(uint256 amount) external;

    /**
     * @dev Burns tokens from a specific account
     * @param account Account to burn from
     * @param amount Amount to burn
     */
    function burnFrom(address account, uint256 amount) external;

    /**
     * @dev Mints new tokens (admin only)
     * @param to Recipient address
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external;

    /**
     * @dev Returns the total amount of tokens burned
     */
    function totalBurned() external view returns (uint256);

    /**
     * @dev Returns the circulating supply (total supply - burned)
     */
    function circulatingSupply() external view returns (uint256);
}
