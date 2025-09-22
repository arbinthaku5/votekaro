const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const usersModel = require('../models/users_model');

async function getProfile(userId) {
  return usersModel.findById(userId);
}

async function updateProfile(userId, payload) {
  const allowed = ['first_name','last_name','username','dob','bio','photo_url','email'];
  const fields = {};
  for (const k of allowed) if (payload[k] !== undefined) fields[k] = payload[k];

  // Handle password separately with hashing
  if (payload.password !== undefined) {
    const saltRounds = 10;
    fields.password_hash = await bcrypt.hash(payload.password, saltRounds);
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
    const saltRounds = 10;
    fields.password_hash = await bcrypt.hash(payload.password, saltRounds);
  }

  return usersModel.updateUser(targetUserId, fields);
}

async function adminDeleteUser(targetUserId) {
  return usersModel.deleteUser(targetUserId);
}

async function listUsers() {
  return usersModel.listUsers();
}

module.exports = { getProfile, updateProfile, adminUpdateUser, adminDeleteUser, listUsers };
