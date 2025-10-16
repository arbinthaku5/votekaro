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

async function listCampaignsWithDetails(status, limit = 10, offset = 0) {
  let whereClause = '';
  if (status === 'ongoing') whereClause = 'WHERE c.start_date <= now() AND c.end_date >= now()';
  else if (status === 'upcoming') whereClause = 'WHERE c.start_date > now()';
  else if (status === 'past') whereClause = 'WHERE c.end_date < now()';

  const q = `
    SELECT
      c.*,
      COALESCE(json_agg(
        json_build_object(
          'id', cd.id,
          'name', cd.name,
          'bio', cd.bio,
          'photo_url', cd.photo_url,
          'votes', COALESCE(vc.votes, 0)
        ) ORDER BY cd.id
      ) FILTER (WHERE cd.id IS NOT NULL), '[]') AS candidates
    FROM campaigns c
    LEFT JOIN candidates cd ON c.id = cd.campaign_id
    LEFT JOIN (
      SELECT candidate_id, COUNT(*)::int AS votes
      FROM votes
      GROUP BY candidate_id
    ) vc ON cd.id = vc.candidate_id
    ${whereClause}
    GROUP BY c.id
    ORDER BY c.start_date DESC
    LIMIT $1 OFFSET $2
  `;
  const { rows } = await db.query(q, [limit, offset]);
  return rows;
}

async function getCampaignWithDetails(id) {
  const q = `
    SELECT
      c.*,
      COALESCE(json_agg(
        json_build_object(
          'id', cd.id,
          'name', cd.name,
          'bio', cd.bio,
          'photo_url', cd.photo_url,
          'votes', COALESCE(vc.votes, 0)
        ) ORDER BY cd.id
      ) FILTER (WHERE cd.id IS NOT NULL), '[]') AS candidates
    FROM campaigns c
    LEFT JOIN candidates cd ON c.id = cd.campaign_id
    LEFT JOIN (
      SELECT candidate_id, COUNT(*)::int AS votes
      FROM votes
      GROUP BY candidate_id
    ) vc ON cd.id = vc.candidate_id
    WHERE c.id = $1
    GROUP BY c.id
  `;
  const { rows } = await db.query(q, [id]);
  return rows[0];
}

async function addCandidate({ id, name, bio, photo_url, campaign_id }) {
  const q = `INSERT INTO candidates (id, name, bio, photo_url, campaign_id) VALUES ($1,$2,$3,$4,$5) RETURNING *`;
  const { rows } = await db.query(q, [id,name,bio,photo_url,campaign_id]);
  return rows[0];
}

// Batch insert multiple candidates
async function addCandidates(candidates) {
  if (!candidates.length) return [];
  const placeholders = candidates.map((_, i) => `($${i*5+1}, $${i*5+2}, $${i*5+3}, $${i*5+4}, $${i*5+5})`).join(', ');
  const values = candidates.flatMap(c => [c.id, c.name, c.bio || null, c.photo_url || null, c.campaign_id]);
  const q = `INSERT INTO candidates (id, name, bio, photo_url, campaign_id) VALUES ${placeholders} RETURNING *`;
  const { rows } = await db.query(q, values);
  return rows;
}

async function getCandidatesByCampaign(campaign_id) {
  const { rows } = await db.query('SELECT * FROM candidates WHERE campaign_id=$1', [campaign_id]);
  return rows;
}

async function deleteCandidate(campaignId, candidateId) {
  await db.query('DELETE FROM candidates WHERE campaign_id = $1 AND id = $2', [campaignId, candidateId]);
}

async function updateCandidate(campaignId, candidateId, fields) {
  const keys = Object.keys(fields);
  if (!keys.length) return getCandidatesByCampaign(campaignId).find(c => c.id === candidateId);
  const set = keys.map((k,i) => `${k}=$${i+3}`).join(', ');
  const values = [campaignId, candidateId, ...keys.map(k => fields[k])];
  const q = `UPDATE candidates SET ${set} WHERE campaign_id=$1 AND id=$2 RETURNING *`;
  const { rows } = await db.query(q, values);
  return rows[0];
}

async function getUserPastCampaigns(userId) {
  const q = `
    SELECT c.*,
      COALESCE((
        SELECT json_agg(
          json_build_object(
            'id', cd.id,
            'name', cd.name,
            'bio', cd.bio,
            'photo_url', cd.photo_url,
            'votes', COALESCE(vc.votes, 0)
          ) ORDER BY cd.id
        )
        FROM candidates cd
        LEFT JOIN (
          SELECT candidate_id, COUNT(*)::int AS votes
          FROM votes
          GROUP BY candidate_id
        ) vc ON cd.id = vc.candidate_id
        WHERE cd.campaign_id = c.id
      ), '[]'::json) AS candidates
    FROM campaigns c
    INNER JOIN votes v ON c.id = v.campaign_id AND v.voter_id = $1
    GROUP BY c.id
    ORDER BY c.end_date DESC
  `;
  const { rows } = await db.query(q, [userId]);
  return rows;
}

module.exports = {
  createCampaign, updateCampaign, deleteCampaign, getCampaignById, listByStatus,
  listCampaignsWithDetails, getCampaignWithDetails,
  addCandidate, addCandidates, getCandidatesByCampaign, deleteCandidate, updateCandidate,
  getUserPastCampaigns
};
