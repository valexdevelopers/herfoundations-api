"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const container_1 = require("../../container");
const container_2 = require("../../container");
class AuthController {
    static async register(req, res, next) {
        try {
            const createUserInput = {
                email: req.body.email,
                password: req.body.password,
                authProvider: req.body.authProvider,
                authToken: req.body.authToken,
                userType: req.body.userType,
                providerUserId: req.body.providerUserId,
                isEmailVerified: req.body.isEmailVerified,
            };
            const result = await container_1.authService.create(createUserInput);
            await container_2.authControllerlogger.info("authcontroller/register", JSON.stringify(req.body));
            res.status(201).json(result);
        }
        catch (err) {
            next(err);
        }
    }
    static async login(req, res, next) {
        try {
            console.log({ req: req.body });
            const loginUserInput = {
                email: req.body.email,
                password: req.body.password,
                authProvider: req.body.authProvider,
                authToken: req.body.authToken,
            };
            const ua = req.headers['user-agent'] || "";
            const agent = ua.includes("Mozilla") || ua.includes("Chrome") || ua.includes("Safari") || ua.includes("PostmanRuntime");
            const result = await container_1.authService.login(loginUserInput);
            res.cookie("refreshToken", result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                path: "/api/v1/auth/refresh",
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
            res.status(200).json({
                ...result,
                refreshToken: agent ? undefined : result.refreshToken
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async refresh(req, res, next) {
        try {
            const refreshToken = req.cookies.refreshToken;
            if (!refreshToken) {
                return res.status(401).json({ message: "No refresh token found" });
            }
            const ua = req.headers['user-agent'] || "";
            const agent = ua.includes("Mozilla") || ua.includes("Chrome") || ua.includes("Safari") || ua.includes("PostmanRuntime");
            const result = await container_1.authService.refresh(refreshToken);
            res.cookie("refreshToken", result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                path: "/api/v1/auth/refresh",
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
            res.status(200).json({
                ...result,
                refreshToken: agent ? undefined : result.refreshToken
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async verifyEmail(req, res, next) {
        try {
            const user = req.user;
            const result = await container_1.authService.verify(user.id, req.body.token);
            res.status(200).json({ result });
        }
        catch (error) {
            next(error);
        }
    }
    static async resendVerificatioCode(req, res, next) {
        try {
            const user = req.user;
            const result = await container_1.authService.resendEmailVerificationToken(user.id);
            res.status(200).json({ result });
        }
        catch (error) {
            next(error);
        }
    }
    static async changePrimaryEmail(req, res, next) {
        try {
            console.log('git here');
            const user = req.user;
            const result = await container_1.authService.resendEmailVerificationToken(user.id);
            res.status(200).json({ result });
        }
        catch (error) {
            next(error);
        }
    }
    static async update(req, res, next) {
        try {
            const { id } = req.params;
            const updateUserInput = { ...req.body };
            const result = await container_1.authService.update(id, updateUserInput);
            res.status(200).json(result);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.AuthController = AuthController;
