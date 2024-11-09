import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';

const BidForm = ({ currentPrice, onBidPlaced, auctionContract, web3 }) => {
  const [bidAmount, setBidAmount] = useState('');
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { account, isConnected } = useWallet();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isConnected) {
      setMessage("Please connect your wallet first");
      return;
    }

    const bid = parseFloat(bidAmount);

    try {
        setIsLoading(true);

        if (!auctionContract) {
          setMessage("No auction contract available");
          return;
        }
        
        // Get all the price parameters we need
        const initialPriceBN = await auctionContract.methods.initialPrice().call();
        const reservePriceBN = await auctionContract.methods.reservePrice().call();
        const decreaseRateBN = await auctionContract.methods.priceDecreaseRate().call();
        const startTime = await auctionContract.methods.auctionStartTime().call();
        const decreaseInterval = await auctionContract.methods.priceDecreaseInterval().call();

        // Convert to ETH
        const initialPrice = parseFloat(web3.utils.fromWei(initialPriceBN, 'ether'));
        const reservePrice = parseFloat(web3.utils.fromWei(reservePriceBN, 'ether'));
        const decreaseRate = parseFloat(web3.utils.fromWei(decreaseRateBN, 'ether'));

        // Calculate current price at this exact moment
        const now = Math.floor(Date.now() / 1000);
        const elapsedSeconds = Math.max(0, now - Number(startTime));
        const intervals = Math.floor(elapsedSeconds / Number(decreaseInterval));
        const exactCurrentPrice = Math.max(
            initialPrice - (intervals * decreaseRate),
            reservePrice
        );

        console.log("Exact price at bid time:", {
            currentPrice: exactCurrentPrice,
            initialPrice,
            reservePrice,
            decreaseRate,
            intervals,
            elapsedSeconds
        });

        if (bid < exactCurrentPrice) {
          setMessage(`Error: Bid amount (${bid} ETH) is less than current price (${exactCurrentPrice.toFixed(4)} ETH)`);
          return;
      }

      const bidAmountWei = web3.utils.toWei(bidAmount.toString(), 'ether');

      const tx = await auctionContract.methods.buyTokens().send({
          from: account, // Use connected MetaMask account
          value: bidAmountWei,
          gas: 3000000
      });

      // Use the exact calculated price
      onBidPlaced({
          address: account, // Use connected MetaMask account
          amount: bid,
          bidPrice: exactCurrentPrice,
          timestamp: Date.now()
      });

      setMessage(`Success! Your bid of ${bid} ETH has been placed at price ${exactCurrentPrice.toFixed(4)} ETH`);
      setBidAmount('');
  } catch (error) {
        // ... error handling ...
    } finally {
        setIsLoading(false);
    }
};

return (
  <div className="p-4 bg-background rounded-lg text-white">
    <h2 className="text-2xl font-bold">Place Your Bid</h2>
    {!isConnected ? (
      <p className="mt-4 text-red-500">Please connect your wallet to place a bid</p>
    ) : (
      <form onSubmit={handleSubmit} className="mt-4">
        <input
          type="number"
          step="0.01"
          min="0"
          value={bidAmount}
          onChange={(e) => setBidAmount(e.target.value)}
          placeholder="Enter quantity in ETH"
          className="p-2 rounded border w-full text-black"
          disabled={isLoading}
        />
        <button 
          type="submit" 
          className={`mt-4 bg-accent text-white px-4 py-2 rounded ${isLoading ? 'opacity-50' : ''}`}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Submit Bid'}
        </button>
      </form>
    )}
    {message && <p className="mt-4">{message}</p>}
  </div>
);
};

export default BidForm;
