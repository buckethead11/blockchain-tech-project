import React, { useEffect, useState } from 'react';
import { web3, auctionContract } from '../web3';

const PriceDisplay = () => {
  const [priceInfo, setPriceInfo] = useState({
    currentPrice: 0,
    initialPrice: 0,
    reservePrice: 0,
    startTime: 0,
    endTime: 0,
    decreaseInterval: 0,
    decreaseRate: 0,
    isInitialized: false
  });

  const calculateCurrentPrice = (now) => {
    if (!priceInfo.isInitialized) return 0;

    const elapsedSeconds = now - priceInfo.startTime;
    const intervals = Math.floor(elapsedSeconds / priceInfo.decreaseInterval);
    const totalDecrease = intervals * priceInfo.decreaseRate;
    
    return Math.max(
      priceInfo.initialPrice - totalDecrease,
      priceInfo.reservePrice
    );  
  };

  useEffect(() => {
    const updatePrice = async () => {
      try {
        if (!auctionContract) return;

        const isInitialized = await auctionContract.methods.isInitialized().call();
        if (!isInitialized) {
          // Reset the price info state when auction is not initialized
          setPriceInfo({
            currentPrice: 0,
            initialPrice: 0,
            reservePrice: 0,
            startTime: 0,
            endTime: 0,
            decreaseInterval: 0,
            decreaseRate: 0,
            isInitialized: false  // This will trigger the loading state
          });
          return;
        }
    
        // Get contract values
        const initialPriceBN = await auctionContract.methods.initialPrice().call();
        const reservePriceBN = await auctionContract.methods.reservePrice().call();
        const decreaseRateBN = await auctionContract.methods.priceDecreaseRate().call();
        const startTime = await auctionContract.methods.auctionStartTime().call();
        const endTime = await auctionContract.methods.auctionEndTime().call();
        const decreaseInterval = await auctionContract.methods.priceDecreaseInterval().call();

        // Convert values
        const initialPrice = parseFloat(web3.utils.fromWei(initialPriceBN, 'ether'));
        const reservePrice = parseFloat(web3.utils.fromWei(reservePriceBN, 'ether'));
        const decreaseRate = parseFloat(web3.utils.fromWei(decreaseRateBN, 'ether'));
        
        // Calculate current price
        const now = Math.floor(Date.now() / 1000);
        const elapsedSeconds = Math.max(0, now - Number(startTime));
        const intervals = Math.floor(elapsedSeconds / Number(decreaseInterval));
        const currentPrice = Math.max(
          initialPrice - (intervals * decreaseRate),
          reservePrice
        );

        console.log("Price Update:", {
          currentPrice,
          initialPrice,
          reservePrice,
          decreaseRate,
          intervals,
          elapsedSeconds
        });

        setPriceInfo({
          currentPrice,
          initialPrice,
          reservePrice,
          startTime: Number(startTime),
          endTime: Number(endTime),
          decreaseInterval: Number(decreaseInterval),
          decreaseRate,
          isInitialized: true
        });
      } catch (error) {
        console.error("Error updating price:", error);
      }
    };

    // Update immediately and then every second
    updatePrice();
    const interval = setInterval(updatePrice, 1000);
    return () => clearInterval(interval);
  }, []);


  // Separate interval for UI updates
  useEffect(() => {
    if (!priceInfo.isInitialized) return;

    const updatePrice = () => {
      const now = Math.floor(Date.now() / 1000);
      const currentPrice = calculateCurrentPrice(now);
      setPriceInfo(prev => ({
        ...prev,
        currentPrice
      }));
    };

    const uiInterval = setInterval(updatePrice, 1000);
    return () => clearInterval(uiInterval);
  }, [priceInfo.isInitialized, priceInfo.initialPrice, priceInfo.decreaseRate, priceInfo.decreaseInterval]);

  const timeUntilNextDecrease = () => {
    if (!priceInfo.isInitialized) return 0;
    
    const now = Math.floor(Date.now() / 1000);
    const elapsedSeconds = now - priceInfo.startTime;
    const currentInterval = Math.floor(elapsedSeconds / priceInfo.decreaseInterval);
    const nextDecreaseTime = (currentInterval + 1) * priceInfo.decreaseInterval + priceInfo.startTime;
    return nextDecreaseTime - now;
  };

  // If not initialized, show loading state
  if (!priceInfo.isInitialized) {
    return (
      <div className="p-4 bg-background text-textWhite rounded-lg w-4/5 h-4/5">
        <h2 className="text-2xl font-bold mb-4">Current Price</h2>
        <p>Loading auction data...</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-background text-textWhite rounded-lg w-4/5 h-4/5">
      <h2 className="text-2xl font-bold mb-4">Current Price</h2>
      <div className="space-y-2">
        <p className="text-3xl font-bold text-blue-400">
          {priceInfo.currentPrice?.toFixed(4) || "0.0000"} ETH
        </p>
        <div className="text-sm opacity-75">
          <p>Initial Price: {priceInfo.initialPrice?.toFixed(4) || "0.0000"} ETH</p>
          <p>Reserve Price: {priceInfo.reservePrice?.toFixed(4) || "0.0000"} ETH</p>
          <p>Price Decrease: {priceInfo.decreaseRate?.toFixed(4) || "0.0000"} ETH / {priceInfo.decreaseInterval || "0"}s</p>
          <p>Next decrease in: {timeUntilNextDecrease()}s</p>
        </div>
      </div>
    </div>
  );
};

export default PriceDisplay;