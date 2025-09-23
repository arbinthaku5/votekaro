// const express = require('express');
// const router = express.Router();
// const campaignsCtrl = require('../controllers/campaigns_controller');
// const { authenticate } = require('../middleware/auth');
// const { authorizeRoles } = require('../middleware/rbac');

// router.get('/', campaignsCtrl.list);
// router.get('/:id', campaignsCtrl.get);

// router.post('/', authenticate, authorizeRoles('admin','moderator'), campaignsCtrl.create);
// router.put('/:id', authenticate, authorizeRoles('admin','moderator'), campaignsCtrl.update);
// router.delete('/:id', authenticate, authorizeRoles('admin'), campaignsCtrl.remove);

// router.post('/:id/candidates', authenticate, authorizeRoles('admin','moderator'), campaignsCtrl.addCandidate);

// router.post('/:id/vote', authenticate, authorizeRoles('voter'/*,'admin'*/,'moderator'), campaignsCtrl.castVote);

// module.exports = router;

const express = require("express");
const { z } = require("zod");
const { validate } = require("../middleware/validate");
const campaignsCtrl = require("../controllers/campaigns_controller");
const { authenticate } = require("../middleware/auth");
const { authorizeRoles } = require("../middleware/rbac");

const router = express.Router();

const campaignSchema = z.object({
  title: z.string(),
  description: z.string(),
  banner_url: z.string().nullable().optional(),
  start_date: z.string(),
  end_date: z.string()
});

const candidateSchema = z.object({
  name: z.string(),
  bio: z.string().nullable().optional(),
  photo_url: z.string().nullable().optional()
});

router.get("/", campaignsCtrl.list);
router.get("/:id", campaignsCtrl.get);

router.post("/",authenticate,authorizeRoles("admin", "moderator"),validate(campaignSchema),campaignsCtrl.create);
router.put("/:id",authenticate,authorizeRoles("admin", "moderator"),validate(campaignSchema.partial()),campaignsCtrl.update);
router.delete("/:id",authenticate,authorizeRoles("admin", "moderator"),campaignsCtrl.remove);

router.post("/:id/candidates",authenticate,authorizeRoles("admin", "moderator"),validate(candidateSchema),campaignsCtrl.addCandidate);
router.put("/:id/candidates/:candidateId",authenticate,authorizeRoles("admin", "moderator"),validate(candidateSchema.partial()),campaignsCtrl.updateCandidate);
router.delete("/:id/candidates/:candidateId",authenticate,authorizeRoles("admin", "moderator"),campaignsCtrl.removeCandidate);

router.post("/:id/vote",authenticate,authorizeRoles("voter", "moderator"),campaignsCtrl.castVote);

module.exports = router;

