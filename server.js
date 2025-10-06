import { WebSocketServer } from "ws";
import http from "http";

const server = http.createServer();
const wss = new WebSocketServer({ server });
const rooms = {};

wss.on("connection", (socket) => {
  socket.on("message", (msg) => {
    const data = JSON.parse(msg);

    if (data.type === "joinRoom") {
      const { roomId } = data;
      rooms[roomId] ??= [];
      rooms[roomId].push(socket);
      socket.roomId = roomId;
      console.log(`Jugador unido a sala ${roomId}`);
      return;
    }

    if (data.type === "scoreUpdate") {
      const peers = rooms[socket.roomId] || [];
      for (const peer of peers) {
        if (peer !== socket && peer.readyState === peer.OPEN) {
          peer.send(JSON.stringify(data));
        }
      }
    }
  });

  socket.on("close", () => {
    if (!socket.roomId) return;
    rooms[socket.roomId] = (rooms[socket.roomId] || []).filter((p) => p !== socket);
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Servidor WebSocket activo en puerto ${port}`));
