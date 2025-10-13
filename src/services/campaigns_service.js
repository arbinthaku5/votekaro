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

  // If candidates are provided in payload, add them
  if (payload.candidates && Array.isArray(payload.candidates)) {
    for (const candidate of payload.candidates) {
      await addCandidate(id, candidate);
    }
  }

  // Get the full campaign with candidates
  const fullCampaign = await getCampaign(id);

  // push DB notification
  await notificationService.campaignNotification("campaign_created", actorId, fullCampaign);

  // emit real-time event to everyone and admins:
  try {
    const io = getIo();
    // broadcast full campaign info with candidates
    io.emit("campaign:created", fullCampaign);

    // notify admins/moderators separately
    io.to("admins").emit("admin:campaign_created", {
      id: fullCampaign.id,
      title: fullCampaign.title,
      created_by: actorId,
    });
  } catch (err) {
    console.warn("[realtime] emit createCampaign failed:", err.message || err);
  }

  return fullCampaign;
}

async function updateCampaign(id, payload, actorId) {
  const updated = await campaignsModel.updateCampaign(id, payload);
  if (!updated) throw { status: 404, message: "Campaign not found" };

  await notificationService.campaignNotification("campaign_updated", actorId, updated);

  try {
    const io = getIo();
    io.emit("campaign:updated", updated);
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

  // notify all clients via realtime
  try {
    const io = getIo();
    io.to(`campaign:${campaignId}`).emit("candidate:added", {
      campaignId,
      candidate: {
        id: created.id,
        name: created.name,
        bio: created.bio,
        photo_url: created.photo_url,
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
  const deleted = await campaignsModel.deleteCandidate(campaignId, candidateId);
  if (deleted) {
    try {
      const io = getIo();
      io.to(`campaign:${campaignId}`).emit("candidate:removed", {
        campaignId,
        candidateId,
      });
    } catch (err) {
      console.warn("[realtime] emit removeCandidate failed:", err.message || err);
    }
  }
  return deleted;
}

async function modifyCandidate(campaignId, candidateId, payload) {
  const updated = await campaignsModel.updateCandidate(campaignId, candidateId, payload);
  if (updated) {
    try {
      const io = getIo();
      io.to(`campaign:${campaignId}`).emit("candidate:updated", {
        campaignId,
        candidateId,
        changes: payload,
      });
    } catch (err) {
      console.warn("[realtime] emit modifyCandidate failed:", err.message || err);
    }
  }
  return updated;
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
    // Emit to campaign room only
    io.to(`campaign:${campaignId}`).emit("vote:updated", {
      campaignId,
      candidateId,
      votes: votesMap,
    });

    // Also emit to admins for real-time updates in admin dashboard
    io.to("admins").emit("vote:updated", {
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
