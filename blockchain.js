const SHA256 = require('crypto-js/sha256');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

class Transaction{
    constructor(fromAddress, toAddress, mileage, car_ID, car_comment, car_damage){
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.mileage = mileage;
        this.car_ID = car_ID;
        this.car_comment = car_comment;
        this.car_damage = car_damage;
    }
    calculateHash(){
        return SHA256(this.fromAddress + this.toAddress + this.mileage + this.car_ID + this.car_comment + this.car_damage).toString();
    }
    signTransaction(signingKey){
        if(signingKey.getPublic('hex') !== this.fromAddress){
            throw new Error('you cannot sign transaction for other wallets!');
        }

        const hashTx = this.calculateHash();
        const sig = signingKey.sign(hashTx, 'base64');
        this.signature = sig.toDER('hex');
    }

    isValid(){
        if(this.toAddress === null) return true;

        if(!this.signature || this.signature.length === 0){
            throw new Error('no signature in this transaction');
        }

        const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
        return publicKey.verify(this.calculateHash(), this.signature);
    }
}

class Block{
    constructor(timestamp, transactions, previousHash = ''){
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.hash = this.calculateHash();
        this.nounce = 0;
    }

    calculateHash(){
        return SHA256(this.index + this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.nounce ).toString();

    }

    mineBlock(difficulty){
        while(this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")){
            this.nounce++;
            this.hash = this.calculateHash();
        }

        console.log("Block mined: " + this.hash)
    }
    hasValidTransactions(){
        for(const tx of this.transactions){
            if(!tx.isValid()){
                return false;
            }
        }
        return true;
    }
}


class Blockchain{
    constructor(){
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 2;
        this.pendingTransactions = [];
        this.drivingReward = 100;
    }


    createGenesisBlock(){
        return new Block("10/01/2020", "Genesis block", "0");
    }

    getLatestBlock(){
        return this.chain[this.chain.length - 1];
    }

    minependingTransactions(miningRewardAddress){
        const rewardTx = new Transaction(miningRewardAddress, null, this.drivingReward, null, null, 0);
        this.pendingTransactions.push(rewardTx);

        let block = new Block(Date.now(), this.pendingTransactions, this.getLatestBlock().hash);
        block.mineBlock(this.difficulty);

        console.log('Block successfully mined!');
        this.chain.push(block);
        
    }
    addTranscation(transaction){

        if(!transaction.fromAddress || !transaction.toAddress){
            throw new Error('transaction must include from and to address');
        }
        if(!transaction.isValid()){
            throw new Error('cannot add invalid transaction to chain');
        }

        this.pendingTransactions.push(transaction);
    }

    getcreditoOfAddress(address){
        let credit_point = 0;
        for(const block of this.chain){
            for(const trans of block.transactions){

                if(trans.fromAddress === address){
                    credit_point += trans.mileage;
                    credit_point -= trans.car_damage;
                    
                }

                if(trans.toAddress === address){
                    credit_point -= trans.mileage;
                }
            
            }
        
        } return credit_point; 
  
    } 
    getratingOfcar(car_ID){
        let car_avg_comment = 0;
        let car_sum = 0;
        let count = 0;
        for(const block of this.chain){
            for(const trans of block.transactions){

                if(trans.car_ID === car_ID){
                    count += 1;
                    car_sum += trans.car_comment
                    car_avg_comment = car_sum/ count;
                    
                }

                
            }
        
        } return car_avg_comment; 
  
    } 

    isChainValid(){
        for(let i = 1; i < this.chain.length; i++){
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i -1];

            if(!currentBlock.hasValidTransactions()){
                return false;
            }

            if(currentBlock.hash !== currentBlock.calculateHash()){
                return false;
            }

            if(currentBlock.previousHash !== previousBlock.hash){
                return false;  
            }
        }

        return true;
    }
}

module.exports.Blockchain = Blockchain;
module.exports.Transaction = Transaction;



