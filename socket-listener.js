// socket-listener.js
const io = require("socket.io-client");

const serverUrl = process.argv[2] || "http://localhost:4000";
const token = process.argv[3] || process.env.JWT || "";

const campaignIdToJoin = process.argv[4] || null; // optional

const socket = io(serverUrl, {
  transports: ["websocket"],
  // server looks at handshake query.token
  query: { token },
  reconnection: false,
});

// basic debug
socket.on("connect", () => {
  console.log("✅ connected:", socket.id);
  if (campaignIdToJoin) {
    socket.emit("joinCampaign", campaignIdToJoin);
    console.log("→ joinCampaign", campaignIdToJoin);
  }
});

socket.on("connect_error", (err) => {
  console.error("❌ connect_error:", err.message || err);
  process.exit(1);
});

socket.on("disconnect", (reason) => {
  console.log("⤫ disconnected:", reason);
});

// listen for the events your server emits
socket.on("campaign:created", (data) => console.log("📣 campaign:created", data));
socket.on("campaign:updated", (d) => console.log("📣 campaign:updated", d));
socket.on("campaign:deleted", (d) => console.log("📣 campaign:deleted", d));

socket.on("campaign:candidate_added", (d) => console.log("📣 candidate_added", d));
socket.on("vote:updated", (d) => console.log("📣 vote:updated", d));

// admin events
socket.on("admin:campaign_created", (d) => console.log("🔒 admin:campaign_created", d));
socket.on("admin:vote_cast", (d) => console.log("🔒 admin:vote_cast", d));
