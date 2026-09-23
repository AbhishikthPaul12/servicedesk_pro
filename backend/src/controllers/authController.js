import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { generateToken } from "../utils/jwt.js";

export const register = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

        // Disallow self-registration for administrator roles
        const requestedRole = role ? String(role).trim().toLowerCase() : "employee";
        const restrictedAdminRoles = ["admin", "system_admin"];

        if (restrictedAdminRoles.includes(requestedRole)) {
            return res.status(403).json({
                success: false,
                message: "Direct self-registration as an Administrator is prohibited. Admin credentials must be provisioned directly in the database or by an authorized system owner."
            });
        }

        // Only allow standard self-registration roles, default to employee
        const allowedSelfRoles = ["employee", "technician"];
        const sanitizedRole = allowedSelfRoles.includes(requestedRole) ? requestedRole : "employee";

        // Check whether user already exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User with this email already exists"
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: sanitizedRole
        });

        // Generate JWT
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        next(error);
    }
};

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select("+password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "Your account has been deactivated"
            });
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        next(error);
    }
};

export const getMe = async (req, res, next) => {
    try {
        res.status(200).json({
            success: true,
            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role,
                department: req.user.department
            }
        });
    } catch (error) {
        next(error);
    }
};