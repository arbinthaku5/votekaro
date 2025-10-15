const campaignsService = require('../services/campaigns_service');

exports.list = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const offset = parseInt(req.query.offset) || 0;
    const items = await campaignsService.list(req.query.status, limit, offset);
    res.json(items);
  } catch (err) { next(err); }
};

exports.get = async (req, res, next) => {
  try {
    const item = await campaignsService.getCampaign(req.params.id);
    res.json(item);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const created = await campaignsService.createCampaign(req.body, req.user.id);
    res.status(201).json(created);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const updated = await campaignsService.updateCampaign(req.params.id, req.body, req.user.id);
    res.json(updated);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await campaignsService.deleteCampaign(req.params.id, req.user.id);
    res.status(204).send();
  } catch (err) { next(err); }
};

exports.addCandidate = async (req, res, next) => {
  try {
    const created = await campaignsService.addCandidate(req.params.id, req.body);
    res.status(201).json(created);
  } catch (err) { next(err); }
};

exports.removeCandidate = async (req, res, next) => {
  try {
    await campaignsService.removeCandidate(req.params.id, req.params.candidateId);
    res.status(204).send();
  } catch (err) { next(err); }
};

exports.updateCandidate = async (req, res, next) => {
  try {
    const updated = await campaignsService.modifyCandidate(req.params.id, req.params.candidateId, req.body);
    res.json(updated);
  } catch (err) { next(err); }
};

exports.castVote = async (req, res, next) => {
  try {
    const vote = await campaignsService.castVote(req.user.id, req.params.id, req.body.candidate_id);
    res.status(201).json(vote);
  } catch (err) { next(err); }
};
