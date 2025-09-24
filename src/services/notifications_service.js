// services/notifications_service.js
const db = require("../db/pgPool");

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
  await db.query(
    `INSERT INTO notifications (id, user_id, type, metadata)
        SELECT gen_random_uuid(), u.id, $1, $2
        FROM users u
        WHERE u.role = 'admin'`,
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
}

module.exports = {
  getNotifications,
  userCreateNotification,
  campaignNotification,
};
