const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const usersModel = require('../models/users_model');
const { jwtSecret, jwtExpiresIn, bcryptSaltRounds } = require('../config');

async function signup(payload) {
  const existing = await usersModel.findByEmail(payload.email);
  if (existing) throw { status: 400, message: 'Email already used' };
  const id = uuidv4();
  const hash = await bcrypt.hash(payload.password, bcryptSaltRounds);
  const created = await usersModel.createUser({
    id,
    first_name: payload.firstName,
    last_name: payload.lastName,
    username: payload.username,
    email: payload.email,
    password_hash: hash,
    role: payload.role || 'voter'
  });
  return created;
}

async function login({ email, password }) {
  const user = await usersModel.findByEmail(email);
  if (!user) throw { status: 401, message: 'Invalid credentials' };
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw { status: 401, message: 'Invalid credentials' };
  const token = jwt.sign({ sub: user.id, role: user.role }, jwtSecret, { expiresIn: jwtExpiresIn });
  return { accessToken: token, user: { id: user.id, email: user.email, role: user.role, username: user.username } };
}

module.exports = { signup, login };
