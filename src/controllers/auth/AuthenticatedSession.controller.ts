import { Request, Response, NextFunction } from 'express';
import { authService } from '../../container';
import { authControllerlogger } from '../../container';
import { CreateUserDto } from '../../utils/dtos/user/create-user.dto';
import { LoginUserDto } from '../../utils/dtos/user/login-user.dto';
import { UpdateUserDto } from '../../utils/dtos/user/update-user.dto';
import jwt from 'jsonwebtoken';

export class AuthController {

    static async register(req: Request, res: Response, next: NextFunction): Promise<any> {
        try {
            const createUserInput: CreateUserDto = {
                email: req.body.email,
                password: req.body.password,
                authProvider: req.body.authProvider,
                authToken: req.body.authToken,
                userType: req.body.userType,
                providerUserId: req.body.providerUserId,
                isEmailVerified: req.body.isEmailVerified,

            }
            const result = await authService.create(createUserInput);
            await authControllerlogger.info("authcontroller/register", JSON.stringify(req.body))
            res.status(201).json(result);
        } catch (err) {
            next(err);
        }
    }

    static async login(req: Request, res: Response, next: NextFunction): Promise<any> {
        try {
            console.log({ req: req.body })
            const loginUserInput: LoginUserDto = {
                email: req.body.email,
                password: req.body.password,
                authProvider: req.body.authProvider,
                authToken: req.body.authToken,
            }
            const ua = req.headers['user-agent'] || "";
            const agent =  ua.includes("Mozilla") || ua.includes("Chrome") || ua.includes("Safari") || ua.includes("PostmanRuntime"); 
            
            const result = await authService.login(loginUserInput);
            res.cookie("refreshToken", result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                path: "/api/v1/auth/refresh",
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
            res.status(200).json({
                ...result,
                refreshToken: agent ? undefined :result.refreshToken
            });
            
        } catch (err) {
            next(err);
        }
    }

    static async refresh(req: Request, res: Response, next: NextFunction): Promise<any> {
        try {
            const refreshToken = req.cookies.refreshToken;
           if (!refreshToken) {
                return res.status(401).json({ message: "No refresh token found" });
            }

            const ua = req.headers['user-agent'] || "";
            const agent =  ua.includes("Mozilla") || ua.includes("Chrome") || ua.includes("Safari") || ua.includes("PostmanRuntime"); 
            
            const result = await authService.refresh(refreshToken);
            res.cookie("refreshToken", result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                path: "/api/v1/auth/refresh",
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
            res.status(200).json(
                {
                ...result,
                refreshToken: agent ? undefined :result.refreshToken
            });
            
        } catch (err) {
            next(err);
        }
    }

    static async verifyEmail(req: Request, res: Response, next: NextFunction){
        try {
            const user:any = req.user
            const result = await authService.verify(user.id, req.body.token);
            res.status(200).json({result})
           
            
        } catch (error: any) {
            next(error)
            
        }
    }

    static async resendVerificatioCode (req: Request, res: Response, next: NextFunction){
        try {
            const user:any = req.user
            const result = await authService.resendEmailVerificationToken(user.id);
            res.status(200).json({result})

        } catch (error: any) {
            next(error)   
        }
    }

    
    static async changePrimaryEmail (req: Request, res: Response, next: NextFunction){
        try {
            const user:any = req.user
            const result = await authService.resendEmailVerificationToken(user.id);
            res.status(200).json({result})

        } catch (error: any) {
            next(error)   
        }
    }

    static async update(req: Request, res: Response, next: NextFunction): Promise<any> {
        try {

            const { id } = req.params;
            const updateUserInput: UpdateUserDto = {...req.body}
            const result = await authService.update(id, updateUserInput);
            res.status(200).json(result);
            
        } catch (err) {
            next(err);
        }
    }
}
