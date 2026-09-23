import { body } from "express-validator";

export const createVendorValidator = [
    body("name")
        .trim()
        .notEmpty().withMessage("Vendor name is required")
        .isLength({ min: 2, max: 200 }).withMessage("Name must be between 2 and 200 characters"),
    body("contactPerson")
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage("Contact person must be at most 100 characters"),
    body("email")
        .optional()
        .trim()
        .isEmail().withMessage("Please provide a valid email address")
        .normalizeEmail(),
    body("phone")
        .optional()
        .trim()
        .isLength({ max: 20 }).withMessage("Phone must be at most 20 characters"),
    body("servicesProvided")
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage("Services provided must be at most 500 characters")
];

export const updateVendorValidator = [
    body("name")
        .optional()
        .trim()
        .isLength({ min: 2, max: 200 }).withMessage("Name must be between 2 and 200 characters"),
    body("contactPerson")
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage("Contact person must be at most 100 characters"),
    body("email")
        .optional()
        .trim()
        .isEmail().withMessage("Please provide a valid email address")
        .normalizeEmail(),
    body("phone")
        .optional()
        .trim()
        .isLength({ max: 20 }).withMessage("Phone must be at most 20 characters")
];
