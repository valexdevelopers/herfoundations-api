import { Request, Response, NextFunction } from 'express';
import { authService } from '../../container'; 
import { authControllerlogger } from '../../container';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      
      console.log({req:req.body})
      // await authControllerlogger.info(JSON.stringify(req.headers), "authcontroller/register" )
      return {}
      // const result = await authService.creatAccount();
      // res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  // static async login(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     const result = await authService.login();
  //     res.status(200).json(result);
  //   } catch (err) {
  //     next(err);
  //   }
  // }
}
