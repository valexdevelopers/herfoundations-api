import { IAuthProviderRepository, IAuthRepository } from "../utils/interfaces/account.interface"
import { ErrorCodes } from "../utils/enums"
import { AuthError, ValidationsError } from "../utils/errorhandlers"
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken"
import { Prisma } from "../../@prisma/client"
import { $Enums } from "../../@prisma/client"
import { CreateUserDto } from "../utils/dtos/user/create-user.dto";
import { LoginUserDto } from "../utils/dtos/user/login-user.dto";
import { UpdateUserDto } from "../utils/dtos/user/update-user.dto";
import { ValidationError } from "class-validator";

export class AuthService<M> {
    #authReposiory: IAuthRepository
    #authProviderReposiory: IAuthProviderRepository
    #JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET 
    #JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET
    #JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '1h'
    #JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d'

    constructor(authRepository: IAuthRepository, 
        authProviderReposiory: IAuthProviderRepository){
        this.#authReposiory = authRepository,
        this.#authProviderReposiory = authProviderReposiory
    }

    public async create (data: CreateUserDto): Promise<M> {
        
        switch (data.authProvider) {
            case 'self':
                let existingUser = await this.#authReposiory.findOneByEmail(data.email!)
                // if email is not unique and contains a value, throw error because user exists already
                if (existingUser) {
                    throw new AuthError(
                        "We have an existing user with this email, kindly login to your account.",
                        409,
                        ErrorCodes.EMAIL_ALREADY_EXISTS
                    )
                }
                data.isEmailVerified = false
                return await this.userProvider(data)

            case 'google':
                if(!data.authToken) {
                        throw new AuthError(
                        "Auth token cant be empty when using google to register.",
                        403,
                        ErrorCodes.MISING_DATA
                    )
                }

                const googleUser = await this.#authProviderReposiory.googleAuthProvider(data.authToken!)
                if(!googleUser) {
                        throw new AuthError(
                        "Google could not verify your account",
                        401,
                        ErrorCodes.GOOGLE_AUTH_FAILED
                    )
                }

                data.email = googleUser.email
                data.isEmailVerified = googleUser.email_verified
                existingUser = await this.#authReposiory.findOneByEmail(data.email!)
                if(existingUser){
                    const authProviderData = {userId: existingUser.id, provider: data.authProvider, providerUserId: googleUser.providerUserId!}
                    await this.#authProviderReposiory.connectUser(authProviderData)
                    return existingUser

                }else{
                    let user = await this.userProvider(data)
                    const authProviderData = {userId: user.user.id, provider: data.authProvider, providerUserId: googleUser.providerUserId!}

                    await this.#authProviderReposiory.connectUser(authProviderData)
                    return user
                }
                
                
            default:
                throw new AuthError(
                    "Bad Data Error! sorry this is not a valid authentication method.",
                    403,
                    ErrorCodes.MISING_DATA
                )
            }
        
    }
  
    public async login (data: LoginUserDto){
        switch (data.authProvider) {
            case "self":
                let user = await this.#authReposiory.findOneByEmail(data.email!)
                if(!user){
                   throw new AuthError(
                        "We couldn't find an existing user account with this email.",
                        404,
                        ErrorCodes.USER_NOT_FOUND
                    ) 
                }
                const isPasswordCorrect = await bcrypt.compare(data.password!, user.password!)
                if(!isPasswordCorrect){
                    throw new AuthError(
                        "Invalid credentials provided. Either email or password is incorrect",
                        401,
                        ErrorCodes.AUTH_FAILED
                    ) 
                }
                return await this.jwtSign(user)

            case "google":
                const googleUser = await this.#authProviderReposiory.googleAuthProvider(data.authToken!)
                if(!googleUser) {
                     throw new AuthError(
                        "Google could not verify your account",
                        401,
                        ErrorCodes.GOOGLE_AUTH_FAILED
                    )
                }
                user = await this.#authReposiory.findOneByEmail(googleUser.email!)
                if(!user){
                   throw new AuthError(
                        "We couldn't find an existing user account with this email, kindle register an account.",
                        404,
                        ErrorCodes.USER_NOT_FOUND
                    ) 
                }
                this.checkAccount(user)
                // if user is valid, check if this authprovider has been registered for this user
                // manual find or create
                try {
                    const authProviderData = {userId: user.id, provider: "google", providerUserId: googleUser.providerUserId as string}
                    await this.#authProviderReposiory.connectUser(authProviderData)

                } catch (error) {
                    throw new AuthError(
                        "Sever error! sorry we could not log you in due to some unexpected error. Kindly try again.",
                        500,
                        ErrorCodes.INTERNAL_ERROR
                    ) 
                }
                return await this.jwtSign(user)
            default:
                throw new AuthError(
                    "Unknowns authentication route detected. All associated accounts would be penalised",
                    404,
                    ErrorCodes.MISING_DATA
                ) 
                
        }

    }

