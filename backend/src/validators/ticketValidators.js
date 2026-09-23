import { body, param } from "express-validator";

export const createTicketValidator = [
    body("title")
        .trim()
        .notEmpty().withMessage("Title is required")
        .isLength({ min: 5, max: 200 }).withMessage("Title must be between 5 and 200 characters"),
    body("description")
        .trim()
        .notEmpty().withMessage("Description is required")
        .isLength({ min: 10, max: 5000 }).withMessage("Description must be between 10 and 5000 characters"),
    body("category")
        .optional()
        .isIn(["hardware", "software", "network", "access", "security", "other"])
        .withMessage("Invalid category"),
    body("priority")
        .optional()
        .isIn(["low", "medium", "high", "critical"])
        .withMessage("Invalid priority"),
    body("department")
        .optional()
        .isMongoId().withMessage("Invalid department ID")
];

export const updateTicketValidator = [
    body("title")
        .optional()
        .trim()
        .isLength({ min: 5, max: 200 }).withMessage("Title must be between 5 and 200 characters"),
    body("description")
        .optional()
        .trim()
        .isLength({ min: 10, max: 5000 }).withMessage("Description must be between 10 and 5000 characters"),
    body("category")
        .optional()
        .isIn(["hardware", "software", "network", "access", "security", "other"])
        .withMessage("Invalid category"),
    body("priority")
        .optional()
        .isIn(["low", "medium", "high", "critical"])
        .withMessage("Invalid priority"),
    body("status")
        .optional()
        .isIn(["open", "assigned", "in_progress", "resolved", "closed", "reopened"])
        .withMessage("Invalid status"),
    body("resolution")
        .optional()
        .trim()
        .isLength({ max: 5000 }).withMessage("Resolution must be at most 5000 characters")
];

export const assignTicketValidator = [
    body("technicianId")
        .notEmpty().withMessage("Technician ID is required")
        .isMongoId().withMessage("Invalid technician ID format")
];

export const createCommentValidator = [
    body("content")
        .trim()
        .notEmpty().withMessage("Comment content is required")
        .isLength({ min: 1, max: 2000 }).withMessage("Comment must be between 1 and 2000 characters"),
    body("type")
        .optional()
        .isIn(["comment", "internal_note"])
        .withMessage("Invalid comment type. Must be 'comment' or 'internal_note'")
];

export const createWorkLogValidator = [
    body("timeSpent")
        .notEmpty().withMessage("Time spent is required")
        .isFloat({ min: 1 }).withMessage("Time spent must be at least 1 minute"),
    body("description")
        .trim()
        .notEmpty().withMessage("Work log description is required")
        .isLength({ min: 3, max: 2000 }).withMessage("Description must be between 3 and 2000 characters")
];
