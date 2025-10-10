const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const cookie = require("cookie");
const { jwtSecret } = require("../config");

let io;
async function authenticateSocket(socket) {
  try {
    const { headers } = socket.request;
    let token;

    if (headers?.cookie) {
      const parsed = cookie.parse(headers.cookie || "");
      token = parsed.accessToken;
    }

    if (!token && socket.handshake?.query?.token) {
      token = socket.handshake.query.token;
    }

    if (!token) throw new Error("Missing token");

    const payload = jwt.verify(token, jwtSecret);
    return payload; // { sub, role, iat, exp, ... }
  } catch (err) {
    throw err;
  }
}

function init(server, options = {}) {
  if (io) return io;

  io = new Server(server, {
    cors: {
      origin: options.corsOrigin || "http://localhost:4200",
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const user = await authenticateSocket(socket);
      socket.user = { id: user.sub, role: user.role };
      return next();
    } catch (err) {
      console.warn("[socket] auth failed:", err.message);
      return next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log(
      `[socket] connected: ${socket.id} user=${socket.user?.id} role=${socket.user?.role}`
    );

    if (socket.user?.id) {
      socket.join(socket.user.id); // Each user joins their own room
    }

    socket.on("joinCampaign", (campaignId) => {
      if (!campaignId) return;
      const room = `campaign:${campaignId}`;
      socket.join(room);
      console.log(`[socket] ${socket.id} joined ${room}`);
    });

    socket.on("leaveCampaign", (campaignId) => {
      if (!campaignId) return;
      const room = `campaign:${campaignId}`;
      socket.leave(room);
      console.log(`[socket] ${socket.id} left ${room}`);
    });

    socket.on("joinAdmin", () => {
      if (["admin", "moderator"].includes(socket.user.role)) {
        socket.join("admins");
        console.log(`[socket] ${socket.id} joined admins`);
      }
    });

    socket.on("disconnect", (reason) => {
      console.log(`[socket] disconnected: ${socket.id} reason=${reason}`);
    });
  });

  return io;
}

function getIo() {
  if (!io)
    throw new Error("Socket.io not initialized. Call init(server) first.");
  return io;
}

module.exports = { init, getIo };
