const usersService = require('../services/users_service');

exports.me = async (req, res, next) => {
  try {
    const user = await usersService.getProfile(req.user.id);
    res.json(user);
  } catch (err) { next(err); }
};

exports.updateMe = async (req, res, next) => {
  try {
    const updated = await usersService.updateProfile(req.user.id, req.validated || req.body);
    res.json(updated);
  } catch (err) { next(err); }
};

exports.adminUpdateUser = async (req, res, next) => {
  try {
    const updated = await usersService.adminUpdateUser(req.user.id, req.params.id, req.body);
    res.json(updated);
  } catch (err) { next(err); }
};

exports.adminDeleteUser = async (req, res, next) => {
  try {
    await usersService.adminDeleteUser(req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
};
