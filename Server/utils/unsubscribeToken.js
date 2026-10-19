const crypto = require("crypto");
const { config } = require("../config/secret");

/**
 * Unsubscribe token derived from the member id – no need to store it in the DB,
 * and it cannot be forged without JWT_SECRET.
 */
const signMemberId = (memberId) =>
    crypto.createHmac("sha256", String(config.JWT_SECRET || "")).update(String(memberId)).digest("hex").slice(0, 32);

exports.createUnsubscribeToken = signMemberId;

exports.verifyUnsubscribeToken = (memberId, token) => {
    const expected = signMemberId(memberId);
    const given = String(token || "");
    return given.length === expected.length
        && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
};
