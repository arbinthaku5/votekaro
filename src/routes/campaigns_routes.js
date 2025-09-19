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
  title: z.string().min(3),
  description: z.string().min(10),
  banner: z.string().optional(),
  startDate: z.string(), 
  endDate: z.string()
});

const candidateSchema = z.object({
  name: z.string().min(2),
  bio: z.string().min(10),
  photo: z.string().optional()
});

router.get("/", campaignsCtrl.list);
router.get("/:id", campaignsCtrl.get);

router.post("/",authenticate,authorizeRoles("admin", "moderator"),validate(campaignSchema),campaignsCtrl.create);
router.put("/:id",authenticate,authorizeRoles("admin", "moderator"),validate(campaignSchema.partial()),campaignsCtrl.update);
router.delete("/:id",authenticate,authorizeRoles("admin"),campaignsCtrl.remove);

router.post("/:id/candidates",authenticate,authorizeRoles("admin", "moderator"),validate(candidateSchema),campaignsCtrl.addCandidate);

router.post("/:id/vote",authenticate,authorizeRoles("voter", "moderator"),campaignsCtrl.castVote);

module.exports = router;

