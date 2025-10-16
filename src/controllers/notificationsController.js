const notificationsService = require("../services/notifications_service");

exports.list = async (req, res, next) => {
  try {
    const notifications = await notificationsService.getNotifications(req.user.id);
    res.json(notifications);
  } catch (err) {
    next(err);
  }
};
