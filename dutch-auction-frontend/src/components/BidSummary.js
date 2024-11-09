import React from 'react';

const BidSummary = ({ bids }) => {
  const sortedBids = [...bids].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="p-4 bg-background text-textWhite rounded-lg w-4/5 h-4/5">
      <h2 className="text-2xl font-bold">Bid Summary</h2>
      {sortedBids.length > 0 ? (
        <table className="w-full mt-4 text-left">
          <thead>
            <tr className="border-b border-gray-500">
              <th className="p-2">Address</th>
              <th className="p-2">Bid Amount (ETH)</th>
              <th className="p-2">Price at Bid (ETH)</th>
            </tr>
          </thead>
          <tbody>
            {sortedBids.map((bid, index) => (
              <tr key={index} className="border-b border-gray-700">
                <td className="p-2">{bid.address}</td>
                <td className="p-2">{parseFloat(bid.amount).toFixed(4)} ETH</td>
                <td className="p-2">{parseFloat(bid.bidPrice).toFixed(4)} ETH</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="mt-4">No bids have been placed yet.</p>
      )}
    </div>
  );
};

export default BidSummary;