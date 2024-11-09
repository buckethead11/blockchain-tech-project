const AuctionToken = artifacts.require("AuctionToken");
const DutchAuction = artifacts.require("DutchAuction");

contract("Dutch Auction Test", (accounts) => {
    const [owner, bidder1, bidder2] = accounts;
    let auctionToken, dutchAuction;
    
    before(async () => {
        // Deploy the token and auction contracts
        auctionToken = await AuctionToken.deployed();
        dutchAuction = await DutchAuction.deployed();
    });

    describe("Initialization", () => {
        it("should initialize with the correct parameters", async () => {
            const initialPrice = await dutchAuction.initialPrice();
            const reservePrice = await dutchAuction.reservePrice();
            const priceDecreaseRate = await dutchAuction.priceDecreaseRate();
            const priceDecreaseInterval = await dutchAuction.priceDecreaseInterval();
            const totalTokens = await dutchAuction.totalTokens();
            assert.equal(initialPrice.toString(), web3.utils.toWei('1', 'ether'), "Initial price incorrect");
            assert.equal(reservePrice.toString(), web3.utils.toWei('0.1', 'ether'), "Reserve price incorrect");
            assert.isTrue(priceDecreaseRate.gt(0), "Price decrease rate should be greater than 0");
            assert.equal(priceDecreaseInterval.toNumber(), 60, "Price decrease interval incorrect");
            assert.equal(totalTokens.toNumber(), 1000, "Total tokens incorrect");
        });
    });

    describe("Auction Process", () => {
        it("should allow purchase of tokens at the correct price", async () => {
            const currentPrice = await dutchAuction.currentPrice();
            const amountToPurchase = web3.utils.toWei('1', 'ether'); // Assuming 1 ETH can buy at least one token.
            const result = await dutchAuction.buyTokens({ from: bidder1, value: amountToPurchase });
        
            assert(result.logs.length > 0, "No events were triggered.");
        
            const event = result.logs[0].event;
            assert.equal(event, "TokensPurchased", "Expected TokensPurchased event");
        
            const tokensPurchased = result.logs[0].args.tokensAllocated.toNumber();
            assert(tokensPurchased > 0, "No tokens were purchased");
        });

        it("should decrease the price over time", async () => {
            // Wait for one price decrease interval
            await new Promise(resolve => setTimeout(resolve, 60000));
            const decreasedPrice = await dutchAuction.currentPrice();
            assert(decreasedPrice.lt(web3.utils.toWei('1', 'ether')), "Price did not decrease after interval");
        });

        it("should refund excess money if too much is sent", async () => {
            const remainingTokens = await dutchAuction.totalTokens();
            const currentPrice = await dutchAuction.currentPrice();
            const excessAmount = web3.utils.toWei('10', 'ether');
            const result = await dutchAuction.buyTokens({from: bidder2, value: excessAmount});
            truffleAssert.eventEmitted(result, 'ExcessRefunded');
        });

        it("should end the auction when all tokens are sold", async () => {
            // Buy all remaining tokens
            const remainingTokens = await dutchAuction.totalTokens();
            const currentPrice = await dutchAuction.currentPrice();
            await dutchAuction.buyTokens({from: bidder2, value: remainingTokens.mul(currentPrice)});
            const ended = await dutchAuction.ended();
            assert.isTrue(ended, "Auction did not end after all tokens were sold");
        });
    });

    describe("Finalization", () => {
        it("should allow the seller to finalize the auction and withdraw funds", async () => {
            const beforeBalance = web3.utils.toBN(await web3.eth.getBalance(owner));
            await dutchAuction.finalizeAuction({from: owner});
            const afterBalance = web3.utils.toBN(await web3.eth.getBalance(owner));
            assert.isTrue(afterBalance.gt(beforeBalance), "Funds were not withdrawn");
        });

        it("should prevent non-seller from finalizing the auction", async () => {
            try {
                await dutchAuction.finalizeAuction({from: bidder1});
                assert.fail("Non-seller was able to finalize the auction");
            } catch (error) {
                assert.include(error.message, "revert", "Error should be reverted due to wrong sender");
            }
        });
    });
});
