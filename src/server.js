const app = require('./app');
const { port } = require('./config');
const authService = require('./services/auth_service');
const fs = require('fs');
const path = require('path');
const db = require('./db/pgPool');

// Initialize database tables
async function initializeDatabase() {
  try {
    const sqlPath = path.join(__dirname, '..', 'sql', 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split SQL commands and execute them
    const commands = sql.split(';').filter(cmd => cmd.trim().length > 0);

    for (const command of commands) {
      if (command.trim()) {
        await db.query(command);
      }
    }

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error.message);
  }
}

// Create admin user on server startup
async function createAdminUser() {
  try {
    const adminPayload = {
      email: 'admin@gmail.com',
      password: 'Admin@123',
      firstName: 'Admin',
      lastName: 'User',
      username: 'admin',
      role: 'admin'
    };
    await authService.signup(adminPayload);
    console.log('Admin user created successfully');
  } catch (error) {
    if (error.message === 'Email already used') {
      console.log('Admin user already exists');
    } else {
      console.error('Error creating admin user:', error.message);
    }
  }
}

app.listen(port, async () => {
  console.log(`Server running on http://localhost:${port}`);
  await initializeDatabase();
  await createAdminUser();
});

app.get("/", (req, res) => {
  res.send("Voting System Backend is running");
});
