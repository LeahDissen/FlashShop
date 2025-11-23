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
        console.log(err);
        res.status(401).json({ msg: "Invalid token" });
    }
}

exports.authAdmin = (rep, res, next) => {
    let token = req.header("x-api-key");
    if (!token) {
        return res.status(401).json({ msg: "You must send token" });
    }
    try {
        let verified = jwt.verify(token, config.jwtSecret);
        req.tokenData = verified;

        if (verified.role != "admin") {
            return res.status(403).json({ msg: "Invalid token" });

        }
        next();
    } catch (err) {
        console.log(err);
        res.status(401).json({ msg: "Invalid token" });
    }
}