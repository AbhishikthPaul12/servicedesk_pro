import { body } from "express-validator";

const ALLOWED_ASSET_TYPES = [
    "laptop",
    "desktop",
    "monitor",
    "printer",
    "mobile",
    "tablet",
    "network_device",
    "other"
];

const ALLOWED_ASSET_STATUSES = [
    "available",
    "assigned",
    "maintenance",
    "retired"
];

export const createAssetValidator = [
    body("name")
        .trim()
        .notEmpty().withMessage("Asset name is required")
        .isLength({ min: 2, max: 200 }).withMessage("Name must be between 2 and 200 characters"),
    body("assetTag")
        .trim()
        .notEmpty().withMessage("Asset tag is required")
        .isLength({ min: 2, max: 50 }).withMessage("Asset tag must be between 2 and 50 characters"),
    body("type")
        .notEmpty().withMessage("Asset type is required")
        .isIn(ALLOWED_ASSET_TYPES)
        .withMessage(`Invalid asset type. Allowed: ${ALLOWED_ASSET_TYPES.join(", ")}`),
    body("brand")
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage("Brand must be at most 100 characters"),
    body("model")
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage("Model must be at most 100 characters"),
    body("serialNumber")
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage("Serial number must be at most 100 characters"),
    body("status")
        .optional()
        .isIn(ALLOWED_ASSET_STATUSES)
        .withMessage(`Invalid asset status. Allowed: ${ALLOWED_ASSET_STATUSES.join(", ")}`),
    body("purchaseDate")
        .optional({ nullable: true, checkFalsy: true })
        .isISO8601().withMessage("Invalid purchase date format"),
    body("warrantyExpiry")
        .optional({ nullable: true, checkFalsy: true })
        .isISO8601().withMessage("Invalid warranty expiry date format"),
    body("assignedTo")
        .optional({ nullable: true, checkFalsy: true })
        .isMongoId().withMessage("Invalid assigned user ID")
];

export const updateAssetValidator = [
    body("name")
        .optional()
        .trim()
        .isLength({ min: 2, max: 200 }).withMessage("Name must be between 2 and 200 characters"),
    body("type")
        .optional()
        .isIn(ALLOWED_ASSET_TYPES)
        .withMessage(`Invalid asset type. Allowed: ${ALLOWED_ASSET_TYPES.join(", ")}`),
    body("status")
        .optional()
        .isIn(ALLOWED_ASSET_STATUSES)
        .withMessage(`Invalid asset status. Allowed: ${ALLOWED_ASSET_STATUSES.join(", ")}`),
    body("purchaseDate")
        .optional({ nullable: true, checkFalsy: true })
        .isISO8601().withMessage("Invalid purchase date format"),
    body("warrantyExpiry")
        .optional({ nullable: true, checkFalsy: true })
        .isISO8601().withMessage("Invalid warranty expiry date format"),
    body("assignedTo")
        .optional({ nullable: true, checkFalsy: true })
        .isMongoId().withMessage("Invalid assigned user ID")
];
