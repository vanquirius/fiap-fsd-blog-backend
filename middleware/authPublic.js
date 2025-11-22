const SERVER_SECRET = process.env.SERVER_SECRET || "default-server-secret";

module.exports = function (req, res, next) {
    const auth = req.headers.authorization;

    // Require Authorization header
    if (!auth || !auth.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }

    const token = auth.split(" ")[1];

    // Only allow SERVER_SECRET
    if (token !== SERVER_SECRET) {
        return res.status(401).json({ error: "Invalid token" });
    }

    // Mark system/bypass user
    req.user = { system: true };

    next();
};