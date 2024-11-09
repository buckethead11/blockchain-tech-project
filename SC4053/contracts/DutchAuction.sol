// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./AuctionToken.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "hardhat/console.sol";

contract DutchAuction {
    using SafeMath for uint;

    AuctionToken public auctionToken;
    address payable public seller;
    uint public initialPrice;
    uint public reservePrice;
    uint public priceDecreaseRate;
    uint public priceDecreaseInterval;
    uint public auctionStartTime;
    uint public auctionEndTime;
    uint public totalTokens; // Total tokens available in the auction
    bool public ended;
    uint public finalPrice; // This will store the final confirmed price
    bool public isInitialized;

    struct Bidder {
        uint investedAmount; // Amount invested by the bidder
        uint tokensOwned;    // Tokens to be allocated to the bidder
    }

    mapping(address => Bidder) public bidders;
    address[] private bidderAddresses;

    event TokensPurchased(address bidder, uint amountInvested, uint tokensToBeAllocated);
    event TokensDistributed(address bidder, uint tokensAllocated, uint amountRefunded);
    event AuctionEnded(uint finalPrice);

     constructor(
        address _tokenAddress,
        uint _initialPrice,
        uint _reservePrice,
        uint _priceDecreaseRate,
        uint _priceDecreaseInterval,
        uint _duration,
        uint _totalTokens
    ) {
        auctionToken = AuctionToken(_tokenAddress);
        seller = payable(msg.sender);
        initialPrice = _initialPrice;
        reservePrice = _reservePrice;
        priceDecreaseRate = _priceDecreaseRate;
        priceDecreaseInterval = _priceDecreaseInterval;
        auctionStartTime = block.timestamp;
        auctionEndTime = auctionStartTime + _duration;
        totalTokens = _totalTokens;


        // // Transfer approved tokens from the seller to the contract
        // require(
        //     auctionToken.transferFrom(seller, address(this), totalTokens),
        //     "Token transfer to contract failed"
        // );

    }

    function initializeAuction(
        uint _initialPrice,
        uint _reservePrice,
        uint _priceDecreaseRate,
        uint _priceDecreaseInterval,
        uint _duration,
        uint _totalTokens
    ) external {
        require(msg.sender == seller, "Only the seller can initialize the auction");
        require(!isInitialized, "Auction is initialized");

        initialPrice = _initialPrice;
        reservePrice = _reservePrice;
        priceDecreaseRate = _priceDecreaseRate;
        priceDecreaseInterval = _priceDecreaseInterval;
        auctionStartTime = block.timestamp;
        auctionEndTime = auctionStartTime.add(_duration);
        totalTokens = _totalTokens;
        isInitialized = true;
    }

    // Calculate the current price based on time elapsed and decrease rate
    function currentPrice() public view returns (uint) {
        if (block.timestamp <= auctionEndTime) {
            uint elapsed = block.timestamp.sub(auctionStartTime);
            uint priceDecrease = (elapsed.div(priceDecreaseInterval)).mul(priceDecreaseRate);
            uint _currentPrice = initialPrice > priceDecrease ? initialPrice.sub(priceDecrease) : reservePrice;
            return _currentPrice > reservePrice ? _currentPrice : reservePrice;
        } else {
            return reservePrice;
        }
    }

    // Function to buy tokens at the current price
    function buyTokens() external payable {
        console.log("Seller");
        console.log(seller);
        console.log(block.timestamp);
        require(block.timestamp <= auctionEndTime, "Auction has already ended.");
        console.log(ended);
        require(!ended, "Auction already ended.");
        console.log(msg.value);
        require(msg.value > 0, "No ether sent");  // Check if value is greater than zero
        
        uint _currentPrice = currentPrice();
        console.log(_currentPrice);
        require(_currentPrice > 0, "Current price is zero");  // Ensure current price is non-zero

        uint tokensToBuy = msg.value.div(_currentPrice);
        console.log(tokensToBuy);
        require(tokensToBuy > 0, "Insufficient funds to buy tokens");

        if (tokensToBuy >= totalTokens) {
            tokensToBuy = totalTokens;
        }

        // Update bidder's record in the struct
        if (bidders[msg.sender].investedAmount == 0 && bidders[msg.sender].tokensOwned == 0) {
            bidderAddresses.push(msg.sender);
        }
        bidders[msg.sender].investedAmount = bidders[msg.sender].investedAmount.add(msg.value);
        bidders[msg.sender].tokensOwned = bidders[msg.sender].tokensOwned.add(tokensToBuy);
        totalTokens = totalTokens.sub(tokensToBuy);
        console.log(totalTokens);
        require(totalTokens >= 0, "Requested tokens exceed availability");

        emit TokensPurchased(msg.sender, msg.value, tokensToBuy);

        if (totalTokens == 0 || block.timestamp >= auctionEndTime) {
            finalizeAuction(_currentPrice);
        }
    }

    function resetAuction() external {
        require(msg.sender == seller, "Only seller can reset auction");
        require(totalTokens > 0 || ended, "Cannot reset ongoing auction");
        isInitialized = false;
        ended = false;
        delete finalPrice;
        delete auctionStartTime;
        delete auctionEndTime;
        // Reset bidder data
        for(uint i = 0; i < bidderAddresses.length; i++) {
            delete bidders[bidderAddresses[i]];
        }
        delete bidderAddresses;
    }


    // Finalize the auction, distribute tokens and refund excess funds
    function finalizeAuction(uint fP) private {
        console.log("entered finalize auction");
        ended = true;
        finalPrice = fP;

        uint totalTokensSold = 0; // Track total tokens sold to bidders
        uint totalRevenue = 0; // Track total revenue for seller

        for (uint i = 0; i < bidderAddresses.length; i++) {
            console.log(i);
            Bidder storage bidder = bidders[bidderAddresses[i]];
            console.log(bidder.investedAmount);
            console.log(bidder.tokensOwned);

            uint totalCost = bidder.tokensOwned.mul(finalPrice);
            uint refund = bidder.investedAmount > totalCost ? bidder.investedAmount.sub(totalCost) : 0;

            if (refund > 0) {
                payable(bidderAddresses[i]).transfer(refund);
            }

            console.log("Balance of atk of contract",auctionToken.balanceOf(address(this)));

            auctionToken.transfer(bidderAddresses[i], bidder.tokensOwned);
            emit TokensDistributed(bidderAddresses[i], bidder.tokensOwned, refund);

            totalTokensSold = totalTokensSold.add(bidder.tokensOwned);
            totalRevenue = totalRevenue.add(totalCost);
        }

        // Transfer the total revenue to the seller
        payable(seller).transfer(totalRevenue);
        emit AuctionEnded(finalPrice);
    }

}
