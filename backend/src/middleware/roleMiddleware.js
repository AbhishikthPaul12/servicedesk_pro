export const normalizeRole = (role) => {
    if (role === "admin") return "system_admin";
    if (role === "manager") return "it_manager";
    return role;
};

export const authorize = (...allowedRoles) => {
    const expandedRoles = new Set();
    allowedRoles.forEach((role) => {
        expandedRoles.add(role);
        if (role === "system_admin") expandedRoles.add("admin");
        if (role === "admin") expandedRoles.add("system_admin");
        if (role === "it_manager") expandedRoles.add("manager");
        if (role === "manager") expandedRoles.add("it_manager");
    });

    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        if (!expandedRoles.has(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to perform this action"
            });
        }

        next();
    };
};