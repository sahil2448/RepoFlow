// Holds the io instance so any controller can import it
// without circular dependency issues

let io = null;

export const setIO = (ioInstance) => {
  io = ioInstance;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.IO not initialized yet");
  return io;
};
