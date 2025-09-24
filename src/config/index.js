// require('dotenv').config();
// module.exports = {
//   port: process.env.PORT || 4000,
//   dbUrl: process.env.DATABASE_URL,
//   jwtSecret: process.env.JWT_ACCESS_SECRET,
//   jwtExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
//   bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT || '12', 10)
// };


require("dotenv").config();
const { z } = require("zod");

const envSchema = z.object({
  PORT: z.string().transform(Number).default("4000"),
  DATABASE_URL: z.url(),
  JWT_ACCESS_SECRET: z.string().min(10),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default("24h"),
  BCRYPT_SALT: z.string().transform(Number).default("12")
});

const env = envSchema.parse(process.env);

module.exports = {
  port: env.PORT,
  dbUrl: env.DATABASE_URL,
  jwtSecret: env.JWT_ACCESS_SECRET,
  jwtExpiresIn: env.ACCESS_TOKEN_EXPIRES_IN,
  bcryptSaltRounds: env.BCRYPT_SALT
};


