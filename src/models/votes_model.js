const db = require('../db/pgPool');

async function castVote({ id, voter_id, candidate_id, campaign_id }) {
  const q = `INSERT INTO votes (id, voter_id, candidate_id, campaign_id) VALUES ($1,$2,$3,$4) RETURNING *`;
  const { rows } = await db.query(q, [id, voter_id, candidate_id, campaign_id]);
  return rows[0];
}

async function hasVoted(voter_id, campaign_id) {
  const { rows } = await db.query('SELECT id FROM votes WHERE voter_id=$1 AND campaign_id=$2', [voter_id, campaign_id]);
  return rows.length > 0;
}

async function countVotesByCampaign(campaign_id) {
  const { rows } = await db.query(`SELECT candidate_id, COUNT(*)::int as votes FROM votes WHERE campaign_id=$1 GROUP BY candidate_id`, [campaign_id]);
  return rows;
}

module.exports = { castVote, hasVoted, countVotesByCampaign };
