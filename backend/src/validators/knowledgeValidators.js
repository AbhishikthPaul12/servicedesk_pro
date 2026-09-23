import { body } from "express-validator";

export const createArticleValidator = [
    body("title")
        .trim()
        .notEmpty().withMessage("Article title is required")
        .isLength({ min: 5, max: 300 }).withMessage("Title must be between 5 and 300 characters"),
    body("content")
        .trim()
        .notEmpty().withMessage("Article content is required")
        .isLength({ min: 20 }).withMessage("Content must be at least 20 characters"),
    body("summary")
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage("Summary must be at most 500 characters"),
    body("category")
        .optional()
        .isIn(["hardware", "software", "network", "access", "security", "general", "other"])
        .withMessage("Invalid article category"),
    body("visibility")
        .optional()
        .isIn(["all", "technician", "manager", "admin"])
        .withMessage("Invalid visibility level"),
    body("tags")
        .optional()
        .isArray().withMessage("Tags must be an array"),
    body("tags.*")
        .optional()
        .isString().withMessage("Each tag must be a string")
        .trim()
];

export const updateArticleValidator = [
    body("title")
        .optional()
        .trim()
        .isLength({ min: 5, max: 300 }).withMessage("Title must be between 5 and 300 characters"),
    body("content")
        .optional()
        .trim()
        .isLength({ min: 20 }).withMessage("Content must be at least 20 characters"),
    body("summary")
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage("Summary must be at most 500 characters"),
    body("category")
        .optional()
        .isIn(["hardware", "software", "network", "access", "security", "general", "other"])
        .withMessage("Invalid article category"),
    body("status")
        .optional()
        .isIn(["draft", "published", "archived"])
        .withMessage("Invalid article status"),
    body("visibility")
        .optional()
        .isIn(["all", "technician", "manager", "admin"])
        .withMessage("Invalid visibility level"),
    body("tags")
        .optional()
        .isArray().withMessage("Tags must be an array")
];
