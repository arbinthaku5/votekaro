const express = require('express');
const router = express.Router();
const usersCtrl = require('../controllers/users_controller');
const { authenticate } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/rbac');

router.get('/me', authenticate, usersCtrl.me);
router.put('/me', authenticate, usersCtrl.updateMe);

// admin routes
router.put('/:id', authenticate, authorizeRoles('admin'), usersCtrl.adminUpdateUser);
router.delete('/:id', authenticate, authorizeRoles('admin'), usersCtrl.adminDeleteUser);

module.exports = router;
