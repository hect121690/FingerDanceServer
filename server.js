import { WebSocketServer } from "ws";
import http from "http";

const server = http.createServer();
const wss = new WebSocketServer({ server });
const rooms = {}; // { roomId: [ { socket, ready } ] }

wss.on("connection", (socket) => {
  socket.on("message", (msg) => {
    const data = JSON.parse(msg);

    // Unirse a sala
    if (data.type === "joinRoom") {
      const { roomId } = data;
      rooms[roomId] ??= [];
      rooms[roomId].push({ socket, ready: false });
      socket.roomId = roomId;
      console.log(`Jugador unido a sala ${roomId}`);
      return;
    }

    // Actualizar puntaje
    if (data.type === "perfect") {
      const peers = rooms[socket.roomId] || [];
      for (const peer of peers) {
        if (peer.socket !== socket && peer.socket.readyState === peer.socket.OPEN) {
          peer.socket.send(JSON.stringify(data));
        }
      }
      return;
    }

    // Marcar jugador como listo
    if (data.type === "readyPlay") {
      const room = rooms[socket.roomId];
      if (!room) return;

      const player = room.find((p) => p.socket === socket);
      if (player) player.ready = data.ready;

      // Notificar al otro jugador que está listo
      for (const peer of room) {
        if (peer.socket !== socket && peer.socket.readyState === peer.socket.OPEN) {
          peer.socket.send(JSON.stringify(data));
        }
      }

      // Si ambos están listos → mandar startGame
      const allReady = room.length === 2 && room.every((p) => p.ready);
      if (allReady) {
        for (const peer of room) {
          if (peer.socket.readyState === peer.socket.OPEN) {
            peer.socket.send(JSON.stringify({ type: "startGame" }));
          }
        }
      }
    }
  });

  socket.on("close", () => {
    if (!socket.roomId) return;
    rooms[socket.roomId] = (rooms[socket.roomId] || []).filter((p) => p.socket !== socket);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor WebSocket activo en puerto ${PORT}`);
});
