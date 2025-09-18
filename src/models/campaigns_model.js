const db = require('../db/pgPool');

async function createCampaign({ id, title, description, banner_url, start_date, end_date, created_by }) {
  const q = `INSERT INTO campaigns (id,title,description,banner_url,start_date,end_date,created_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`;
  const { rows } = await db.query(q, [id,title,description,banner_url,start_date,end_date,created_by]);
  return rows[0];
}

async function updateCampaign(id, fields) {
  const keys = Object.keys(fields);
  if (!keys.length) return getCampaignById(id);
  const set = keys.map((k,i) => `${k}=$${i+2}`).join(', ');
  const values = [id, ...keys.map(k => fields[k])];
  const q = `UPDATE campaigns SET ${set}, updated_at = now() WHERE id=$1 RETURNING *`;
  const { rows } = await db.query(q, values);
  return rows[0];
}

async function deleteCampaign(id) {
  await db.query('DELETE FROM campaigns WHERE id=$1', [id]);
}

async function getCampaignById(id) {
  const { rows } = await db.query('SELECT * FROM campaigns WHERE id=$1', [id]);
  return rows[0];
}

async function listByStatus(status) {
  let q = 'SELECT * FROM campaigns ORDER BY start_date DESC';
  if (status === 'ongoing') q = 'SELECT * FROM campaigns WHERE start_date <= now() AND end_date >= now() ORDER BY start_date DESC';
  if (status === 'upcoming') q = 'SELECT * FROM campaigns WHERE start_date > now() ORDER BY start_date ASC';
  if (status === 'past') q = 'SELECT * FROM campaigns WHERE end_date < now() ORDER BY start_date DESC';
  const { rows } = await db.query(q);
  return rows;
}

async function addCandidate({ id, name, bio, photo_url, campaign_id }) {
  const q = `INSERT INTO candidates (id, name, bio, photo_url, campaign_id) VALUES ($1,$2,$3,$4,$5) RETURNING *`;
  const { rows } = await db.query(q, [id,name,bio,photo_url,campaign_id]);
  return rows[0];
}

async function getCandidatesByCampaign(campaign_id) {
  const { rows } = await db.query('SELECT * FROM candidates WHERE campaign_id=$1', [campaign_id]);
  return rows;
}

module.exports = {
  createCampaign, updateCampaign, deleteCampaign, getCampaignById, listByStatus,
  addCandidate, getCandidatesByCampaign
};
