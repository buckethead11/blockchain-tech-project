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
        auctionEndTime = auctionStartTime.add(_duration);
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
        console.log("Balance of atk of contract", auctionToken.balanceOf(address(this)));

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
        // require(tokensToBuy > 0, "Insufficient funds to buy tokens");

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
        console.log("Timestamp in buy", block.timestamp);
        console.log("auctionEndTime in buy", auctionEndTime);
        if (totalTokens == 0 || block.timestamp >= auctionEndTime) {
            finalizeAuction();
            console.log("Auction Finalized");
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
    function finalizeAuction() public payable{
        console.log("entered finalize auction");
        console.log("Total Tokens", totalTokens);
        console.log("CurrentTime", block.timestamp);
        console.log("AuctionEndTime", auctionEndTime);
        
        // require(totalTokens == 0 || block.timestamp >= auctionEndTime, "End conditions not met");
        ended = true;

        console.log("Fetching Price");
        uint _finalPrice = currentPrice();
        console.log("Fetched Current Price", _finalPrice);
        uint totalTokensSold = 0; // Track total tokens sold to bidders
        uint totalRevenue = 0; // Track total revenue for seller
        console.log("Number of Bidders", bidderAddresses.length);

        for (uint i = 0; i < bidderAddresses.length; i++) {
            console.log("Handling user Number:" , i);
            Bidder storage bidder = bidders[bidderAddresses[i]];
            console.log(" user investedAmount:", bidder.investedAmount);
            console.log(" user tokensOwned:", bidder.tokensOwned);

            uint totalCost = bidder.tokensOwned.mul(_finalPrice);
            uint refund = bidder.investedAmount > totalCost ? bidder.investedAmount.sub(totalCost) : 0;

            if (refund > 0) {
                console.log("Contract Balance Before", (address(this).balance));
                console.log("Bidder Balance Before", (address(bidderAddresses[i]).balance));
                console.log("Refund", refund);
                payable(bidderAddresses[i]).transfer(refund);
                console.log("Contract Balance After", (address(this).balance));
                console.log("Bidder Balance After", (address(bidderAddresses[i]).balance));
            }

            console.log("Balance of atk of contract",auctionToken.balanceOf(address(this)));

            auctionToken.transfer(bidderAddresses[i], bidder.tokensOwned);
            emit TokensDistributed(bidderAddresses[i], bidder.tokensOwned, refund);

            console.log("Balance of atk of contract after transfer",auctionToken.balanceOf(address(this)));

            totalTokensSold = totalTokensSold.add(bidder.tokensOwned);
            totalRevenue = totalRevenue.add(totalCost);
        }

        // Transfer the total revenue to the seller
        console.log("seller Address", seller);
        console.log("Amount to seller", totalRevenue);
        console.log("Seller Balance Before", (address(seller).balance));
        console.log("Contract Balance Before", (address(this).balance));
        payable(seller).transfer(totalRevenue);
        console.log("Contract Balance After", (address(this).balance));
        console.log("Seller Balance After", (address(seller).balance));
        // emit AuctionEnded(_finalPrice);
    }

}
