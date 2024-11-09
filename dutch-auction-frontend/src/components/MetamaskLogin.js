import React, { useEffect } from 'react';
import { web3 } from '../web3';
import { useWallet } from '../context/WalletContext';

const MetaMaskLogin = () => {
  const { account, setAccount, isConnected, setIsConnected } = useWallet();

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const accounts = await ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        
        setAccount(accounts[0]);
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Error connecting to MetaMask:', error);
    }
  };

  const disconnectWallet = () => {
    setAccount('');
    setIsConnected(false);
  };

  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts'
        });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
        }
      }
    };

    checkConnection();
  }, [setAccount, setIsConnected]);

  return (
    <div className="flex items-center gap-2">
      {!isConnected ? (
        <button 
          onClick={connectWallet}
          className="bg-accent text-white px-4 py-2 rounded hover:bg-opacity-90"
        >
          Connect Wallet
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-white font-mono">
            {account.slice(0, 6)}...{account.slice(-4)}
          </span>
          <button 
            onClick={disconnectWallet}
            className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

export default MetaMaskLogin;