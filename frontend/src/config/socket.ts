
import { io, Socket } from "socket.io-client";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const socket: Socket = io(BASE_URL, {
  autoConnect:       false,
  reconnection:      true,
  reconnectionDelay: 1000,
  // WebSocket-only to match the backend: the server runs in PM2 cluster mode
  // without a sticky-session load balancer, so a persistent WebSocket (instead
  // of HTTP long-polling) keeps each client pinned to one worker.
  transports: ["websocket"],
});

export default socket;