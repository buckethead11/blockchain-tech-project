import Web3 from 'web3';
import DutchAuction from './DutchAuction.json';

let web3;
let auctionContract;

const init = async () => {
    web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));

    try {
        const accounts = await web3.eth.getAccounts();
        const deployerAccount = accounts[9];
        console.log("Available accounts:", accounts);
        console.log("Deployer account:", deployerAccount);

        const deployedAddress = '0x2b25941e67280A937589e407Ff22A3E34746B4EC';
        auctionContract = new web3.eth.Contract(DutchAuction.abi, deployedAddress);

        const seller = await auctionContract.methods.seller().call();
        console.log("Contract seller:", seller);
        console.log("Is deployer the seller?", deployerAccount.toLowerCase() === seller.toLowerCase());

        console.log("Contract initialized at:", deployedAddress);
        console.log("Contract methods:", Object.keys(auctionContract.methods));

        web3.eth.defaultAccount = deployerAccount;

        return true;
    } catch (error) {
        console.error("Initialization error:", error);
        throw error;
    }
};

// Don't auto-initialize
// init().catch(console.error);

export { web3, auctionContract, init };