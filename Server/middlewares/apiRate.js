const RateLimit = require('express-rate-limit');

const ApiRateLimiter = RateLimit({
  windowMs: 60 * 1000, 
  max: 5, 
  message: 'Too many attempts, please try again after some time'
});

module.exports = ApiRateLimiter;