const db = require('../db/pgPool');

async function createUser({ id, first_name, last_name, username, email, password_hash, role = 'voter' }) {
  const q = `INSERT INTO users (id, first_name, last_name, username, email, password_hash, role)
             VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, email, username, role, first_name, last_name`;
  const { rows } = await db.query(q, [id, first_name, last_name, username, email, password_hash, role]);
  return rows[0];
}

async function findByEmail(email) {
  const { rows } = await db.query('SELECT * FROM users WHERE email=$1', [email]);
  return rows[0];
}

async function findById(id) {
  const { rows } = await db.query('SELECT id, first_name, last_name, username, email, role, dob, bio, photo_url, created_at FROM users WHERE id=$1', [id]);
  return rows[0];
}

async function updateUser(id, fields) {
  
  const keys = Object.keys(fields);
  if (!keys.length) return findById(id);
  const set = keys.map((k, i) => `${k}=$${i+2}`).join(', ');
  const values = [id, ...keys.map(k => fields[k])];
  const q = `UPDATE users SET ${set}, updated_at = now() WHERE id = $1 RETURNING id, first_name, last_name, username, email, role, dob, bio, photo_url`;
  const { rows } = await db.query(q, values);
  return rows[0];
}

async function deleteUser(id) {
  await db.query('DELETE FROM users WHERE id=$1', [id]);
}

module.exports = { createUser, findByEmail, findById, updateUser, deleteUser };
