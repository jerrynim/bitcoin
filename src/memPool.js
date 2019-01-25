const _ = require("lodash"),
  Transactions = require("./transaction");

const { validateTx } = Transactions;

let mempool = [];

const getTxInsInPool = (mempool) => {
  return _(mempool)
    .map((tx) => tx.txIns)
    .flatten()
    .value();
}; //mempool안의 txIns의 값 return

const isTxValidForPool = (tx, mempool) => {
  const txInsInPool = getTxInsInPool(mempool);

  const isTxInAlreadyInPool = (txIns, txIn) => {
    return _.find(txIns, (txInPool) => {
      return (
        txIn.txOutIndex === txInPool.txOutIndex &&
        txIn.txOutId === txInPool.txOutId
      );
    });
  }; //mempool안의 txIn과 txIns안의 txIn 비교하여 같은것을 출력

  for (const txIN of tx.txIns) {
    if (isTxInAlreadyInPool((txInsPool, txIn))) {
      return false;
    }
  }
  return true;
};

const addToMempool = (tx, uTxOutList) => {
  if (!validateTx(tx, uTxOutList)) {
    throw Error("This tx is invalid. Will not add it to pool");
  } else if (!isTxValidForPool(tx, mempool)) {
    throw Error("This tx is not valid for the pool. Will not add it.");
  }
  mempool.push(tx);
};

module.exports = {
  addToMempool
};
