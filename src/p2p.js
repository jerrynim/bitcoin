const WebSockets = require("ws");

const sockets = [];

const getSockets = () => sokets;

const startP2PServer = (server) => {
  const wsServer = new WebSockets.Server({ server });
  wsServer.on("connection", (ws) => initSocketConnection(ws));
  console.log("P2P Server running");
};

const initSocketConnection = (socket) => {
  sockets.push(socket);
  socket.on("message", (data) => console.log(data));
  setTimeout(() => socket.send("Welcome"), 5000);
};

const connectToPeers = (newPeer) => {
  const ws = new WebSockets(newPeer);
  ws.on("open", () => {
    initSocketConnection(ws);
  });
};

const handleSocketError = (ws) => {
  const closeSocketConnection = (ws) => {
    ws.close();
    sockets.splice(sockets.indexOf(ws), 1);
  };
  ws.on("close", () => closeSocketConnection(ws));
  ws.on("error", () => closeSocketConnection(ws));
};

module.exports = {
  startP2PServer,
  connectToPeers
};
