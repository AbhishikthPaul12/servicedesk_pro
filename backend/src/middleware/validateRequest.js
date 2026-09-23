import { validationResult } from "express-validator";

/**
 * Generic express-validator result handler.
 * Place after validation chains in routes to halt on validation failures.
 */
export const validateRequest = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array().map((err) => ({
                field: err.path,
                message: err.msg
            }))
        });
    }

    next();
};

export default validateRequest;
