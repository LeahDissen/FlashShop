import config from "../config/secret.js";
import jwt from "jsonwebtoken"; 

export const authAdmin = (req, res, next) => {
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
        console.log(err);
        res.status(401).json({ msg: "Invalid token" });
    }
}