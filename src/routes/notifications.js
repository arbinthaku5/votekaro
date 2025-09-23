// routes/notifications.js
const express = require("express");
const router = express.Router();
const db = require("../db/pgPool");

router.get("/", async (req, res) => {
  console.log("[Backend] GET /api/notifications called");
  try {
    const { rows } = await db.query(
      "SELECT * FROM notifications ORDER BY created_at DESC"
    );
    console.log("[Backend] Fetched notifications:", rows);
    res.json(rows);
  } catch (err) {
    console.error("[Backend] Error fetching notifications:", err);
    res.status(500).send("Server error");
  }
});

module.exports = router;
