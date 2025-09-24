const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const { getNotifications } = require("../services/notifications_service");

// GET /api/notifications
router.get("/", authenticate, async (req, res) => {
  try {
    // Assuming you have authentication middleware that sets req.user.id
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const notifications = await getNotifications(userId);
    console.log("[Backend] Returning notifications:", notifications);

    res.json(notifications);
  } catch (err) {
    console.error("[Backend] Error fetching notifications:", err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

module.exports = router;
