// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract AuctionToken is ERC20Burnable {
    constructor(uint256 initialSupply) ERC20("AuctionToken", "ATK") {
        _mint(msg.sender, initialSupply);
    }
}
