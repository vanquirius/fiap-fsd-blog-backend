const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "default-jwt-secret";

module.exports = function (req, res, next) {
    const auth = req.headers.authorization;

    if (!auth || !auth.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }

    const token = auth.split(" ")[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // Minimal but important change:
        // explicitly expose only what the backend needs
        req.user = {
            id: decoded.id,
            type: decoded.type
        };

        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ error: "Token expired" });
        }

        return res.status(401).json({ error: "Invalid token" });
    }
};