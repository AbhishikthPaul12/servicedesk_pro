import { body } from "express-validator";

export const createUserValidator = [
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
        .isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
    body("role")
        .notEmpty().withMessage("Role is required")
        .isIn(["employee", "technician", "it_manager", "asset_manager", "system_admin"])
        .withMessage("Invalid role specified"),
    body("department")
        .optional({ nullable: true, checkFalsy: true })
        .isMongoId().withMessage("Invalid department ID"),
    body("isActive")
        .optional()
        .isBoolean().withMessage("isActive must be a boolean value")
];

export const updateUserValidator = [
    body("name")
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage("Name must be between 2 and 100 characters"),
    body("email")
        .optional()
        .trim()
        .isEmail().withMessage("Please provide a valid email address")
        .normalizeEmail(),
    body("role")
        .optional()
        .isIn(["employee", "technician", "it_manager", "asset_manager", "system_admin"])
        .withMessage("Invalid role specified"),
    body("department")
        .optional({ nullable: true, checkFalsy: true })
        .isMongoId().withMessage("Invalid department ID"),
    body("isActive")
        .optional()
        .isBoolean().withMessage("isActive must be a boolean value")
];
