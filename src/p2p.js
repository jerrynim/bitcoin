const WebSockets = require("ws");

const sokets = [];

const startP2PServer = (server) => {
  const wsServer = new WebSockets.Server({ server });
  wsServer.on("connection", (ws) => console.log(`Hello ${ws}`));
  console.log("P2P Server running");
};

module.exports = {
  startP2PServer
};
