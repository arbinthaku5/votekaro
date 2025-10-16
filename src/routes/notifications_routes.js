const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const notificationsController = require("../controllers/notificationsController");

router.get("/", authenticate, notificationsController.list);

module.exports = router;
