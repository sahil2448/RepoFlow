// import { io, Socket } from "socket.io-client";

// // const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
// const EC2_URL = import.meta.env.VITE_EC2_URL || "http://13.232.40.39:3000"
// const socket: Socket = io(EC2_URL, {
//   autoConnect:     false, 
//   reconnection:    true,
//   reconnectionDelay: 1000,
//   transports: ["polling", "websocket"]
// });

// export default socket;

// changed for implementation of real time peer review feature 

import { io, Socket } from "socket.io-client";

// ✅ Use the env-based URL, fallback to localhost for dev
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const socket: Socket = io(BASE_URL, {
  autoConnect:       false,
  reconnection:      true,
  reconnectionDelay: 1000,
  transports:        ["polling", "websocket"],
});

export default socket;