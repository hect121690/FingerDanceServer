import { WebSocketServer } from "ws";
import http from "http";

const server = http.createServer();
const wss = new WebSocketServer({ server });
const rooms = {};

// Cuando se conecta un nuevo cliente
wss.on("connection", (socket) => {
  console.log("🔗 Nuevo cliente conectado");

  socket.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);

      // 🔹 El jugador se une a una sala
      if (data.type === "joinRoom") {
        const { roomId } = data;
        rooms[roomId] ??= [];
        rooms[roomId].push(socket);
        socket.roomId = roomId;
        console.log(`🎮 Jugador unido a sala ${roomId}`);
        return;
      }

      // 🔹 Actualización de puntaje (score)
      if (data.type === "scoreUpdate") {
        const peers = rooms[socket.roomId] || [];
        for (const peer of peers) {
          if (peer !== socket && peer.readyState === peer.OPEN) {
            peer.send(JSON.stringify(data));
          }
        }
      }
    } catch (err) {
      console.error("❌ Error procesando mensaje:", err);
    }
  });

  // 🔹 Cuando se desconecta un jugador
  socket.on("close", () => {
    if (!socket.roomId) return;
    rooms[socket.roomId] = (rooms[socket.roomId] || []).filter((p) => p !== socket);
    console.log(`🚪 Jugador salió de sala ${socket.roomId}`);
  });
});

// 🔹 Puerto dinámico para Render
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Servidor WebSocket activo en puerto ${PORT}`);
});
