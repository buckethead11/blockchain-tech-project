import Web3 from 'web3';
import DutchAuction from './DutchAuction.json';

let web3;
let auctionContract;

const init = async () => {
    web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));

    try {
        const accounts = await web3.eth.getAccounts();
        const deployerAccount = accounts[0];
        console.log("Available accounts:", accounts);
        console.log("Deployer account:", deployerAccount);

       
        console.log("Contract seller:", deployerAccount);


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