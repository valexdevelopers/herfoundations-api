"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errorhandlers_1 = require("../utils/errorhandlers");
const enums_1 = require("../utils/enums");
const authenticate = (req, res, next) => {
    try {
        let authHeader = req.headers['authorization'];
        console.log({ authHeader });
        if (Array.isArray(authHeader)) {
            authHeader = authHeader[1];
        }
        const accessToken = req.cookies.AccessToken || authHeader?.split(" ")[1];
        if (!accessToken) {
            throw new errorhandlers_1.AuthError('Access token is required ', 403, enums_1.ErrorCodes.MISING_DATA);
        }
        // verify token
        const payload = jsonwebtoken_1.default.verify(accessToken, process.env.JWT_ACCESS_SECRET);
        req.user = payload;
        next();
    }
    catch (error) {
        if (error instanceof errorhandlers_1.AuthError) {
            throw error;
        }
        throw new errorhandlers_1.AuthError('Access token has expired', 403, enums_1.ErrorCodes.TOKEN_INVALID);
    }
};
exports.authenticate = authenticate;
