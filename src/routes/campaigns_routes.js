const express = require('express');
const router = express.Router();
const campaignsCtrl = require('../controllers/campaigns_controller');
const { authenticate } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');

router.get('/', campaignsCtrl.list);
router.get('/:id', campaignsCtrl.get);

router.post('/', authenticate, authorizeRoles('admin','moderator'), campaignsCtrl.create);
router.put('/:id', authenticate, authorizeRoles('admin','moderator'), campaignsCtrl.update);
router.delete('/:id', authenticate, authorizeRoles('admin'), campaignsCtrl.remove);

router.post('/:id/candidates', authenticate, authorizeRoles('admin','moderator'), campaignsCtrl.addCandidate);

router.post('/:id/vote', authenticate, authorizeRoles('voter'/*,'admin'*/,'moderator'), campaignsCtrl.castVote);

module.exports = router;
