const db = require('../db/pgPool');

async function getNotificationsByUser(userId) {
  const { rows } = await db.query(
    `SELECT
       id,
       type,
       metadata,
       created_at AS created_date
     FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
}

async function createNotification({ id, type, userId, metadata }) {
  const { rows } = await db.query(
    `INSERT INTO notifications (id, type, user_id, metadata, created_at)
        VALUES ($1, $2, $3, $4::jsonb, NOW())
        RETURNING *`,
    [id, type, userId, JSON.stringify(metadata)]
  );
  return rows[0];
}

async function createNotificationsForAdmins(type, metadata) {
  const { rows } = await db.query(
    `INSERT INTO notifications (id, user_id, type, metadata, created_at)
        SELECT gen_random_uuid(), u.id, $1, $2::jsonb, NOW()
        FROM users u
        WHERE u.role = 'admin'
        RETURNING id, user_id, type, metadata, created_at`,
    [type, JSON.stringify(metadata)]
  );
  return rows;
}

module.exports = {
  getNotificationsByUser,
  createNotification,
  createNotificationsForAdmins,
};