    public async refresh (refreshToken: string){
        try {
            const verifiedUser = jwt.verify(refreshToken, this.#JWT_REFRESH_SECRET as jwt.Secret)
            const {id, ...rest} = verifiedUser as jwt.JwtPayload
            const user = await this.#authReposiory.findOneById(id)
            return await this.jwtSign(user)
        } catch (error) {
            throw new AuthError(
                "Refresh token is invalid or expired+.",
                401,
                ErrorCodes.TOKEN_INVALID
            )
        }
    }

    public async verify(id: string, token: string){
        const personalAcceessToken = await this.#authReposiory.verifyUser(id, token)
        if(!personalAcceessToken){
            throw new ValidationsError(
                "Invalid verification token! Kindly request a new token.",
                401,
                ErrorCodes.TOKEN_INVALID
            )
        }

        const expiry = new Date(personalAcceessToken.expiry)
        const now = new Date()
        if(expiry < now){
           throw new ValidationsError(
                "Expired verification token! Kindly request a new token.",
                401,
                ErrorCodes.TOKEN_EXPIRED
            ) 
        }
        return await this.#authReposiory.updateUser({id}, {isEmailVerified: true})
    }

    public async resendEmailVerificationToken(id: string){
        const personalAcceessToken = await this.#authReposiory.upsertVerificationToken(id)
        if(!personalAcceessToken){
            throw new ValidationsError(
                "We could not generate a new verification token at this time. Please try again in 1 hour",
                500,
                ErrorCodes.INTERNAL_ERROR
            )
        }
        // send notification
        return "We sent a new verification token to your registered email"
    }

    // public async findOneById(id: string){
    //     const user = await this.databaseService.user.findUnique({
    //         where: {
    //             id
    //         }
    //     });
    //     return user
    // }

    // // private methods
    // public async findOneByEmail(email: string){
    //      //  check if the provided email is a registered email
    //     const user = await this.databaseService.user.findFirst({
    //         where: {
    //             email
    //         }
    //     });
    //     return user
        
    // }

    // public async findAll(data: FindManyUsers){
    //     const WhereClause:any = {deletedAt: null}
    //     if(data.isEmailVerified) WhereClause.isEmailVerified = data.isEmailVerified
    //     if(data.status) WhereClause.status = data.status as $Enums.UserStatus
    //     if(data.userType) WhereClause.userType = data.userType as $Enums.UserType
    //     if(data.deleted) WhereClause.deletedAt = {not: null}
    //     // deleted
    // }

    public async update(id: string, updateDate: UpdateUserDto ){
        try {
            const user = await this.#authReposiory.updateUser({id: id}, {...updateDate})
            const {password, ...rest} = user
            return{...rest}
        } catch (error) {
            throw error
        }
    }

    

    // public async delete(id: string, deletedBy: string, deleteReason:string ){
    //     const user = await this.databaseService.user.update({
    //         data: {
    //             deletedAt: new Date(),
    //             deletedBy,
    //             deleteReason,
    //             status: $Enums.UserStatus.deleted 
    //         },
    //         where: {
    //             id
    //         }
    //     });
    //     return user
    // }

    // public async permanentdelete(id: string){
    //     const user = await this.databaseService.user.delete({
    //         where: {
    //             id
    //         }
    //     });
    //     return user
    // }





    private async userProvider (data:CreateUserDto ): Promise<any> {
        const SALT_ROUNDS = 10;
        const hashPassword = async (plainPassword: string): Promise<string> => {
            return await bcrypt.hash(plainPassword, SALT_ROUNDS);
        };
        data.password = data.password ? await hashPassword(data.password) : undefined
        try {
            
            const {user, personalaAccessTokens} = await this.#authReposiory.createUser(data)
            const {password, refreshToken, ...rest} = user
            return {...rest}
            // send notifications for verification

        } catch (error) {
            if (error instanceof AuthError) {
                throw error
            }

            throw new AuthError(
                'An unexpected error occurred while creating your account. Please try again later.',
                500,
                ErrorCodes.INTERNAL_ERROR
            )
        }
        
    }

    private checkAccount (user: Prisma.UserMinAggregateOutputType){
        if(!user){
            throw new AuthError(
                "We have no exisitng user account  with this email, kindly register to get started.",
                401,
                ErrorCodes.USER_NOT_FOUND
            )
        }else if(user.status === $Enums.UserStatus.deleted){
            throw new AuthError(
                "This account does not exist",
                401,
                ErrorCodes.ACCOUNT_RESTRICTED
            )
        }else if(user.status !== $Enums.UserStatus.active){
            throw new AuthError(
                "This account is restricted possibly from abuse or account deactivation. Contact administrators",
                401,
                ErrorCodes.ACCOUNT_RESTRICTED
            )
        }
    }

    
    private async jwtSign (user:Prisma.UserMinAggregateOutputType ){
        
        try {
            const accesstoken = jwt.sign({
                        id:user.id, 
                        email: user.email, 
                        gender: user.gender, 
                        userType: user.userType
                        }, 
                        this.#JWT_ACCESS_SECRET as string, 
                        {expiresIn: this.#JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn']})
            const refreshToken = jwt.sign({id:user.id}, this.#JWT_REFRESH_SECRET as string, {expiresIn: this.#JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn']})

            // update user with refreshtoken
            const lastLoginAt = new Date
            await this.#authReposiory.updateUser({id:user.id!}, {refreshToken, lastLoginAt})
            const {password, ...rest} = user
            return {
                ...rest,
                refreshToken,
                accesstoken
            }  
        } catch (error) {
            if (error instanceof AuthError) {
                throw error
            }
            throw new AuthError(
                'An unexpected json error occurred. Please try again later.',
                500,
                ErrorCodes.INTERNAL_ERROR
            )
        }
        
    }
}

