import { Request, Response, NextFunction } from 'express';
import { authService } from '../../container';
import { authControllerlogger } from '../../container';
import { CreateUserDto } from '../../utils/dtos/user/create-user.dto';
import { LoginUserDto } from '../../utils/dtos/user/login-user.dto';

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

    static async login(req: Request, res: Response, next: NextFunction) {
        try {
            console.log({ req: req.body })
            const loginUserInput: LoginUserDto = {
                email: req.body.email,
                password: req.body.password,
                authProvider: req.body.authProvider,
                authToken: req.body.authToken,
            }
            const result = await authService.login(loginUserInput);
            res.status(200).json(result);
            
        } catch (err) {
            next(err);
        }
    }
}
