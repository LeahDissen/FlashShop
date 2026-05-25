const RateLimit = require('express-rate-limit');

const ApiRateLimiter = RateLimit({
  windowMs: 60 * 1000, 
  max: 5, 
  message: { msg: 'יותר מדי ניסיונות. המתיני דקה ונסי שוב.' }
});

module.exports = ApiRateLimiter;