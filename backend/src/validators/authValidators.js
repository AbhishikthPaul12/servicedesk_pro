import { body } from "express-validator";

export const registerValidator = [
    body("name")
        .trim()
        .notEmpty().withMessage("Name is required")
        .isLength({ min: 2, max: 100 }).withMessage("Name must be between 2 and 100 characters"),
    body("email")
        .trim()
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Please provide a valid email address")
        .normalizeEmail(),
    body("password")
        .notEmpty().withMessage("Password is required")
        .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("role")
        .optional()
        .isIn(["employee", "technician", "it_manager", "manager", "asset_manager", "system_admin", "admin"])
        .withMessage("Invalid role specified")
];

export const loginValidator = [
    body("email")
        .trim()
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Please provide a valid email address")
        .normalizeEmail(),
    body("password")
        .notEmpty().withMessage("Password is required")
];
