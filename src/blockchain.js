const CryptoJS = require("crypto-js"),
  _ = require("lodash"),
  hexToBinary = require("hex-to-binary"),
  Transactions = require("./transaction"),
  Wallet = require("./wallet"),
  Mempool = require("./memPool");

const {
  getBalance,
  getPublicFromWallet,
  createTx,
  getPrivateFromWallet
} = Wallet;

const { createCoinbaseTx, processTxs } = Transactions;
const { addToMempool, getMempool, updateMemPool } = Mempool;

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

const genesisTx = {
  txIns: [{ signature: "", txOutId: "", txOutIndex: 0 }],
  txOuts: [
    {
      address:
        "04f20aec39b4c5f79355c053fdaf30410820400bb83ad93dd8ff16834b555e0f6262efba6ea94a87d3c267b5e6aca433ca89b342ac95c40230349ea4bf9caff1ed",
      amount: 50
    }
  ],
  id: "ad67c73cd8e98af6db4ac14cc790664a890286d4b06c6da7ef223aef8c281e76"
};

const genesisBlock = new Block(0, "", "", 1520312194, [genesisTx], 10, 0);

let blockchain = [genesisBlock];

let uTxOuts = processTxs(blockchain[0].data, [], 0);

const getNewestBlock = () => blockchain[blockchain.length - 1];

const getTimestamp = () => Math.round(new Date().getTime() / 1000);

const getBlockchain = () => blockchain;

const createHash = (index, previousHash, timestamp, data, difficulty, nonce) =>
  CryptoJS.SHA256(
    index + previousHash + timestamp + JSON.stringify(data) + difficulty + nonce
  ).toString();

const createNewBlock = () => {
  const coinbaseTx = createCoinbaseTx(
    getPublicFromWallet(),
    getNewestBlock().index + 1
  );
  const blockData = [coinbaseTx].concat(getMempool());
  return createNewRawBlock(blockData);
}; //퍼블릭키(주소)와 blockIndex로 coinbash생성후 블록생성

const createNewRawBlock = (data) => {
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
}; //블록체인에 블록을 추가하고 브로드캐스팅

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
}; //시간이 BLOCK_GENERATION_INTERVAL * DIFFICULTY_ADJUSTMENT_INTERVAL 의 두배미만 1/2이상으로 되도록 difficulty설정

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
}; //설정된 difficulty의 해쉬를 찾을때까지 nonce ++

const hashMatchesDifficulty = (hash, difficulty) => {
  const hashInBinary = hexToBinary(hash);
  const requiredZeros = "0".repeat(difficulty);
  console.log("Trying difficulty:", difficulty, "with hash", hashInBinary);
  return hashInBinary.startsWith(requiredZeros);
};

const getBlocksHash = (block) =>
  createHash(
    block.index,
    block.previousHash,
    block.timestamp,
    block.data,
    block.difficulty,
    block.nonce
  );

const isTimeStampValid = (newBlock, oldBlock) => {
  return (
    oldBlock.timestamp - 60 < newBlock.timestamp &&
    newBlock.timestamp - 60 < getTimestamp()
  );
};

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
  } else if (!isTimeStampValid(candidateBlock, latestBlock)) {
    console.log("The timestamp of this block is dodgy");
    return false;
  }
  return true;
}; // 브록의 타입검증, 인덱스값 검증, 이전 해쉬값 검증, 계산된 해쉬값 검증

const isBlockStructureValid = (block) => {
  return (
    typeof block.index === "number" &&
    typeof block.hash === "string" &&
    typeof block.previousHash === "string" &&
    typeof block.timestamp === "number" &&
    typeof block.data === "object"
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
    return null;
  }

  let foreignUTxOuts = [];

  for (let i = 0; i < candidateChain.length; i++) {
    const currentBlock = candidateChain[i];
    if (i !== 0 && !isBlockValid(currentBlock, currentBlock[i - 1])) {
      return null;
    }

    foreignUTxOuts = processTxs(
      currentBlock.data,
      foreignUTxOuts,
      currentBlock.index
    );

    if (foreignUTxOuts === null) {
      return null;
    }
  }
  return foreignUTxOuts;
}; //제네시스 블락을 비교 && 다음블락부터 검증

const sumDifficulty = (anyBlockchain) =>
  anyBlockchain
    .map((block) => block.difficulty)
    .map((difficulty) => Math.pow(2, difficulty))
    .reduce((a, b) => a + b);
//Math.pow(a,b) => a를 b번 곱한다

const replaceChain = (candidateChain) => {
  const foreignUTxOuts = isChainValid(candidateChain);
  const validChain = foreignUTxOuts !== null;
  if (
    validChain &&
    sumDifficulty(candidateChain) > sumDifficulty(getBlockchain())
  ) {
    blockchain = candidateChain;
    uTxOuts = foreignUTxOuts;
    updateMemPool(uTxOuts);
    require("./p2p").broadcastNewBlock();
    return true;
  } else {
    return false;
  }
}; //같은 체인인지 검증하고 difficulty의 합이 더큰것으로 교체

const addBlockToChain = (candidateBlock) => {
  if (isBlockValid(candidateBlock, getNewestBlock())) {
    const processedTxs = processTxs(
      candidateBlock.data,
      uTxOuts,
      candidateBlock.index
    );
    if (processedTxs === null) {
      console.log("Couldnt process txs");
      return false;
    } else {
      blockchain.push(candidateBlock);
      uTxOuts = processedTxs;
      updateMemPool(uTxOuts);
      return true;
    }
    return true;
  } else {
    return false;
  }
};

const getUTxOutList = () => _.cloneDeep(uTxOuts);
//uTxOuts는 update 되기때문에 복사하여 출력한다
const getAccountBalance = () => getBalance(getPublicFromWallet(), uTxOuts);

const sendTx = (address, amount) => {
  const tx = createTx(
    address,
    amount,
    getPrivateFromWallet(),
    getUTxOutList(),
    getMempool()
  );
  addToMempool(tx, getUTxOutList());
  require("./p2p").broadcastMempool();
  return tx;
};

const handleIncomingTx = (tx) => {
  addToMempool(tx, getUTxOutList());
};

module.exports = {
  getNewestBlock,
  getBlockchain,
  createNewBlock,
  isBlockStructureValid,
  addBlockToChain,
  replaceChain,
  getAccountBalance,
  sendTx,
  handleIncomingTx,
  getUTxOutList
};
