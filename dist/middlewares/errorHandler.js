"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const enums_1 = require("../utils/enums");
function errorHandler(err, req, res, next) {
    console.error(err); // log the actual error
    res.status(err.statusCode || 500).json({
        success: false,
        name: err.name || "Unexpected Error",
        code: err.code || enums_1.ErrorCodes.INTERNAL_ERROR,
        statusCode: err.statusCode || 500,
        message: err.message || "Internal Server Error: an unexpected error occurred",
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
}
