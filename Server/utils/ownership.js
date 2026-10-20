/** Who may see or act on a user's data: the user themselves or an admin */

/** Compares ids that may be ObjectIds or strings */
const isSameUser = (a, b) => String(a) === String(b);

/** Sends 403 and returns false unless the request is from this user or an admin */
const ensureSelfOrAdmin = (req, res, userId) => {
    if (!isSameUser(req.tokenData._id, userId) && req.tokenData.role !== "admin") {
        res.status(403).json({ msg: "אין הרשאה לצפות במידע זה" });
        return false;
    }
    return true;
};

module.exports = { isSameUser, ensureSelfOrAdmin };
