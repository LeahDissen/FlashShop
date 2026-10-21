const RateLimit = require('express-rate-limit');

const ApiRateLimiter = RateLimit({
  windowMs: 60 * 1000, 
  max: 5, 
  message: { msg: 'יותר מדי ניסיונות. המתיני דקה ונסי שוב.' }
});

module.exports = ApiRateLimiter;
/**
 * For the price quote, open to guests: the cart asks again on every change, so the limit is generous
 * per visitor, but a script cannot run the order pricing (or try coupon codes) without end.
 */
module.exports.QuoteRateLimiter = RateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { msg: 'יותר מדי בקשות. המתיני דקה ונסי שוב.' }
});
