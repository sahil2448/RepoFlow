
import { io, Socket } from "socket.io-client";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const socket: Socket = io(BASE_URL, {
  autoConnect:       false,
  reconnection:      true,
  reconnectionDelay: 1000,
  transports:        ["polling", "websocket"], // basically what they do is that -> polling is for http requests and websocket is for websockets
});

export default socket;