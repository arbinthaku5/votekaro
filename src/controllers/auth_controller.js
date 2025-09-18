const authService = require('../services/auth_service');

exports.signup = async (req, res, next) => {
  try {
    const created = await authService.signup(req.validated || req.body);
    res.status(201).json({ user: created });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const tokens = await authService.login(req.validated || req.body);
    res.json(tokens);
  } catch (err) { next(err); }
};
