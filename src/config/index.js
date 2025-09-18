require('dotenv').config();
module.exports = {
  port: process.env.PORT || 4000,
  dbUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_ACCESS_SECRET,
  jwtExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT || '12', 10)
};
