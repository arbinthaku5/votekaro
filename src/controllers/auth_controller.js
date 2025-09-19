const authService = require('../services/auth_service');

exports.signup = async (req, res, next) => {
  try {
    const created = await authService.signup(req.validated || req.body);
    res.status(201).json({ user: created });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { accessToken, user } = await authService.login(req.validated || req.body);

    // Set HttpOnly cookie with the JWT token
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use HTTPS in production
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    // Return user data without the token
    res.json({ user });
  } catch (err) { next(err); }
};

exports.logout = async (req, res, next) => {
  try {
    // Clear the HttpOnly cookie
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.json({ message: 'Logged out successfully' });
  } catch (err) { next(err); }
};
