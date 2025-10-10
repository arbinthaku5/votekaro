// services/notifications_service.js
const db = require("../db/pgPool");
const { getIo } = require("../realtime/socket");

async function getNotifications(userId) {
  const { rows } = await db.query(
    `SELECT 
       id,
       type,
       metadata,
       created_at AS created_date
     FROM notifications 
     ORDER BY created_at DESC`
  );
  return rows;
}

async function userCreateNotification({ type, userId, metadata }) {
  const { rows } = await db.query(
    `INSERT INTO notifications (id, type, user_id, metadata, created_at)
        VALUES (gen_random_uuid(), $1, $2, $3::jsonb, NOW())
        RETURNING *`,
    [type, userId, JSON.stringify(metadata)]
  );
  return rows[0];
}

async function campaignNotification(type, actorId, campaign) {
  // Insert notifications for all admins and return the created rows so we can broadcast with ids
  const { rows: created } = await db.query(
    `INSERT INTO notifications (id, user_id, type, metadata, created_at)
        SELECT gen_random_uuid(), u.id, $1, $2::jsonb, NOW()
        FROM users u
        WHERE u.role = 'admin'
        RETURNING id, user_id, type, metadata, created_at`,
    [
      type,
      JSON.stringify({
        created_by: actorId,
        campaign_title: campaign.title,
        start_date: campaign.start_date,
        end_date: campaign.end_date,
      }),
    ]
  );

  const io = getIo();

  // Emit per-user (if clients join personal rooms) and to the admins room
  created.forEach((notif) => {
    const payload = {
      id: notif.id,
      user_id: notif.user_id,
      type: notif.type,
      metadata: notif.metadata,
      created_at: notif.created_at,
    };

    io.to(notif.user_id).emit("notification:new", payload);
    io.to("admins").emit("notification:new", payload);
  });
}

module.exports = {
  getNotifications,
  userCreateNotification,
  campaignNotification,
};
