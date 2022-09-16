const TonWeb = require('tonweb');
const tonMnemonic = require('tonweb-mnemonic');
const { NftMarketplace , NftSale, NftItem} = TonWeb.token.nft;
const key =" " // your wallet key
const owner= "" // your wallet addr
const itemAddr = "" // your sales item addr
const collectionAddress="" // item collection

async function init() {
    const tonweb = new TonWeb(new TonWeb.HttpProvider('http://35.201.147.82/jsonRPC'));
    const mnemonic = key;
    const mnemonicArray = mnemonic.split(" ");
    const seed = await tonMnemonic.mnemonicToSeed(mnemonicArray);
    const keyPair = TonWeb.utils.nacl.sign.keyPair.fromSeed(seed);
    const WalletClass = tonweb.wallet.all['v3R2'];
    const wallet = new WalletClass(tonweb.provider, {
        publicKey: keyPair.publicKey,
        wc: 0
    });
    
    const walletAddress = new TonWeb.utils.Address(owner);
    const marketplace = new NftMarketplace(tonweb.provider, {ownerAddress: walletAddress});
    const marketplaceAddress = await marketplace.getAddress();
    console.log('matketplace address=', marketplaceAddress.toString(true, true, true));

    const deployMarketplace = async () => {
        const seqno = (await wallet.methods.seqno().call()) || 0;
        console.log({seqno})

        console.log(
            await wallet.methods.transfer({
                secretKey: keyPair.secretKey,
                toAddress: marketplaceAddress.toString(true, true, false), // non-bounceable
                amount: TonWeb.utils.toNano('1'),
                seqno: seqno,
                payload: null, // body
                sendMode: 3,
                stateInit: (await marketplace.createStateInit()).stateInit
            }).send()
        );
    }


    const nftItemAddress = new TonWeb.utils.Address(itemAddr);
    const nftCollectionAddress = new TonWeb.utils.Address(collectionAddress);
    const sale = new NftSale(tonweb.provider, {
        marketplaceAddress: marketplaceAddress,
        nftAddress: nftItemAddress,
        fullPrice: TonWeb.utils.toNano('5'),
        marketplaceFee: TonWeb.utils.toNano('0.03'),
        royaltyAddress: nftCollectionAddress,
        royaltyAmount: TonWeb.utils.toNano('0'),

    });

    const saleAddress =  await sale.getAddress();
    console.log('sale address', saleAddress.toString(true, true, true));
    const deploySale = async () => {
    const seqno = (await wallet.methods.seqno().call()) || 0;
    console.log({seqno})

    const amount = TonWeb.utils.toNano('0.01');

    const body = new TonWeb.boc.Cell();
    body.bits.writeUint(1, 32); // OP deploy new auction
    body.bits.writeCoins(amount);
    body.refs.push((await sale.createStateInit()).stateInit);
    body.refs.push(new TonWeb.boc.Cell());

    console.log(
        await wallet.methods.transfer({
            secretKey: keyPair.secretKey,
            toAddress: marketplaceAddress,
            amount: amount,
            seqno: seqno,
            payload: body,
            sendMode: 3,
        }).send()
    );
}

// await deployMarketplace();
await deploySale();


}


init()
