const serverless = require('serverless-http');
const app = require('../src/app');

// Increase performance by caching DB connection (handled inside db.js pool)
module.exports.handler = serverless(app);
