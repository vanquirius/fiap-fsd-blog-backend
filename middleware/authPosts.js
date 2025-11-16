const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.SERVER_SECRET || "default-server-secret";

module.exports = function (req, res, next) {
    const auth = req.headers.authorization;

    if (!auth || !auth.startsWith("Bearer ")) {
        return res.status(401).json({
            error: "Missing or invalid Authorization header",
        });
    }

    const token = auth.split(" ")[1];

    // Allow SERVER_SECRET (for tests + Postman)
    if (token === JWT_SECRET) {
        req.user = { system: true };
        return next();
    }

    // Otherwise validate JWT (normal user login)
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid token" });
    }
};