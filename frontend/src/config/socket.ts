import { io, Socket } from "socket.io-client";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Singleton — one socket connection for the whole app
const socket: Socket = io(BASE_URL, {
  autoConnect:     false,  // we connect manually after login
  reconnection:    true,
  reconnectionDelay: 1000,
});

export default socket;