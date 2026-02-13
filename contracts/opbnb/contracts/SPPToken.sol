// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SPPToken
 * @dev Sport Performance Protocol Token with burn functionality
 *
 * Key Features:
 * - ERC-20 standard compliance
 * - Burnable tokens for deflationary mechanics
 * - Mintable by owner for rewards
 * - Integration with DeflatinaryBurn contract
 * - Tracks total burned for transparency
 */
contract SPPToken is ERC20, ERC20Burnable, Ownable {
    /// @dev Total tokens burned (for tracking)
    uint256 private _totalBurned;

    /// @dev Burn contract address (authorized to burn)
    address public burnContract;

    /// @dev Events
    event BurnContractUpdated(address indexed oldContract, address indexed newContract);
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);

    /**
     * @dev Constructor - Initialize with name, symbol, and initial supply
     * @param initialSupply Initial token supply (in wei, 18 decimals)
     */
    constructor(uint256 initialSupply)
        ERC20("Sport Performance Protocol Token", "SPP")
        Ownable(msg.sender)
    {
        _mint(msg.sender, initialSupply);
        _totalBurned = 0;
    }

    /**
     * @dev Set the burn contract address (only owner)
     * @param _burnContract Address of the DeflatinaryBurn contract
     */
    function setBurnContract(address _burnContract) external onlyOwner {
        require(_burnContract != address(0), "Invalid burn contract address");
        address oldContract = burnContract;
        burnContract = _burnContract;
        emit BurnContractUpdated(oldContract, _burnContract);
    }

    /**
     * @dev Mint new tokens (only owner)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    /**
     * @dev Burns tokens from caller's balance
     * @param amount Amount of tokens to burn
     */
    function burn(uint256 amount) public override {
        super.burn(amount);
        _totalBurned += amount;
        emit TokensBurned(msg.sender, amount);
    }

    /**
     * @dev Burns tokens from a specific account
     * Requires approval or must be called by burnContract
     * @param account Account to burn from
     * @param amount Amount to burn
     */
    function burnFrom(address account, uint256 amount) public override {
        // Allow burn contract to burn without approval
        if (msg.sender == burnContract) {
            _burn(account, amount);
            _totalBurned += amount;
            emit TokensBurned(account, amount);
        } else {
            // Otherwise, require approval
            super.burnFrom(account, amount);
            _totalBurned += amount;
            emit TokensBurned(account, amount);
        }
    }

    /**
     * @dev Get total tokens burned
     * @return Total amount of tokens burned
     */
    function totalBurned() external view returns (uint256) {
        return _totalBurned;
    }

    /**
     * @dev Get circulating supply (total supply - burned)
     * @return Circulating supply
     */
    function circulatingSupply() external view returns (uint256) {
        return totalSupply();
    }
}
