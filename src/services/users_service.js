const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const usersModel = require('../models/users_model');
const { bcryptSaltRounds } = require('../config');

async function getProfile(userId) {
  return usersModel.findById(userId);
}

async function updateProfile(userId, payload) {
  const allowed = ['first_name','last_name','username','dob','bio','photo_url','email'];
  const fields = {};
  for (const k of allowed) if (payload[k] !== undefined) fields[k] = payload[k];

  // Handle password separately with hashing
  if (payload.password !== undefined) {
    fields.password_hash = await bcrypt.hash(payload.password, bcryptSaltRounds);
  }

  return usersModel.updateUser(userId, fields);
}

async function adminUpdateUser(adminId, targetUserId, payload) {
  const fields = {};
  ['first_name','last_name','username','dob','bio','photo_url','email','role'].forEach(k => {
    if (payload[k] !== undefined) fields[k] = payload[k];
  });

  // Handle password separately with hashing
  if (payload.password !== undefined) {
    fields.password_hash = await bcrypt.hash(payload.password, bcryptSaltRounds);
  }

  return usersModel.updateUser(targetUserId, fields);
}

async function adminDeleteUser(targetUserId) {
  return usersModel.deleteUser(targetUserId);
}

async function listUsers(role = null) {
  return usersModel.listUsers(role);
}

async function adminCreateUser(payload) {
  const { first_name, last_name, username, email, password, role = 'voter' } = payload;

  // Allow admins to create any role type (admin, moderator, voter)
  const allowedRoles = ['admin', 'moderator', 'voter'];
  const validatedRole = role && allowedRoles.includes(role) ? role : 'voter';

  const id = uuidv4();
  const password_hash = await bcrypt.hash(password, bcryptSaltRounds);
  return usersModel.createUser({ id, first_name, last_name, username, email, password_hash, role: validatedRole });
}

module.exports = { getProfile, updateProfile, adminUpdateUser, adminDeleteUser, listUsers, adminCreateUser };
