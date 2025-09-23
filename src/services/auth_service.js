const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const usersModel = require('../models/users_model');
const { jwtSecret, jwtExpiresIn, bcryptSaltRounds } = require('../config');

async function signup(payload) {
  // Hardcoded admin user creation if email matches
  if (payload.email === 'admin@gmail.com') {
    const existingAdmin = await usersModel.findByEmail('admin@gmail.com');
    if (existingAdmin) {
      // Update existing admin user with correct password
      const hash = await bcrypt.hash('Admin@123', bcryptSaltRounds);
      const updatedAdmin = await usersModel.updateUser(existingAdmin.id, {
        password_hash: hash,
        first_name: 'Admin',
        last_name: 'User',
        username: 'admin',
        role: 'admin'
      });
      return updatedAdmin;
    }
    const id = uuidv4();
    const hash = await bcrypt.hash('Admin@123', bcryptSaltRounds);
    const createdAdmin = await usersModel.createUser({
      id,
      first_name: 'Admin',
      last_name: 'User',
      username: 'admin',
      email: 'admin@gmail.com',
      password_hash: hash,
      role: 'admin'
    });
    return createdAdmin;
  }

  const existing = await usersModel.findByEmail(payload.email);
  if (existing) throw { status: 400, message: 'Email already used' };

  // Validate role - only allow 'voter' role for regular signup
  const allowedRoles = ['voter'];
  const role = payload.role && allowedRoles.includes(payload.role) ? payload.role : 'voter';

  const id = uuidv4();
  const hash = await bcrypt.hash(payload.password, bcryptSaltRounds);
  const created = await usersModel.createUser({
    id,
    first_name: payload.firstName,
    last_name: payload.lastName,
    username: payload.username,
    email: payload.email,
    password_hash: hash,
    role: role
  });
  return created;
}

async function login({ email, password }) {
  console.log('Login attempt for:', email);
  const user = await usersModel.findByEmail(email);
  console.log('User found:', user ? 'yes' : 'no');
  if (!user) {
    console.log('Login failed: User not found for email:', email);
    throw { status: 401, message: 'Invalid credentials' };
  }
  console.log('User password hash:', user.password_hash ? 'exists' : 'missing');
  if (!user.password_hash) {
    console.log('Login failed: No password hash found for user:', user.id);
    throw { status: 401, message: 'Invalid credentials' };
  }
  const ok = await bcrypt.compare(password, user.password_hash);
  console.log('Password match:', ok);
  if (!ok) {
    console.log('Login failed: Password mismatch for user:', user.id);
    throw { status: 401, message: 'Invalid credentials' };
  }
  const token = jwt.sign({ sub: user.id, role: user.role }, jwtSecret, { expiresIn: jwtExpiresIn });
  console.log('Login successful for user:', user.id, 'with role:', user.role);
  return {
    accessToken: token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      photo_url: user.photo_url
    }
  };
}

module.exports = { signup, login };
