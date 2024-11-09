import React, { useEffect, useState } from 'react';

const AuctionInfo = ({ auctionData, auctionEnded }) => {
  const { tokenName, totalSupply, initialPrice, reservePrice, timeLeft } = auctionData;

  // Format time as minutes and seconds
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="p-4 bg-background text-textWhite rounded-lg w-4/5 h-4/5">
      <h2 className="text-2xl text-textWhite font-bold">Auction Information</h2>
      <p>Token Name: {tokenName || 'Loading...'}</p>
      <p>Total Supply: {totalSupply}</p>
      <p>Initial Price: {initialPrice} ETH</p>
      <p>Reserve Price: {reservePrice} ETH</p>
      <p>Time Remaining: {auctionEnded ? "Auction Ended" : formatTime(timeLeft)}</p>
    </div>
  );
};

export default AuctionInfo;
