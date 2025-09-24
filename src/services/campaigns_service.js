const { v4: uuidv4 } = require("uuid");
const campaignsModel = require("../models/campaigns_model");
const votesModel = require("../models/votes_model");
const db = require("../db/pgPool");

async function createCampaign(payload, actorId) {
  const id = uuidv4();
  //return campaignsModel.createCampaign({
  const campaign = await campaignsModel.createCampaign({
    id,
    title: payload.title,
    description: payload.description,
    banner_url: payload.banner_url || null,
    start_date: payload.start_date,
    end_date: payload.end_date,
    created_by: actorId,
  });

  await db.query(
    `INSERT INTO notifications
    (id, user_id, type, metadata)
    SELECT gen_random_uuid(), u.id, $1, $2,
    FROM users u
    WHERE u.role = 'admin'`,
    [
      // actorId, // $1 = user who created campaign
      "campaign_created", //$2 = type
      JSON.stringify({
        created_by: actorId,
        campaign_title: campaign.title,
        start_date: campaign.start_date,
        end_date: campaign.end_date,
      }), // $3 = metadata as JSON
    ]
  );

  return campaign;
}

async function updateCampaign(id, payload) {
  return campaignsModel.updateCampaign(id, payload);
}

async function deleteCampaign(id) {
  return campaignsModel.deleteCampaign(id);
}

async function addCandidate(campaignId, payload) {
  const id = uuidv4();
  return campaignsModel.addCandidate({
    id,
    name: payload.name,
    bio: payload.bio || null,
    photo_url: payload.photo_url || null,
    campaign_id: campaignId,
  });
}

async function list(status) {
  const campaigns = await campaignsModel.listByStatus(status);
  const withCandidates = await Promise.all(
    campaigns.map(async (c) => {
      const candidates = await campaignsModel.getCandidatesByCampaign(c.id);
      const counts = await votesModel.countVotesByCampaign(c.id);
      const votesMap = counts.reduce((m, r) => {
        m[r.candidate_id] = r.votes;
        return m;
      }, {});
      return {
        ...c,
        candidates: candidates.map((cd) => ({
          ...cd,
          votes: votesMap[cd.id] || 0,
        })),
      };
    })
  );
  return withCandidates;
}

async function getCampaign(id) {
  const c = await campaignsModel.getCampaignById(id);
  if (!c) throw { status: 404, message: "Campaign not found" };
  const candidates = await campaignsModel.getCandidatesByCampaign(id);
  const counts = await votesModel.countVotesByCampaign(id);
  const votesMap = counts.reduce((m, r) => {
    m[r.candidate_id] = r.votes;
    return m;
  }, {});
  return {
    ...c,
    candidates: candidates.map((cd) => ({
      ...cd,
      votes: votesMap[cd.id] || 0,
    })),
  };
}

async function removeCandidate(campaignId, candidateId) {
  return campaignsModel.deleteCandidate(campaignId, candidateId);
}

async function modifyCandidate(campaignId, candidateId, payload) {
  return campaignsModel.updateCandidate(campaignId, candidateId, payload);
}

async function castVote(userId, campaignId, candidateId) {
  const campaign = await campaignsModel.getCampaignById(campaignId);
  if (!campaign) throw { status: 404, message: "Campaign not found" };
  const now = new Date();
  if (
    !(
      new Date(campaign.start_date) <= now && now <= new Date(campaign.end_date)
    )
  ) {
    throw { status: 400, message: "Campaign not active" };
  }
  const already = await votesModel.hasVoted(userId, campaignId);
  if (already)
    throw { status: 400, message: "User already voted in this campaign" };
  const id = uuidv4();
  return votesModel.castVote({
    id,
    voter_id: userId,
    candidate_id: candidateId,
    campaign_id: campaignId,
  });
}

module.exports = {
  createCampaign,
  updateCampaign,
  deleteCampaign,
  addCandidate,
  removeCandidate,
  modifyCandidate,
  list,
  getCampaign,
  castVote,
};
