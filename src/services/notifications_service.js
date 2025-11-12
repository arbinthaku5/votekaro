const notificationsModel = require("../models/notifications_model");
const { getIo } = require("../realtime/socket");
const { v4: uuidv4 } = require("uuid");

async function getNotifications(userId) {
  return await notificationsModel.getNotificationsByUser(userId);
}

async function userCreateNotification({ type, userId, metadata }) {
  const id = uuidv4();
  const created = await notificationsModel.createNotification({ id, type, userId, metadata });

  // Emit to the specific user if userId is provided
  if (userId) {
    const io = getIo();
    const payload = {
      id: created.id,
      user_id: created.user_id,
      type: created.type,
      metadata: created.metadata,
      created_at: created.created_at,
    };
    io.to(userId).emit("notification:new", payload);
  }

  return created;
}

async function campaignNotification(type, actorId, campaign) {
  const metadata = {
    created_by: actorId,
    campaign_title: campaign.title,
    start_date: campaign.start_date,
    end_date: campaign.end_date,
  };
  const created = await notificationsModel.createNotificationsForAdminsAndModerators(type, metadata);

  const io = getIo();

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

async function userSignupNotification(metadata) {
  const created = await notificationsModel.createNotificationsForAdminsAndModerators("user_created", metadata);

  const io = getIo();

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

  return created;
}

module.exports = {
  getNotifications,
  userCreateNotification,
  campaignNotification,
  userSignupNotification,
};
