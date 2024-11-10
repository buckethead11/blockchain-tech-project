import React, { useEffect, useState } from 'react';

const TokenDistribution = ({ auctionEnded, auctionContract, web3, TokenABI }) => {
  const [distributedTokens, setDistributedTokens] = useState([]);
  const [remainingTokens, setRemainingTokens] = useState(0);

  useEffect(() => {
    const getDistribution = async () => {
      if (!auctionContract || !auctionEnded || !TokenABI) {
        console.log("Missing requirements:", { auctionContract: !!auctionContract, auctionEnded, TokenABI: !!TokenABI });
        return;
      }

      try {
        console.log("Getting distribution data...");
        
        // Get token contract
        const tokenAddress = await auctionContract.methods.auctionToken().call();
        console.log("Token address:", tokenAddress);
        const tokenContract = new web3.eth.Contract(TokenABI, tokenAddress);

        // Try getting bid data from events
        const purchaseEvents = await auctionContract.getPastEvents('TokensPurchased', {
          fromBlock: 0,
          toBlock: 'latest'
        });

        console.log("Purchase events:", purchaseEvents);

        const distribution = await Promise.all(
          purchaseEvents.map(async (event) => {
            const { bidder, amountInvested, tokensToBeAllocated } = event.returnValues;
            const tokenBalance = await tokenContract.methods.balanceOf(bidder).call();
            
            return {
              address: bidder,
              bidAmount: web3.utils.fromWei(amountInvested, 'ether'),
              tokensAllocated: Number(web3.utils.toWei(tokenBalance, 'wei'))
            };
          })
        );

        console.log("Distribution data:", distribution);
        setDistributedTokens(distribution);

        // Get remaining tokens in contract
        const contractBalance = await tokenContract.methods
          .balanceOf(auctionContract.options.address)
          .call();
        const remainingTokensValue = web3.utils.fromWei(contractBalance, 'ether');
        console.log("Remaining tokens:", remainingTokensValue);
        setRemainingTokens(remainingTokensValue);

      } catch (error) {
        console.error("Error fetching distribution:", error);
        console.error("Error details:", error.message);
      }
    };

    getDistribution();
  }, [auctionContract, auctionEnded, web3, TokenABI]);

  return (
    <div className="p-4 bg-background text-textWhite rounded-lg w-full">
      <h2 className="text-2xl font-bold">Token Distribution</h2>
      {auctionEnded ? (
        <div>
          {distributedTokens.length > 0 ? (
            <>
              <table className="w-full mt-4 text-left">
                <thead>
                  <tr className="border-b border-gray-500">
                    <th className="p-2">Address</th>
                    <th className="p-2">Bid Amount (ETH)</th>
                    <th className="p-2">Tokens Allocated</th>
                  </tr>
                </thead>
                <tbody>
                  {distributedTokens.map((bid, index) => (
                    <tr key={index} className="border-b border-gray-700">
                      <td className="p-2">{bid.address}</td>
                      <td className="p-2">{bid.bidAmount} ETH</td>
                      <td className="p-2">{bid.tokensAllocated} ATK</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {Number(remainingTokens) > 0 && (
                <p className="mt-4 text-yellow-500">
                  Remaining tokens in contract: {remainingTokens} ATK
                </p>
              )}
            </>
          ) : (
            <p>No tokens have been distributed yet.</p>
          )}
        </div>
      ) : (
        <p>Auction is ongoing. Tokens will be distributed once the auction ends.</p>
      )}
    </div>
  );
};

export default TokenDistribution;