const elliptic = require("elliptic"),
  path = require("path"),
  fs = require("fs");

const ec = new elliptic.ec("secp256k1");

const privateKeyLocation = path.join(__dirname, "privateKey");

const generatePrivateKey = () => {
  const keyPair = ec.genKeyPair();
  const privateKey = keyPair.getPrivate();
  return privateKey.toString(16);
};

const initWallet = () => {
  if (fs.existsSync(privateKeyLocation)) {
    return;
  }
  const newPrivatekey = generatePrivateKey();

  fs.writeFileSync(privateKeyLocation, newPrivatekey);
};

module.exports = {
  initWallet
};
