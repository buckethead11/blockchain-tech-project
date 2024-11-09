import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, BrowserRouter } from 'react-router-dom';
import AuctionInfo from './components/AuctionInfo';
import BidForm from './components/BidForm';
import TokenDistribution from './components/TokenDistribution';
import PriceDisplay from './components/PriceDisplay';
import BidSummary from './components/BidSummary';
import Notifications from './components/Notifications';
import { WalletProvider } from './context/WalletContext';
import MetaMaskLogin from './components/MetamaskLogin';
import Modal from './components/Modal';
import SellerForm from './components/SellerForm';
import Web3 from 'web3';
import { init } from './web3';
import AuctionTokenABI from './AuctionToken.json';
import DutchAuctionABI from './DutchAuction.json';

function App() {
  let web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
  const [auctionData, setAuctionData] = useState({
    tokenName: '',
    totalSupply: 0,
    initialPrice: 0,
    reservePrice: 0,
    timeLeft: 0,
  });
  const [isContractReady, setIsContractReady] = useState(false);
  const [auctionEnded, setAuctionEnded] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [bids, setBids] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDistribution, setShowDistribution] = useState(false);
  const [auctionContract, setAuctionContract] = useState();
  const [sellerAccount, setSellerAccount] = useState();
  const [diffTime, setErrorTime] = useState(0);

  // Define loadAuctionData outside useEffect
  async function loadAuctionData() {
    if (!auctionContract) {
      console.log("No auction contract available");
      return;
    }
    try {
      // Retrieve values from the contract
      const initialPriceBN = await auctionContract.methods.initialPrice().call();
      const currentPriceBN = await auctionContract.methods.currentPrice().call();
      const reservePriceBN = await auctionContract.methods.reservePrice().call();
      const totalTokensBN = await auctionContract.methods.totalTokens().call();
      const auctionStartTimeBN = await auctionContract.methods.auctionStartTime().call();
      const auctionEndTimeBN = await auctionContract.methods.auctionEndTime().call();

      // Convert contract values to human-readable formats
      const initialPrice = Number(web3.utils.fromWei(initialPriceBN, 'ether'));
      const currentPrice = Number(web3.utils.fromWei(currentPriceBN, 'ether'));
      const reservePrice = Number(web3.utils.fromWei(reservePriceBN, 'ether'));
      const totalTokens = Number(totalTokensBN);
      const auctionStartTime = Number(auctionStartTimeBN);
      const auctionEndTime = Number(auctionEndTimeBN);

      // Calculate the remaining time
      const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
      console.log("diffTime", diffTime);
      const timeLeft = auctionEndTime - currentTime; // Ensure no negative values

      // Account balances for display purposes
      const accounts = await web3.eth.getAccounts();
      const sampleAccount = sellerAccount;
      const balanceBeforeBN = await web3.eth.getBalance(sampleAccount);
      const contractBalanceBN = await web3.eth.getBalance(auctionContract.options.address);

      const balanceBefore = Number(web3.utils.fromWei(balanceBeforeBN, 'ether'));
      const contractBalance = Number(web3.utils.fromWei(contractBalanceBN, 'ether'));

      // Log data for debugging
      // Update state with loaded data
      setAuctionData({
        tokenName: "AuctionToken", // Placeholder or actual token name
        totalSupply: totalTokens,
        initialPrice: initialPrice,
        reservePrice: reservePrice, // Replace with actual reserve price if available
        timeLeft, // Display-friendly time remaining
      });

      setCurrentPrice(currentPrice);
      // setAuctionEnded(timeLeft <= 0); // Auction end status
      const isAuctionEnded = timeLeft <= 0 || totalTokens === 0;
      setAuctionEnded(isAuctionEnded);
      
    } catch (error) {
      console.error("Error loading contract data:", error.message || error);
      setNotifications(prev => [...prev, { 
        type: 'error', 
        message: `Failed to load auction data: ${error.message}` 
      }]);
    }
  }

  const handleBidPlaced = (newBid) => {
    setBids(prevBids => [...prevBids, newBid]);
  };

  useEffect(() => {
    
    loadAuctionData();
    const timer = setInterval(loadAuctionData, 1000); // Refresh data every second
    return () => clearInterval(timer); // Cleanup on component unmount
  }, [auctionContract]);
  useEffect(() => {
    if(auctionEnded){
      console.log(Date.now()/1000);
      var tx = auctionContract.methods.finalizeAuction().call({ from: sellerAccount ,  gas: 10000000 });
    }
  }, [auctionEnded]);
  // Use loadAuctionData in useEffect

  useEffect(() => {
    const initializeContract = async () => {
      try {
        await init(); // Wait for contract initialization
        setIsContractReady(true);
      } catch (error) {
        console.error("Error initializing contract:", error);
      }
    };

    initializeContract();
  }, []);

  useEffect(() => {
      loadAuctionData();
    
  }, [auctionContract]);



  async function initializeAuction(formValues) {
    console.log("initializeAuction called with values:", formValues);
    const { initialPrice, reservePrice, priceDecreaseInterval, duration, totalTokens } = formValues;

    try {
        setIsLoading(true);
        // const accounts = await web3.eth.getAccounts();
        // const sellerAccount = accounts[1]; // Use first connected account
        // setSellerAccount(sellerAccount);
        // Convert ETH values to wei
        const initialPriceWei = web3.utils.toWei(initialPrice.toString(), 'ether');
        const reservePriceWei = web3.utils.toWei(reservePrice.toString(), 'ether');
        
        // Validate values
        if (Number(reservePriceWei) >= Number(initialPriceWei)) {
            throw new Error("Reserve price must be less than initial price");
        }

        // Calculate price decrease rate
        const numIntervals = Math.floor(Number(duration) / Number(priceDecreaseInterval));
        if (numIntervals <= 0) {
            throw new Error("Invalid duration or interval");
        }
        const priceDecreaseRate = Math.floor((Number(initialPriceWei) - Number(reservePriceWei)) / numIntervals).toString();

        console.log("=== INITIALIZATION PARAMETERS ===");
        console.log({
            initialPriceWei,
            reservePriceWei,
            priceDecreaseRate,
            priceDecreaseInterval,
            duration,
            totalTokens
        });

      console.log("setting up tokens");



        // const DutchAuction = artifacts.require("DutchAuction");
        // const AuctionToken = artifacts.require("AuctionToken");

        const AuctionToken = new web3.eth.Contract(AuctionTokenABI.abi);

        const tokenInstance = await AuctionToken.deploy({
          data: AuctionTokenABI.bytecode,
          arguments: [totalTokens],
      }).send({ from: sellerAccount ,  gas: 5000000 });
        // Call contract function with estimated gas
      console.log("setting up auction");
      const tokenAddress = tokenInstance.options.address?.toString();

      const DutchAuction = new web3.eth.Contract(DutchAuctionABI.abi);
      const auctionContract = await DutchAuction.deploy({
        data: DutchAuctionABI.bytecode,
        arguments: [
          tokenAddress,
          initialPriceWei,
          reservePriceWei,
          priceDecreaseRate,
          priceDecreaseInterval,
          duration,
          totalTokens,
        ],
      }).send({ from: sellerAccount, gas: 6000000 });
      var solidityTime = await auctionContract.methods.auctionStartTime().call();
      solidityTime = Number(solidityTime);
      var jsTime = Math.round(Date.now()/1000);
      var errorTime = jsTime - solidityTime;
      console.log("JSTIme", jsTime);
      console.log("solidityTime", solidityTime);
      setErrorTime(errorTime);
      console.log("Contract deployed");
            // Approve the DutchAuction contract to transfer tokens on behalf of the seller
        await tokenInstance.methods.approve(auctionContract.options.address, totalTokens)
            .send({ from: sellerAccount });
        
        // Add .methods. here too
        await tokenInstance.methods.transfer(auctionContract.options.address, totalTokens)
            .send({ from: sellerAccount });
        
      console.log("DutchAuction deployed with AuctionToken approved and tokens transferred.");

       setAuctionContract(auctionContract);
      

        console.log("Contract Deployed At:", auctionContract.options.address);
        console.log("Auction Token Deployed At:", tokenAddress);
        
        // Verify initialization

        setNotifications(prev => [...prev, { 
            type: 'success', 
            message: 'Auction initialized successfully' 
        }]);
        
        await loadAuctionData();
        
    } catch (error) {
        console.error('Error initializing auction:', error);
        let errorMessage = error.message;
        
        // Try to get more detailed error information
        if (error.receipt) {
            console.log("Transaction receipt:", error.receipt);
        }
        
        if (error.message.includes("revert")) {
            errorMessage = "Transaction reverted. Possible causes:\n" +
                "1. You are not the seller\n" +
                "2. Auction is already initialized\n" +
                "3. Invalid parameters";
        }
        
        setNotifications(prev => [...prev, { 
            type: 'error', 
            message: errorMessage
        }]);
    } finally {
        setIsLoading(false);
    }
}

  async function resetAuction() {
        
  };



  return (
    <WalletProvider>
    <BrowserRouter>
      <div className="h-screen bg-background text-textWhite flex flex-col">
      <header className="py-2 bg-primary text-textWhite flex items-center justify-between px-4">
  <div className="w-1/3 text-left">
    <MetaMaskLogin />
  </div>
  <h1 className="text-2xl font-bold text-center w-1/3">Crypto Dutch Auction</h1>
  <nav className="w-1/3 text-right">
    <Link to="/" className="px-4">Home</Link>
    <Link to="/setup" className="px-4">Seller Setup</Link>
  </nav>
</header>      
  <Routes>
          <Route
            path="/"
            element={
              <div className="flex-1 p-4 grid grid-cols-3 gap-4 h-[calc(100vh-4rem)]">
                <div className="col-span-2 bg-primary p-4 rounded-lg shadow">
                  <AuctionInfo auctionEnded={auctionEnded} auctionData={auctionData} />
                </div>
                <div className="bg-primary p-4 rounded-lg shadow">
                  <PriceDisplay currentPrice={currentPrice} auctionContract={auctionContract} web3={web3}/>
                </div>
                <div className="bg-primary p-4 rounded-lg shadow">
                  <BidForm currentPrice={currentPrice} onBidPlaced={handleBidPlaced} auctionContract={auctionContract} web3={web3}/>
                </div>
                <div className="col-span-2 bg-primary p-4 rounded-lg shadow">
                  <BidSummary bids={bids} />
                </div>
              </div>
            }
          />
          <Route
            path="/setup"
            element={<SellerForm onSubmit={initializeAuction} onReset={resetAuction} isLoading={isLoading} setSellerAccount={setSellerAccount}/>}
          />
        </Routes>

        <Modal isOpen={showDistribution} onClose={() => setShowDistribution(false)}>
          <TokenDistribution 
            auctionEnded={auctionEnded} 
            bids={bids} 
            tokenSupply={auctionData.totalSupply} 
          />
        </Modal>
      </div>
    </BrowserRouter>
    </WalletProvider>
  );
}

export default App;
