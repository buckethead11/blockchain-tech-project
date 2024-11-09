import React, { useState, useEffect } from 'react';
import web3 from '../web3'; // Import the Web3 instance

// Replace with your actual contract ABI and deployed address
const contractABI = [
    {
      "inputs": [],
      "name": "storedData",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "x",
          "type": "uint256"
        }
      ],
      "name": "set",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "get",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function", 
      "constant": true
    }];

const contractAddress = '0xb8A59D81cAea180dB33C3e0a287334F10B279679';

const simpleStorage = new web3.eth.Contract(contractABI, contractAddress);

function SimpleStorageComponent() {
  const [storedData, setStoredData] = useState(null);
  const [inputValue, setInputValue] = useState('');

  // Fetch stored data from the contract on component load
  useEffect(() => {
    const fetchStoredData = async () => {
      const value = await simpleStorage.methods.get().call();
      setStoredData(value);
    };

    fetchStoredData();
  }, []);

  // Function to set a new value in the contract
  const handleSetData = async () => {
    const accounts = await web3.eth.getAccounts();
    await simpleStorage.methods.set(inputValue).send({ from: accounts[0] });
    setStoredData(inputValue); // Update UI after setting the value
  };

  return (
    <div className="p-6 bg-primary text-white rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Simple Storage Contract</h2>
      <p>Stored Value: {storedData !== null ? storedData : 'Loading...'}</p>

      <div className="mt-4">
        <input
          type="number"
          placeholder="Enter a new value"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="p-2 rounded border"
        />
        <button
          onClick={handleSetData}
          className="ml-2 bg-accent1 text-white px-4 py-2 rounded"
        >
          Set Value
        </button>
      </div>
    </div>
  );
}

export default SimpleStorageComponent;
