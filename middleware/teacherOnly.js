module.exports = function teacherOnly(req, res, next) {
    if (req.user.type !== "teacher") {
        return res.status(403).json({
            error: "Only teachers can perform this action"
        });
    }
    next();
};