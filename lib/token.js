const Web3 = require('web3')
const path = require('path')
const cjson = require('cjson')
const TX = require('ethereumjs-tx')
// contract details
const provider = 'https://rinkeby.infura.io/v3/f0a6038f68ee4073b16a510697c2ba41'
const contractAddress = '0xd93c810c1fdb19323225d9b21c00d590104393da'
const privateKey = new Buffer('105f0f5e8548fcdf1ecb1cdedb8e8690b3b9bfa60f6391069624776c06f97ae4', 'hex')

const defaultAccount = '0xc998ac75d5e5f171e358cb2f9aeb9738a92027d5'
const etherscanLink = 'https://rinkeby.etherscan.io/tx/'
// initiate the web3
const web3 = new Web3(provider)
// initiate the contract with null value
var contract = null;
// convert Wei to Eth
function convertWeiToEth(stringValue) {
    if (typeof stringValue != 'string') {
        stringValue = String(stringValue);
    }
    return web3.utils.fromWei(stringValue, 'ether');
}
// Initiate the Contract
function getContract() {
    if (contract === null) {
        var abi = cjson.load(path.resolve(__dirname, '../ABI/abi.json'));
        var c = new web3.eth.Contract(abi, contractAddress)
        contract = c.clone();
    }
    console.log('Contract Initiated successfully!')
    return contract;
}

// send token to Address
async function sendToken(req, res) {
    var address = req.body.address
    var tokens = Number(req.body.tokens)
    var message = req.body.message
    if (address && tokens) {
        const rawTrans = getContract().methods.send(address, tokens, message) // contract method 
        return res.send(await sendSignTransaction(rawTrans))
    } else {
        res.send({
            'message': 'Wallet address or no. of tokens is missing.'
        })
    }
}
// Mint/Create token to given address
async function mintToken(req, res) {
    var address = req.body.address
    var tokens = Number(req.body.tokens)
    if (address && tokens) {
        const rawTrans = getContract().methods.mint(address, tokens) // contract method 
        return res.send(await sendSignTransaction(rawTrans))
    } else {
        res.send({
            'message': 'Wallet address or no. of tokens is missing.',
        })
    }
}
// get the balance of given address
async function getBalance(req, res) {
    var address = req.query.address
    if (address) {
        // get the Ether balance of the given address
        var ethBalance = convertWeiToEth(await web3.eth.getBalance(address)) || '0'
        // get the token balance of the given address
        var tokenBalance = await getContract().methods.balances(address).call() || '0'
        // get the last message of the given address
        var messsage = await getContract().methods.messages(address).call() || ''
        // response data back to requestor
        return res.send({
            'ether': ethBalance,
            'token': tokenBalance,
            'message': messsage
        })
    }
}
// Send Signed Transaction
async function sendSignTransaction(rawTrans) {
    // Initiate values required by the dataTrans
    if (rawTrans) {
        var txCount = await web3.eth.getTransactionCount(defaultAccount) // needed for nonce
        var abiTrans = rawTrans.encodeABI() // encoded contract method 

        var gas = await rawTrans.estimateGas()
        var gasPrice = await web3.eth.getGasPrice()
        gasPrice = Number(gasPrice)
        gasPrice = gasPrice * 2
        var gasLimit = gas * 4
        // Initiate the transaction data
        var dataTrans = {
            nonce: web3.utils.toHex(txCount),
            gasLimit: web3.utils.toHex(gasLimit),
            gasPrice: web3.utils.toHex(gasPrice),
            to: contractAddress,
            data: abiTrans
        }

        // sign transaction
        var tx = new TX(dataTrans)
        tx.sign(privateKey)
        // after signing send the transaction
        return await sendSigned(tx)
    } else {
        throw new console.error('Encoded raw transaction was not given.');
    }

}
function sendSigned(tx) {
    return new Promise(function (resolve, reject) {
        // send the signed transaction
        web3.eth.sendSignedTransaction('0x' + tx.serialize().toString('hex'))
            .once('transactionHash', function (hash) {
                var result = {
                    'status': 'sent',
                    'url': etherscanLink + hash,
                    'message': 'click the given url to verify status of transaction'
                }
                // respond with the result
                resolve(result)
            })
            .then(out => { console.log(out) })
            .catch(err => {
                // respond with error
                reject(err)
            })
    })
}
module.exports = {
    send: sendToken,
    mint: mintToken,
    balance: getBalance
}