// const express = require('express');
// const router = express.Router();
// const authCtrl = require('../controllers/auth_controller');

// router.post('/signup', authCtrl.signup);
// router.post('/login', authCtrl.login);

// module.exports = router;


const express = require("express");
const { z } = require("zod");
const { validate } = require("../middleware/validate");
const authCtrl = require("../controllers/auth_controller");

const router = express.Router();

const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

const loginSchema = z.object({
  email: z.email("Invalid email"),
  password: z.string().min(8, "Password is required"),
  rememberMe: z.boolean().optional()
});

router.post("/signup", validate(signupSchema), authCtrl.signup);
router.post("/login", validate(loginSchema), authCtrl.login);
router.post("/logout", authCtrl.logout);

module.exports = router;

