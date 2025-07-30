import { Request, Response, NextFunction } from "express";
import { ErrorCodes } from "../utils/enums";

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
    console.error(err); // log the actual error
    res.status(err.statusCode || 500).json({
        success: false,
        name: err.name || "Unexpected Error",
        code: err.code || ErrorCodes.INTERNAL_ERROR,
        statusCode: err.statusCode || 500,
        message: err.message || "Internal Server Error: an unexpected error occurred",
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
}
