const CrpytoJS = require("crypto-js"),
  elliptic = require("elliptic"),
  utils = require("./utils");

const ec = new elliptic.ec("secp256k1");
//initialize elliptic

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
    return;
  }
  const key = ec.keyFromPrivate(privatekey, "hex");
  const signature = utils.toHexString(key.sign(dataToSign).toDER());
  return signature;
};
