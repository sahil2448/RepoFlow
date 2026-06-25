// In-memory room state — ephemeral by design, no DB needed
const rooms = new Map(); // roomId -> Set<socketId>
const socketMeta = new Map(); // socketId -> { roomId, userId, username }

export function registerReviewSignaling(io) {
  io.on("connection", (socket) => {
    // ── Join a review room ──
    socket.on("review:join", ({ roomId, userId, username }) => {
      if (!roomId) return;

      const existing = rooms.get(roomId) || new Set();

      // 1:1 P2P only — cap at 2 participants
      if (existing.size >= 2) {
        socket.emit("review:room-full", { roomId });
        return;
      }

      socket.join(`review:${roomId}`);
      existing.add(socket.id);
      rooms.set(roomId, existing);
      socketMeta.set(socket.id, { roomId, userId, username });

      const otherSocketIds = [...existing].filter((id) => id !== socket.id);
      socket.emit("review:joined", { roomId, peers: otherSocketIds });
      socket.to(`review:${roomId}`).emit("review:peer-joined", {
        socketId: socket.id,
        userId,
        username,
      });

      console.log(
        `  🎥 ${username || socket.id} joined review room ${roomId} (${existing.size}/2)`,
      );
    });

    // ── Relay offer / answer / ICE candidate ──
    socket.on("review:signal", ({ to, signal }) => {
      if (!to || !signal) return;
      io.to(to).emit("review:signal-received", { from: socket.id, signal });
    });

    socket.on("review:leave", () => handleLeave(socket));
    socket.on("disconnect", () => handleLeave(socket));
  });

  function handleLeave(socket) {
    const meta = socketMeta.get(socket.id);
    if (!meta) return;

    const { roomId } = meta;
    const room = rooms.get(roomId);

    if (room) {
      room.delete(socket.id);
      socket
        .to(`review:${roomId}`)
        .emit("review:peer-left", { socketId: socket.id });

      if (room.size === 0) {
        rooms.delete(roomId);
        console.log(`  🧹 review room ${roomId} auto-cleaned — empty`);
      } else {
        rooms.set(roomId, room);
      }
    }

    socket.leave(`review:${roomId}`);
    socketMeta.delete(socket.id);
  }
}
