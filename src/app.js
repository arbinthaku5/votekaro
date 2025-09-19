const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const routes = require('./routes');
const app = express();

app.use(cors({
  origin: 'http://localhost:4200', // Adjust to your frontend URL
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

app.use('/api', routes);

// simple error handler
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Internal Server Error' });
});

module.exports = app;
