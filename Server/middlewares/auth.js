const jwt = require("jsonwebtoken");
const { config } = require("../config/secret")

exports.auth = (req, res, next) => {
    let token = req.cookies.authToken;
    if (!token) {
        token = req.header("x-api-key");
    }
    if (!token) {
        return res.status(401).json({ msg: "You must send token" });
    }
    try {
        let verified = jwt.verify(token, config.JWT_SECRET);
        req.tokenData = verified;
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ msg: "פג תוקף ההתחברות. יש להתחבר מחדש.", code: "TOKEN_EXPIRED" });
        }
        return res.status(401).json({ msg: "טוקן לא תקין", code: "INVALID_TOKEN" });
    }
}

exports.authAdmin = (req, res, next) => {
    let token = req.cookies.authToken || req.header("x-api-key");
    if (!token) {
       
        return res.status(401).json({ msg: "You must send token" });
    }
    try {
        let verified = jwt.verify(token, config.JWT_SECRET);
        req.tokenData = verified;
        if (verified.role != "admin") {
            return res.status(403).json({ msg: "Access denied. Admins only." });
        }
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ msg: "פג תוקף ההתחברות. יש להתחבר מחדש.", code: "TOKEN_EXPIRED" });
        }
        return res.status(401).json({ msg: "טוקן לא תקין", code: "INVALID_TOKEN" });
    }
}