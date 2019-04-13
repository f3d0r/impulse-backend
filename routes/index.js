const constants = require('../config');
const mainEndpoints = require('./api/main');
const router = require('express').Router();

router.use(`${constants.express.GLOBAL_ENDPOINT}/`, mainEndpoints);

module.exports = router;
