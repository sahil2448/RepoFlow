export const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    // ✅ TURN — required when STUN can't punch through NAT
    // Free testing relay (Open Relay Project) — fine for demo/portfolio scale
    { urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject", credential: "openrelayproject" },
    { urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject", credential: "openrelayproject" },
    { urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject", credential: "openrelayproject" },
  ],
  iceTransportPolicy: "all", // try direct P2P first, fall back to relay
};