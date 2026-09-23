import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
    try {
        let token;

        // Check Authorization header
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer ")
        ) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        // Verify JWT
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Find user
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User no longer exists"
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "User account is inactive"
            });
        }

        // Attach user to request
        req.user = user;

        next();
    } catch (error) {
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token"
            });
        }

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Authentication token has expired"
            });
        }

        next(error);
    }
};

export const authorize = (...roles) => {
    const expandedRoles = new Set();
    roles.forEach((role) => {
        expandedRoles.add(role);
        if (role === "system_admin") expandedRoles.add("admin");
        if (role === "admin") expandedRoles.add("system_admin");
        if (role === "it_manager") expandedRoles.add("manager");
        if (role === "manager") expandedRoles.add("it_manager");
    });

    return (req, res, next) => {
        if (!req.user || !expandedRoles.has(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to perform this action"
            });
        }

        next();
    };
};