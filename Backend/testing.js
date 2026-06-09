import { io } from "socket.io-client";
const socket = io("https://d16mxn9cxjmykw.cloudfront.net");

socket.on("connect", () => {
  console.log("initial transport:", socket.io.engine.transport.name);

  socket.io.engine.once("upgrade", () => {
    console.log("upgraded transport:", socket.io.engine.transport.name);
  });
});

socket.on("connect_error", (err) => {
  console.log("connect_error:", err.message);
});
