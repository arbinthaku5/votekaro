const { v4: uuidv4 } = require('uuid');
const campaignsModel = require('../models/campaigns_model');
const votesModel = require('../models/votes_model');

async function createCampaign(payload, actorId) {
  const id = uuidv4();
  return campaignsModel.createCampaign({
    id,
    title: payload.title,
    description: payload.description,
    banner_url: payload.banner_url || null,
    start_date: payload.start_date,
    end_date: payload.end_date,
    created_by: actorId
  });
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
    campaign_id: campaignId
  });
}

async function list(status) {
  return campaignsModel.listByStatus(status);
}

async function getCampaign(id) {
  const c = await campaignsModel.getCampaignById(id);
  if (!c) throw { status: 404, message: 'Campaign not found' };
  const candidates = await campaignsModel.getCandidatesByCampaign(id);
  const counts = await votesModel.countVotesByCampaign(id);
  const votesMap = counts.reduce((m, r) => { m[r.candidate_id] = r.votes; return m; }, {});
  return { ...c, candidates: candidates.map(cd => ({...cd, votes: votesMap[cd.id] || 0 })) };
}

async function castVote(userId, campaignId, candidateId) {
  const campaign = await campaignsModel.getCampaignById(campaignId);
  if (!campaign) throw { status: 404, message: 'Campaign not found' };
  const now = new Date();
  if (!(new Date(campaign.start_date) <= now && now <= new Date(campaign.end_date))) {
    throw { status: 400, message: 'Campaign not active' };
  }
  const already = await votesModel.hasVoted(userId, campaignId);
  if (already) throw { status: 400, message: 'User already voted in this campaign' };
  const id = uuidv4();
  return votesModel.castVote({ id, voter_id: userId, candidate_id: candidateId, campaign_id: campaignId });
}

module.exports = { createCampaign, updateCampaign, deleteCampaign, addCandidate, list, getCampaign, castVote };
