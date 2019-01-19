const CrpytoJS = require("crypto-js");

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
  constructor(uTxOutId, uTxOutIndex, address, amount) {
    this.uTxOutId = uTxOutId;
    this.uTxOutIndex = uTxOutIndex;
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
