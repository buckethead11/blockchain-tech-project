const AuctionToken = artifacts.require("AuctionToken");
const DutchAuction = artifacts.require("DutchAuction");

module.exports = async function (deployer, network, accounts) {
    const deployerAccount = accounts[0];
    const totalTokens = 100;
    const initialPrice = web3.utils.toWei('2', 'ether');      
    const reservePrice = web3.utils.toWei('0.1', 'ether');    
    const priceDecreaseInterval = 1;                          
    const duration = 200;                                     

    // Calculate the priceDecreaseRate safely using BigNumbers
    const initialPriceBN = web3.utils.toBN(initialPrice);
    const reservePriceBN = web3.utils.toBN(reservePrice);
    const numIntervals = Math.floor(duration / priceDecreaseInterval);
    const numIntervalsBN = web3.utils.toBN(numIntervals);
    const priceDecreaseRateBN = initialPriceBN.sub(reservePriceBN).div(numIntervalsBN);

    // Deploy AuctionToken
    await deployer.deploy(AuctionToken, totalTokens, { from: deployerAccount });
    const tokenInstance = await AuctionToken.deployed();
    console.log("Deployer account ", deployerAccount);

    // Deploy DutchAuction with only token address
    await deployer.deploy(DutchAuction, tokenInstance.address, { from: deployerAccount });
    const auctionInstance = await DutchAuction.deployed();

    // Initialize the auction with parameters
    await auctionInstance.initializeAuction(
        initialPriceBN.toString(),
        reservePriceBN.toString(),
        priceDecreaseRateBN.toString(),
        priceDecreaseInterval,
        duration,
        totalTokens,
        { from: deployerAccount }
    );

    // Approve the DutchAuction contract to transfer tokens
    await tokenInstance.approve(auctionInstance.address, totalTokens, { from: deployerAccount });

    // Transfer tokens to the auction contract
    await tokenInstance.transfer(auctionInstance.address, totalTokens, { from: deployerAccount });

    console.log("Initial Price:", initialPriceBN.toString());
    console.log("Reserve Price:", reservePriceBN.toString());
    console.log("Price Decrease Rate:", priceDecreaseRateBN.toString());
    console.log("Price Decrease Interval:", priceDecreaseInterval);
    console.log("Duration:", duration);
    console.log("Total Tokens:", totalTokens);
    console.log("DutchAuction deployed and initialized with AuctionToken approved and tokens transferred.");
};