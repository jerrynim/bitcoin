const CryptoJS = require("crypto-js"),
  hexToBinary = require("hex-to-binary");

const BLOCK_GENERATION_INTERVAL = 10;
const DIFFICULTY_ADJUSTMENT_INTERVAL = 10;

class Block {
  constructor(index, hash, previousHash, timestamp, data, difficulty, nonce) {
    this.index = index;
    this.hash = hash;
    this.previousHash = previousHash;
    this.timestamp = timestamp;
    this.data = data;
    this.difficulty = difficulty;
    this.nonce = nonce;
  }
}

const genesisBlock = new Block(
  0,
  "2C4CEB90344F20CC4C77D626247AED3ED530C1AEE3E6E85AD494498B17414CAC",
  null,
  1520312194,
  "This is the genesis!!",
  10,
  0
);

let blockchain = [genesisBlock];

const getNewestBlock = () => blockchain[blockchain.length - 1];

const getTimestamp = () => Math.round(new Date().getTime() / 1000);

const getBlockchain = () => blockchain;

const createHash = (index, previousHash, timestamp, data, difficulty, nonce) =>
  CryptoJS.SHA256(
    index + previousHash + timestamp + JSON.stringify(data) + difficulty + nonce
  ).toString();

const createNewBlock = (data) => {
  const previousBlock = getNewestBlock();
  const newBlockIndex = previousBlock.index + 1;
  const newTimestamp = getTimestamp();
  const difficulty = findDifficulty();
  const newBlock = findBlock(
    newBlockIndex,
    previousBlock.hash,
    newTimestamp,
    data,
    difficulty
  );
  addBlockToChain(newBlock);
  require("./p2p").broadcastNewBlock();
  return newBlock;
};

const findDifficulty = () => {
  const newestBlock = getNewestBlock();
  if (
    newestBlock.index % DIFFICULTY_ADJUSTMENT_INTERVAL === 0 &&
    newestBlock.index !== 0
  ) {
    return calculateNewDifficult(newestBlock, getBlockchain());
  } else {
    return newestBlock.difficulty;
  }
};

const calculateNewDifficult = (newestBlock, blockchain) => {
  const lastCalculateBlock =
    blockchain[blockchain.length - DIFFICULTY_ADJUSTMENT_INTERVAL];
  const timeExpected =
    BLOCK_GENERATION_INTERVAL * DIFFICULTY_ADJUSTMENT_INTERVAL;
  const timeTaken = newestBlock.timestamp - lastCalculateBlock.timestamp;
  if (timeTaken < timeExpected / 2) {
    return lastCalculateBlock.difficulty + 1;
  } else if (timeTaken > timeExpected * 2) {
    return lastCalculateBlock.difficulty - 1;
  } else {
    return lastCalculateBlock.difficulty;
  }
};

const findBlock = (index, previousHash, timestamp, data, difficulty) => {
  let nonce = 0;
  while (true) {
    console.log("Current nonce", nonce);
    const hash = createHash(
      index,
      previousHash,
      timestamp,
      data,
      difficulty,
      nonce
    );
    if (hashMatchesDifficulty(hash, difficulty)) {
      return new Block(
        index,
        hash,
        previousHash,
        timestamp,
        data,
        difficulty,
        nonce
      );
    }
    nonce++;
  }
};

const hashMatchesDifficulty = (hash, difficulty) => {
  const hashInBinary = hexToBinary(hash);
  const requiredZeros = "0".repeat(difficulty);
  console.log("Trying difficulty:", difficulty, "with hash", hashInBinary);
  return hashInBinary.startsWith(requiredZeros);
}; //해쉬를 2진수로 변환하여 00000으로 시작하는지 확인

const getBlocksHash = (block) =>
  createHash(
    block.index,
    block.previousHash,
    block.timestamp,
    block.data,
    block.difficulty,
    block.nonce
  );

const isBlockValid = (candidateBlock, latestBlock) => {
  if (!isBlockStructureValid(candidateBlock)) {
    console.log("The candidate block structure is not valid");
    return false;
  } else if (latestBlock.index + 1 !== candidateBlock.index) {
    console.log("The candidate block doesnt have a valid index");
    return false;
  } else if (latestBlock.hash !== candidateBlock.previousHash) {
    console.log(
      "The previousHash of the candidate block is not the hash of the latest block"
    );
    return false;
  } else if (getBlocksHash(candidateBlock) !== candidateBlock.hash) {
    console.log("The hash of this block is invalid");
    return false;
  } else if (isTimeStampVlid(candidateBlock, latestBlock)) {
    return false;
    console.log("The timestamp of this block is dodgy");
  }
  return true;
}; // 브록의 타입검증, 인덱스값 검증, 이전 해쉬값 검증, 계산된 해쉬값 검증

const isTimeStampVlid = (newBlock, oldBlock) => {
  return (
    oldBlock.timestamp - 60 < newBlock.timestamp &&
    newBlock.timestamp - 60 < getTimestamp()
  );
};

const isBlockStructureValid = (block) => {
  return (
    typeof block.index === "number" &&
    typeof block.hash === "string" &&
    typeof block.previousHash === "string" &&
    typeof block.timestamp === "number" &&
    typeof block.data === "string"
  );
}; //블록의 타입 검증

const isChainValid = (candidateChain) => {
  const isGenesisValid = (block) => {
    return JSON.stringify(block) === JSON.stringify(genesisBlock);
  };
  if (!isGenesisValid(candidateChain[0])) {
    console.log(
      "The candidateChains's genesisBlock is not the same as our genesisBlock"
    );
    return false;
  }
  for (let i = 1; i < candidateChain.length; i++) {
    if (!isBlockValid(candidateChain[i], candidateChain[i - 1])) {
      return false;
    }
  }
  return true;
}; //제네시스 블락을 비교 && 다음블락부터 검증

const replaceChain = (candidateChain) => {
  if (
    isChainValid(candidateChain) &&
    candidateChain.length > getBlockchain().length
  ) {
    blockchain = candidateChain;
    return true;
  } else {
    return false;
  }
}; //길이를 비교하여 길이가 긴것으로 대치한다

const addBlockToChain = (candidateBlock) => {
  if (isBlockValid(candidateBlock, getNewestBlock())) {
    blockchain.push(candidateBlock);
    return true;
  } else {
    return false;
  }
}; //후보블락을 블록체인에 푸쉬 한다.

module.exports = {
  getNewestBlock,
  getBlockchain,
  createNewBlock,
  isBlockStructureValid,
  addBlockToChain,
  replaceChain
};
