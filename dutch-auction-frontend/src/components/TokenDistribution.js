import React, { useEffect, useState } from 'react';

const TokenDistribution = ({ auctionEnded, bids, tokenSupply }) => {
  const [distributedTokens, setDistributedTokens] = useState([]);
  const [remainingTokens, setRemainingTokens] = useState(tokenSupply);

  useEffect(() => {
    if (auctionEnded) {
      // Simulate token distribution logic
      let totalBidAmount = bids.reduce((acc, bid) => acc + bid.amount, 0);
      let distribution = bids.map(bid => ({
        address: bid.address,
        bidAmount: bid.amount,
        tokensAllocated: Math.floor((bid.amount / totalBidAmount) * tokenSupply),
      }));

      let allocatedTokens = distribution.reduce((acc, bid) => acc + bid.tokensAllocated, 0);
      setDistributedTokens(distribution);
      setRemainingTokens(tokenSupply - allocatedTokens);
    }
  }, [auctionEnded, bids, tokenSupply]);

  return (
    <div className="p-4 bg-background text-textWhite rounded-lg w-4/5">
      <h2 className="text-2xl font-bold">Token Distribution</h2>
      {auctionEnded ? (
        <div>
          <table className="w-full mt-4 text-left">
            <thead>
              <tr className="border-b border-gray-500">
                <th className="p-2">Address</th>
                <th className="p-2">Bid (ETH)</th>
                <th className="p-2">Tokens Allocated</th>
              </tr>
            </thead>
            <tbody>
              {distributedTokens.map((bid, index) => (
                <tr key={index} className="border-b border-gray-700">
                  <td className="p-2">{bid.address}</td>
                  <td className="p-2">{bid.bidAmount}</td>
                  <td className="p-2">{bid.tokensAllocated}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {remainingTokens > 0 && (
            <p className="mt-4 text-red-500">Remaining tokens ({remainingTokens}) will be burned.</p>
          )}
        </div>
      ) : (
        <p>Auction is ongoing. Tokens will be distributed once the auction ends.</p>
      )}
    </div>
  );
};

export default TokenDistribution;
