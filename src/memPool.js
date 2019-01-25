const _ = require("lodash"),
  Transactions = require("./transaction");

const { validateTx } = Transactions;

let memPool = [];

const getTxInsInPool = (memPool) => {
  return _(memPool)
    .map((tx) => tx.txIns)
    .flatten()
    .value();
}; //memPool안의 txIns의 값 return

const isTxValidForPool = (tx, memPool) => {
  const txInsInPool = getTxInsInPool(memPool);

  const isTxInAlreadyInPool = (txIns, txIn) => {
    return _.find(txIns, (txInPool) => {
      return (
        txIn.txOutIndex === txInPool.txOutIndex &&
        txIn.txOutId === txInPool.txOutId
      );
    });
  }; //memPool안의 txIn과 txIns안의 txIn 비교하여 같은것을 출력

  for (const txIN of tx.txIns) {
    if (isTxInAlreadyInPool((txInsPool, txIn))) {
      return false;
    }
  }
  return true;
};