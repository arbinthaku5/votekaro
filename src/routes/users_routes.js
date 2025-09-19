// const express = require('express');
// const router = express.Router();
// const usersCtrl = require('../controllers/users_controller');
// const { authenticate } = require('../middleware/auth');
// const { authorizeRoles } = require('../middleware/rbac');

// router.get('/me', authenticate, usersCtrl.me);
// router.put('/me', authenticate, usersCtrl.updateMe);

// // admin routes
// router.put('/:id', authenticate, authorizeRoles('admin'), usersCtrl.adminUpdateUser);
// router.delete('/:id', authenticate, authorizeRoles('admin'), usersCtrl.adminDeleteUser);

// module.exports = router;

const express = require("express");
const { z } = require("zod");
const { validate } = require("../middleware/validate");
const usersCtrl = require("../controllers/users_controller");
const { authenticate } = require("../middleware/auth");
const { authorizeRoles } = require("../middleware/rbac");

const router = express.Router();

const updateMeSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  username: z.string().min(3).optional(),
  email: z.email().optional(),
  bio: z.string().max(500).optional(),
  dob: z.string().optional(),
  password: z.string().min(8).optional()
});

router.get("/me", authenticate, usersCtrl.me);
router.put("/me", authenticate, validate(updateMeSchema), usersCtrl.updateMe);

// admin routes
router.get("/", authenticate, authorizeRoles("admin"), usersCtrl.list);
router.put("/:id", authenticate,authorizeRoles("admin"),validate(updateMeSchema),usersCtrl.adminUpdateUser);
router.delete("/:id",authenticate,authorizeRoles("admin"),usersCtrl.adminDeleteUser);

module.exports = router;
