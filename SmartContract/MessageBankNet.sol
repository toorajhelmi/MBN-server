pragma solidity ^0.4.21; //tells that the source code is written for Solidity version 0.4.21 or anything newer that does not break functionality
contract MessageBankNet {
    address public minter;
    mapping (address => uint) public balances;
    mapping (address => string) public messages;
    event Sent(address from, address to, uint amount, string message);
 
    constructor() public {
        minter = msg.sender;
    }
    
    function mint(address receiver, uint amount) public {
        if(msg.sender != minter) return;      
        
        balances[receiver] += amount;
    }
    
    function send(address receiver, uint amount, string message) public {
        if(balances[msg.sender] < amount) return;
        
        balances[msg.sender] -= amount;
        balances[receiver] += amount;
        messages[receiver] = message;
        emit Sent(msg.sender, receiver, amount, message);
    }
}
