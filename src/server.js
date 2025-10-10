const http = require("http");
const app = require("./app");
const { port } = require("./config");
const { init: initRealtime } = require("./realtime/socket");
const fs = require("fs");
const path = require("path");
const db = require("./db/pgPool");
const authService = require("./services/auth_service");
const notificationRoutes = require("./routes/notifications");

async function initializeDatabase() {
  try {
    const sqlPath = path.join(__dirname, "..", "sql", "init.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");
    const commands = sql.split(";").filter((c) => c.trim().length > 0);
    for (const command of commands) {
      if (command.trim()) await db.query(command);
    }
    console.log("Database initialized");
  } catch (err) {
    console.error("DB init error:", err.message || err);
  }
}

async function createAdminUser() {
  try {
    const adminPayload = {
      email: "admin@gmail.com",
      password: "Admin@123",
      firstName: "Admin",
      lastName: "User",
      username: "admin",
      role: "admin",
    };
    await authService.signup(adminPayload);
    console.log("Admin user created");
  } catch (err) {
    if (err.message === "Email already used") console.log("Admin exists");
    else console.error("Admin create error:", err.message || err);
  }
}

app.use("/api/notifications", notificationRoutes);

const server = http.createServer(app);
const io = initRealtime(server, { corsOrigin: "http://localhost:4200" }); // adjust origin for production

server.listen(port, async () => {
  console.log(`Server running on http://localhost:${port}`);
  await initializeDatabase();
  await createAdminUser();
});
