const token = require('../lib/token')
function init(app) {
 const path = '/token'
 
 // endpoint to create token to given address
 app.post(path+'/mintToken', token.mint)
 
 // endpoint to transfer token from Contract
 // there's must be existing token inside the contract to send token
 // otherwise, 0 token to send to give address
 app.post(path+'/sendToken', token.send)
 
 // check the balance of ether and token from given address
 app.get(path+'/getBalance', token.balance)
}
module.exports = init;