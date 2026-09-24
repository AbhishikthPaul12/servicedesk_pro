
export const notFoundHandler = (req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });
};

export const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";
    let errors = null;

    if (err.name === "ValidationError" && err.errors) {
        statusCode = 400;
        message = "Validation failed";
        errors = Object.keys(err.errors).map((field) => ({
            field,
            message: err.errors[field].message
        }));
    }

    if (err.name === "CastError") {
        statusCode = 400;
        message = `Invalid ${err.path}: ${err.value}`;
    }

    if (err.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyPattern || {})[0] || "field";
        message = `Duplicate value for '${field}'. This ${field} already exists.`;
    }

    if (err.name === "JsonWebTokenError") {
        statusCode = 401;
        message = "Invalid authentication token";
    }

    if (err.name === "TokenExpiredError") {
        statusCode = 401;
        message = "Authentication token has expired";
    }

    if (err.code === "LIMIT_FILE_SIZE") {
        statusCode = 400;
        message = "File too large. Maximum file size is 10MB.";
    }

    if (err.code === "LIMIT_FILE_COUNT") {
        statusCode = 400;
        message = "Too many files. Maximum 5 files per upload.";
    }

    if (err.code === "LIMIT_UNEXPECTED_FILE") {
        statusCode = 400;
        message = "Unexpected file field name.";
    }

    if (err.message && err.message.includes("File type")) {
        statusCode = 400;
    }

    const response = {
        success: false,
        message
    };

    if (errors) {
        response.errors = errors;
    }

    if (process.env.NODE_ENV !== "production") {
        response.stack = err.stack;
    }

    res.status(statusCode).json(response);
};
