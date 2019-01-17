class Block {
  constructor(index, hash, previousHash, timestamp, data) {
    this.index = index;
    this.hash = hash;
    this.previousHash = previousHash;
    this.timestamp = timestamp;
    this.data = data;
  }
}

let blockchain = [genesisBlock];

const CreateNewBlock = (data) => {
  const previousBlock = getLastBlock();
  const newBlockIndex = previousBlock[blockchain.length + 1];
  const newTimestamp = getTimestamp();
};

const getLastBlock = () => blockchain[blockchain.length - 1];
const getTimestamp = () => Date().getTime() / 1000;
