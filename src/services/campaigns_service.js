const { v4: uuidv4 } = require("uuid");
const campaignsModel = require("../models/campaigns_model");
const votesModel = require("../models/votes_model");
const db = require("../db/pgPool");
const notificationService = require("./notifications_service");
const { getIo } = require("../realtime/socket");

async function createCampaign(payload, actorId) {
  const id = uuidv4();
  const campaign = await campaignsModel.createCampaign({
    id,
    title: payload.title,
    description: payload.description,
    banner_url: payload.banner_url || null,
    start_date: payload.start_date,
    end_date: payload.end_date,
    created_by: actorId,
  });

  // push DB notification
  await notificationService.campaignNotification("campaign_created", actorId, campaign);

  // emit real-time event to everyone and admins:
  try {
    const io = getIo();
    // broadcast basic campaign info
    io.emit("campaign:created", {
      id: campaign.id,
      title: campaign.title,
      start_date: campaign.start_date,
      end_date: campaign.end_date,
    });

    // notify admins/moderators separately
    io.to("admins").emit("admin:campaign_created", {
      id: campaign.id,
      title: campaign.title,
      created_by: actorId,
    });
  } catch (err) {
    console.warn("[realtime] emit createCampaign failed:", err.message || err);
  }

  return campaign;
}

async function updateCampaign(id, payload, actorId) {
  const updated = await campaignsModel.updateCampaign(id, payload);
  if (!updated) throw { status: 404, message: "Campaign not found" };

  await notificationService.campaignNotification("campaign_updated", actorId, updated);

  try {
    const io = getIo();
    io.emit("campaign:updated", { id: updated.id, changes: payload });
    io.to("admins").emit("admin:campaign_updated", { id: updated.id, changes: payload, by: actorId });
  } catch (err) {
    console.warn("[realtime] emit updateCampaign failed:", err.message || err);
  }

  return updated;
}

async function deleteCampaign(id, actorId) {
  const campaign = await campaignsModel.getCampaignById(id);
  if (!campaign) throw { status: 404, message: "Campaign not found" };

  await campaignsModel.deleteCampaign(id);
  await notificationService.campaignNotification("campaign_deleted", actorId, campaign);

  try {
    const io = getIo();
    io.emit("campaign:deleted", { id });
    io.to("admins").emit("admin:campaign_deleted", { id, title: campaign.title, by: actorId });
  } catch (err) {
    console.warn("[realtime] emit deleteCampaign failed:", err.message || err);
  }

  return;
}

async function addCandidate(campaignId, payload) {
  const id = uuidv4();
  const created = await campaignsModel.addCandidate({
    id,
    name: payload.name,
    bio: payload.bio || null,
    photo_url: payload.photo_url || null,
    campaign_id: campaignId,
  });

  // notify admins via DB + realtime
  try {
    // you may want to call notificationService.userCreateNotification or campaignNotification as needed
    const io = getIo();
    io.to("admins").emit("candidate:added", {
      campaignId,
      candidate: {
        id: created.id,
        name: created.name,
        bio: created.bio,
      },
    });

    // optionally notify subscribers of the campaign (they can be in room `campaign:{id}`)
    io.to(`campaign:${campaignId}`).emit("campaign:candidate_added", {
      campaignId,
      candidate: {
        id: created.id,
        name: created.name,
        bio: created.bio,
      },
    });
  } catch (err) {
    console.warn("[realtime] emit addCandidate failed:", err.message || err);
  }

  return created;
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
  if (!(new Date(campaign.start_date) <= now && now <= new Date(campaign.end_date))) {
    throw { status: 400, message: "Campaign not active" };
  }
  const already = await votesModel.hasVoted(userId, campaignId);
  if (already) throw { status: 400, message: "User already voted in this campaign" };

  const id = uuidv4();
  const vote = await votesModel.castVote({
    id,
    voter_id: userId,
    candidate_id: candidateId,
    campaign_id: campaignId,
  });

  // get updated counts and broadcast to campaign room
  try {
    const io = getIo();
    const counts = await votesModel.countVotesByCampaign(campaignId);
    // normalize to { candidateId: votes }
    const votesMap = counts.reduce((m, r) => {
      m[r.candidate_id] = r.votes;
      return m;
    }, {});
    // Emit to clients who joined campaign room
    io.to(`campaign:${campaignId}`).emit("vote:updated", {
      campaignId,
      candidateId,
      votes: votesMap,
    });

    // also notify admins/moderators if needed
    io.to("admins").emit("admin:vote_cast", {
      campaignId,
      candidateId,
      by: userId,
    });
  } catch (err) {
    console.warn("[realtime] emit castVote failed:", err.message || err);
  }

  return vote;
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
