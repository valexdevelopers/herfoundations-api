import { Request, Response, NextFunction } from "express"
import jwt from 'jsonwebtoken'
import { AuthError } from "../utils/errorhandlers"
import { ErrorCodes } from "../utils/enums"

export const authenticate  = (req: Request, res: Response, next: NextFunction) => {
    try {
        let authHeader = req.headers['authorization']
        console.log({authHeader})
        if(Array.isArray(authHeader)){
            authHeader = authHeader[1]
        }
        const accessToken =  req.cookies.AccessToken || authHeader?.split(" ")[1]  
        if(!accessToken){
        throw new AuthError(
                'Access token is required ',
                403,
                ErrorCodes.MISING_DATA
            )
        }

        // verify token
        const payload = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET as jwt.Secret)
        console.log({payload})
        next()  
    } catch (error) {
        if(error instanceof AuthError){
            throw error
        }
        throw new AuthError(
            'Access token has expired',
            403,
            ErrorCodes.TOKEN_INVALID
        )
    }
    
    
}