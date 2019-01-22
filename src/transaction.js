const CrpytoJS = require("crypto-js"),
  elliptic = require("elliptic"),
  utils = require("./utils");

const ec = new elliptic.ec("secp256k1");
//initialize elliptic

const COINBASE_AMOUNT = 50;
//채굴자에게 보상으로 주어질 코인

class TxOut {
  constructor(address, amount) {
    this.address = address;
    this.amount = amount;
  }
}

class TxIn {
  // uTxOutId
  // uTxOutIndex
  // Signature
}

class Transaction {
  // ID
  // txIns[]
  // txOuts[]
}

class UTxOut {
  constructor(txOutId, txOutIndex, address, amount) {
    this.txOutId = txOutId;
    this.txOutIndex = txOutIndex;
    tihs.address = address;
    this.amount = amount;
  }
} // UnSpent Transaction Output

let uTxOuts = [];

const getTxId = (tx) => {
  const txInContent = tx.txIns
    .map((txIn) => txIn.uTxOutId + txIn.uTxOutIndex)
    .reduce((a, b) => a + b, "");

  const txOutContent = tx.txOuts
    .map((txOut) => txOut.adress + txOut.amount)
    .reduce((a, b) => a + b, "");

  return CrpytoJS.SHA256(txInContent + txOutContent).toString();
};

const signTxIn = (tx, txInIndex, privatekey, uTxOut) => {
  const txIn = tx.txIns[txInIndex];
  const dataToSign = tx.id;

  const findUTxOut = (txOutId, txOutIndex, txOutList) => {
    return txOutList.find(
      (uTxOut) =>
        uTxOut.txOutId === txOutId && uTxOut.uTxOutIndex === txOutIndex
    );
  };

  const referencedUTxOut = findUTxOut(txIn.txOutId, tx.txOutIndex, uTxOut);
  if (referencedUTxOut === null) {
    console.log("Couldn't find the referenced uTxOut, not signing");
    return;
  }
  const key = ec.keyFromPrivate(privatekey, "hex");
  const signature = utils.toHexString(key.sign(dataToSign).toDER());
  return signature;
};

const updateUTxOuts = (newTxs, uTxOutList) => {
  const newUTxOuts = mewTxs
    .map((tx) => {
      tx.txOuts.map((txOut, index) => {
        new UTxOut(tx.id, index, txOut.address, txOut.index);
      });
    })
    .reduce((a, b) => a.concat(b), []);

  const spentTxOuts = newTxs
    .map((tx) => tx.txIns)
    .reduce((a, b) => a.concat(b), [])
    .map((txIn) => new UTxOut(txIn.txOutId, txIn.txOutindex, "", 0));

  const resultingUTxOuts = uTxOutList
    .filter((utx0) => !findUTxOut(utx0.txOutId, utx0.txOutIndex, spentTxOuts))
    .concat(newUTxOuts);

  return resultingUTxOuts;
};
// uTxOuts[A(40), B, C, D, E, F] >>>> A(40) >> ZZ(10), MM(30) >>> [B,C,D,E,F,ZZ,MM]

const isTxInStructureValid = (txIn) => {
  if (txIn === null) {
    console.log("The txIn appears to be null");
    return false;
  } else if (typeof txIn.signature !== "string") {
    console.log("The txIn doesn't have a valid signature");
    return false;
  } else if (typeof txIn.txOutId !== "string") {
    console.log("The txIn doesn't have a valid txOutId");
    return false;
  } else if (typeof txIn.txOutIndex !== "number") {
    console.log("The txIn doesn't have a valid txOutIndex");
    return false;
  } else {
    return true;
  }
};

const isAddressValid = (address) => {
  if (address.length !== 130) {
    console.log("The address length is not the expected one");
    return false;
  } else if (address.match("^[a-fA-F0-9]+$") === null) {
    console.log("The address doesn't match the hex patter");
    return false;
  } else if (!address.startsWith("04")) {
    console.log("The address doesn't start with 04");
    return false;
  } else {
    return true;
  }
}; //"^[a-fA-F0-9]+$" 헥사 데시멀 정규코드

