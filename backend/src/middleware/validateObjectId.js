import mongoose from "mongoose";

/**
 * Middleware to validate MongoDB ObjectId route parameters.
 * Usage: router.get("/:id", validateObjectId("id"), controllerMethod);
 * Or: router.get("/:ticketId/comments/:commentId", validateObjectId("ticketId", "commentId"), ...);
 */
export const validateObjectId = (...paramNames) => {
    const params = paramNames.length > 0 ? paramNames : ["id"];

    return (req, res, next) => {
        for (const param of params) {
            const idValue = req.params[param];
            if (idValue && !mongoose.Types.ObjectId.isValid(idValue)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid ID format for parameter '${param}': '${idValue}'`
                });
            }
        }
        next();
    };
};

export default validateObjectId;
