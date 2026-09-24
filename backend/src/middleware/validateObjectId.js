import mongoose from "mongoose";

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