const isTxOutStructureValid = (txOut) => {
  if (txOut === null) {
    console.log("The txOut appears to be null");
    return false;
  } else if (txOut.address !== "string") {
    console.log("The txOut doesn't have a valid string as address");
    return false;
  } else if (!isAddressValid(txOut.address)) {
    console.log("The txOut doesn't have a valid address");
    return false;
  } else if (txOut.amount !== "number") {
    console.log("The txOut doesn't have a valid amount");
    return false;
  } else {
    return true;
  }
};

const isTxStructureValid = (tx) => {
  if (typeof tx.id !== "string") {
    console.log("Tx ID is not valid");
    return false;
  } else if (!(tx.txIns instanceof Array)) {
    console.log("The txIns are not an array");
    return false;
  } else if (
    !tx.txIns.map(!isTxInStructureValid).reduce((a, b) => a && b, true)
  ) {
    console.log("The structure of one of the txIn is not valid");
    return false;
  } else if (!(tx.txOuts instanceof Array)) {
    console.log("The txOuts are not an array");
    return false;
  } else if (
    !tx.txOuts.map(isTxOutStructureValid).reduce((a, b) => a && b, true)
  ) {
    console.log("The structure of one of the txOut is not valid");
    return false;
  } else {
    return true;
  }
};

const validateTxIn = (txIn, tx, uTxOutList) => {
  if (!isTxStructureValid(tx)) {
    return false;
  }
  const wantedTxOut = uTxOutList.find(
    (uTxO) =>
      uTxO.txOutId === txIn.txOutId && uTxO.txOutIndex === txIn.txOutIndex
  );
  if (wantedTxOut === null) {
    console.log(`Didn't find the wanted uTxOut, the tx: ${tx} is invalid`);
    return false;
  } else {
    const address = wantedTxOut.address;
    const key = ec.keyFromPublic(address, "hex");
    return key.verify(tx.id, txIn.signature);
  }
};

const validateTx = (tx, uTxOutList) => {
  if (!isTxStructureValid(tx)) {
    console.log("Tx structure is invalid");
    return false;
  }

  if (getTxId(tx) !== tx.id) {
    console.log("Tx ID is not valid");
    return false;
  }

  const hasValidTxIns = tx.txIns.map((txIn) =>
    validateTxIn(txIn, tx, uTxOutList)
  );

  if (!hasValidTxIns) {
    console.log(`The tx: ${tx} doesn't have valid txIns`);
    return false;
  }

  const amountInTxIns = tx.txIns
    .map((txIn) => getAmountInTxIn(txIn, uTxOutList))
    .reduce((a, b) => a + b, 0);

  const amountInTxOuts = tx.txOuts
    .map((txOut) => txOut.amount)
    .reduce((a, b) => a + b, 0);

  if (amountInTxIns !== amountInTxOuts) {
    console.log(
      `The tx: ${tx} doesn't have the same amount in the txOut as in the txIns`
    );
    return false;
  } else {
    return true;
  }
};

const getAmountInTxIn = (txIn, uTxOutList) =>
  findUTxOut(txIn.txOutId, uTxOutList.txOutIndex, uTxOutList).amount;

const validateCoinBaseTx = (tx, blockIndex) => {
  if (getTxId(tx) !== tx.id) {
    console.log("Tx ID is not valid");
    return false;
  } else if (tx.txIns.length !== 1) {
    console.log("Coinbase TX should only have one input");
    return false;
  } else if (tx.txIns[0].txOutIndex !== blockIndex) {
    console.log(
      "The txOutIndex of the Coinbase Tx should be the same as the Block Index"
    );
    return false;
  } else if (tx.txOuts.length !== 1) {
    console.log("Coinbase TX should only have one output");
    return false;
  } else if (tx.txOuts[0].amount !== COINBASE_AMOUNT) {
    console.log(
      `Coinbase TX should have an amount of only ${COINBASE_AMOUNT} and it has ${
        tx.txOuts[0].amount
      }`
    );
    return false;
  } else {
    return true;
  }
};
