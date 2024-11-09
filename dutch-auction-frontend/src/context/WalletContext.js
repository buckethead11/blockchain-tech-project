// context/WalletContext.js
import React, { createContext, useState, useContext } from 'react';

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  const value = {
    account,
    setAccount,
    isConnected,
    setIsConnected
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);