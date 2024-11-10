// components/TokenBalance.js
import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import AuctionTokenABI from '../AuctionToken.json';

const TokenBalance = ({ web3, auctionContract }) => {
    const { account } = useWallet();
    const [tokenBalance, setTokenBalance] = useState('0');
    const [tokenAddress, setTokenAddress] = useState(null);

    const checkTokenBalance = async () => {
        try {
            if (!account || !auctionContract) return;

            // Get the token contract address
            const tokenAddress = await auctionContract.methods.auctionToken().call();
            setTokenAddress(tokenAddress);
            
            // Create token contract instance
            const tokenContract = new web3.eth.Contract(AuctionTokenABI.abi, tokenAddress);

            // Get balance
            const balance = await tokenContract.methods.balanceOf(account).call();
            const formattedBalance = web3.utils.fromWei(balance, 'ether');
            setTokenBalance(formattedBalance);

            console.log('Token Balance:', formattedBalance);
        } catch (error) {
            console.error('Error checking token balance:', error);
        }
    };

    const addTokenToMetaMask = async () => {
        try {
            if (!tokenAddress) return;

            const wasAdded = await window.ethereum.request({
                method: 'wallet_watchAsset',
                params: {
                    type: 'ERC20',
                    options: {
                        address: tokenAddress,
                        symbol: 'ATK',
                        decimals: 18,
                    },
                },
            });

            if (wasAdded) {
                console.log('Token was added to MetaMask');
            }
        } catch (error) {
            console.error('Error adding token to MetaMask:', error);
        }
    };

    const checkDistribution = async () => {
        try {
            const distribution = await auctionContract.methods.checkTokenDistribution().call();
            console.log("Token Distribution:");
            console.log("Contract Balance:", web3.utils.fromWei(distribution.contractBalance, 'ether'));
            
            distribution.bidders.forEach((bidder, index) => {
                console.log(
                    "Bidder:", bidder, 
                    "Tokens:", web3.utils.fromWei(distribution.biddersTokens[index], 'ether')
                );
            });
        } catch (error) {
            console.error("Error checking distribution:", error);
        }
    };
    

    useEffect(() => {
        if (account && auctionContract) {
            checkTokenBalance();
            checkDistribution();
        }
    }, [account, auctionContract]);

    return (
        <div className="p-4 bg-background text-textWhite rounded-lg">
            <h2 className="text-xl font-bold mb-4">Token Balance</h2>
            <div className="space-y-2">
                <p>Balance: {tokenBalance} ATK</p>
                <div className="flex space-x-2">
                    <button 
                        onClick={checkTokenBalance}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                    >
                        Refresh Balance
                    </button>
                    <button 
                        onClick={addTokenToMetaMask}
                        className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded"
                        disabled={!tokenAddress}
                    >
                        Add to MetaMask
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TokenBalance;