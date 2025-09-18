const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth_routes'));
router.use('/users', require('./users_routes'));
router.use('/campaigns', require('./campaigns_routes'));

module.exports = router;
