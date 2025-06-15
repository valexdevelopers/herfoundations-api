import { PrismaClient, Prisma, $Enums} from "../../@prisma/client";
import {prisma} from './db'
import { OAuth2Client } from 'google-auth-library'
import {  FindManyUsers, IAuthRepository } from "../utils/interfaces/account.interface"
import { AuthError } from "../utils/errorhandlers"
import { AuthErrorCode } from "../utils/enums"
import { CreateAuthProviderDto, CreateUserDto } from "../utils/dtos/user/create-user.dto"
import { LoginUserDto } from "../utils/dtos/user/login-user.dto"
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken"
import { UserDto } from "../utils/dtos/user/user.dto"

/**
 * Repository for managing account relations.
 *
 * @remarks
 * This class extends the BaseRepository to handle database operations related to accounts.
 * It encapsulates the logic for interacting with the UserModel and integrates caching via
 * the provided ICacheHandler.
 *
 * @example
 * ```typescript
 * const cacheHandler: ICacheHandler = new SomeCacheHandler();
 * const accountRepository = new AccountRepository(prisma, cacheHandler);
 * ```
 *
 * 
 * @see UserModel
 */

export default class AuthRepository {
    private databaseService: PrismaClient
   
    constructor(
        database: PrismaClient,
        
    ){
        this.databaseService = database;
    }

     
    public async create (data: CreateUserDto) {
        
         switch (data.authProvider) {
            case 'self':
                data.password
                let existingUser = await this.findOneByEmail(data.email!)
                // if email is not unique and contains a value, throw error cos user exists already
                if (existingUser) {
                    throw new AuthError(
                        "We have an existing user with this email, kindly login to your account.",
                        409,
                        AuthErrorCode.EMAIL_ALREADY_EXISTS
                    )
                }
                let user = await this.userProvider(data)
                return user

            case 'google':
                if(!data.authToken) {
                     throw new AuthError(
                        "Auth token cant be empty when using google to register.",
                        400,
                        AuthErrorCode.MISING_DATA
                    )
                }

                const googleUser = await this.googleAuthProvider(data.authToken!)
                if(!googleUser) {
                     throw new AuthError(
                        "Google could not verify your account",
                        401,
                        AuthErrorCode.GOOGLE_AUTH_FAILED
                    )
                }

                data.email = googleUser.email
                data.isEmailVerified = googleUser.email_verified
                existingUser = await this.findOneByEmail(data.email!)
                if(existingUser){
                    // find auth provider by userid and provider
                    const existingAuthUser = await this.databaseService.authProvider.findUnique(
                                                            {
                                                                where: {
                                                                    userId_provider: {
                                                                    userId: existingUser.id,
                                                                    provider: data.authProvider,
                                                                    },
                                                                }
                                                            }
                                                        )
                    if(existingAuthUser){
                       throw new AuthError(
                            "We have an existing user with this email, kindly login to your account.",
                            409,
                            AuthErrorCode.EMAIL_ALREADY_EXISTS
                        ) 
                    }else{
                        const authProviderData = {userId: existingUser.id, provider: data.authProvider, providerUserId: googleUser.providerUserId!}
                        await this.connectUser(authProviderData)
                    }
                    return existingUser
                }else{
                    user = await this.userProvider(data)
                    const authProviderData = {userId: user.user.id, provider: data.authProvider, providerUserId: googleUser.providerUserId!}

                    await this.connectUser(authProviderData)
                    return user
                }
                
               
            default:
                break;
        }
        
    }
  
    public async login (data: LoginUserDto){
        switch (data.authProvider) {
            case "self":
                let user = await this.findOneByEmail(data.email!)
                if(!user){
                   throw new AuthError(
                        "We couldn't find an existing user account with this email.",
                        404,
                        AuthErrorCode.USER_NOT_FOUND
                    ) 
                }
                const isPasswordCorrect = await bcrypt.compare(data.password!, user.password!)
                if(!isPasswordCorrect){
                    throw new AuthError(
                        "Authentication error. invalid credentials provided",
                        404,
                        AuthErrorCode.AUTH_FAILED
                    ) 
                }
                return await this.jwtSign(user)

            case "google":
                const googleUser = await this.googleAuthProvider(data.authToken!)
                if(!googleUser) {
                     throw new AuthError(
                        "Google could not verify your account",
                        401,
                        AuthErrorCode.GOOGLE_AUTH_FAILED
                    )
                }
                user = await this.findOneByEmail(googleUser.email!)
                if(!user){
                   throw new AuthError(
                        "We couldn't find an existing user account with this email, kindle register an account.",
                        404,
                        AuthErrorCode.USER_NOT_FOUND
                    ) 
                }
                this.checkAccount(user)
                // if user is valid, check if this authprovider has been registered for this user
                // manual find or create
                try {
                    await this.databaseService.$transaction(async (prisma) => {
                        let authProvider = prisma.authProvider.findUnique({
                            where: {userId_provider:{
                                userId: user.id,
                                provider: "google"
                            }}
                        })

                        const authProviderInput:CreateAuthProviderDto = {
                            userId:user.id,
                            provider: "google",
                            providerUserId: googleUser.providerUserId as string
                        }

                        authProvider =  authProvider ?? this.connectUser(authProviderInput)
                    })
                } catch (error) {
                    throw new AuthError(
                        "Sever error! sorry we could not log you in due to some unexpected error. Kindly try again.",
                        500,
                        AuthErrorCode.INTERNAL_ERROR
                    ) 
                }
                return await this.jwtSign(user)
            default:
                throw new AuthError(
                    "Unknowns authentication route detected. All associated accounts would be penalised",
                    404,
                    AuthErrorCode.MISING_DATA
                ) 
                
        }

    }

    public async findOneById(id: string){
        const user = await this.databaseService.user.findUnique({
            where: {
                id
            }
        });
        return user
    }

    // private methods
    public async findOneByEmail(email: string){
         //  check if the provided email is a registered email
        const user = await this.databaseService.user.findFirst({
            where: {
                email
            }
        });
        return user
        
    }

    public async findAll(data: FindManyUsers){
        const WhereClause:any = {deletedAt: null}
        if(data.isEmailVerified) WhereClause.isEmailVerified = data.isEmailVerified
        if(data.status) WhereClause.status = data.status as $Enums.UserStatus
        if(data.userType) WhereClause.userType = data.userType as $Enums.UserType
        if(data.deleted) WhereClause.deletedAt = {not: null}
        // deleted
    }

    // public async update(id: string, updateDate: ){

    // }

    public async delete(id: string, deletedBy: string, deleteReason:string ){
        const user = await this.databaseService.user.update({
            data: {
                deletedAt: new Date(),
                deletedBy,
                deleteReason,
                status: $Enums.UserStatus.deleted 
            },
            where: {
                id
            }
        });
        return user
    }

    public async permanentdelete(id: string){
        const user = await this.databaseService.user.delete({
            where: {
                id
            }
        });
        return user
    }

    private async connectUser  (data: CreateAuthProviderDto) {
        const authProviderInput: Prisma.AuthProviderCreateInput = {
            user: {
                connect: { id: data.userId },
            },
            provider: data.provider as $Enums.AuthenticationProviders,
            providerUserId: data.providerUserId!,
        };

        await this.databaseService.authProvider.create({ data: authProviderInput });
    };


    private async googleAuthProvider(idToken: string) {
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        })
        const payload = ticket.getPayload()


        return {
            email: payload?.email,
            providerUserId: payload?.sub,
            email_verified: payload?.email_verified,
        }
    }

    private async userProvider (data:CreateUserDto ) {
        const SALT_ROUNDS = 10;
        const hashPassword = async (plainPassword: string): Promise<string> => {
            return await bcrypt.hash(plainPassword, SALT_ROUNDS);
        };
        data.password = data.password ? await hashPassword(data.password) : undefined
        try {
            
                const newUserInput: Prisma.UserCreateInput = {
                isEmailVerified: data.isEmailVerified ?? false,
                email: data.email!,
                password: data.password,
                userType: data. userType  as $Enums.UserType,
                status: data.userType === $Enums.UserType.patient ? $Enums.UserStatus.active: $Enums.UserStatus.restricted 
            }


            // Start a transaction - for an all or fail process of creating a user
            const account = await this.databaseService.$transaction(async (prisma) => {

                // Create the user
                const user = await prisma['user'].create({data: newUserInput});

                // Create the related entity based on user type
                switch (user.userType) {
                    case $Enums.UserType.admin:
                        await prisma.admin.create({
                            data: {
                                id: user.id,
                            }
                        });
                        break;
                    case $Enums.UserType.patient:
                        await prisma.patient.create({
                            data: {
                                id: user.id
                            }
                        });
                        break;
                    case $Enums.UserType.doctor:
                        await prisma.doctor.create({
                            data: {
                                id: user.id,
                            }
                        });
                        break;
                    
                    default:
                        throw new AuthError(
                            "Invalid user type provided.",
                            403,
                            AuthErrorCode.MISING_DATA
                        )
                }

                // create personal access token for user account verification
                const hexCode = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0");
                const expiry = new Date();
                expiry.setHours(expiry.getHours() + 3);

                const personalaAccessTokens = await prisma.personalAccessToken.create({
                    data: {
                        user: { connect: { id: user.id } },
                        token: hexCode,
                        type: $Enums.TokenType.verifyEmail,
                        expiry: expiry,
                    }
                });

                return { user, personalaAccessTokens }; // Return created user
            });

        
            return account;

        } catch (error) {
            if (error instanceof AuthError) {
                throw error
            }

            throw new AuthError(
                'An unexpected error occurred while creating your account. Please try again later.',
                500,
                AuthErrorCode.INTERNAL_ERROR
            )
        }
        
    }

    private checkAccount (user: Prisma.UserMinAggregateOutputType){
        if(!user){
            throw new AuthError(
                "We have no exisitng user account  with this email, kindly register to get started.",
                401,
                AuthErrorCode.USER_NOT_FOUND
            )
        }else if(user.status === $Enums.UserStatus.deleted){
            throw new AuthError(
                "This account does not exist",
                401,
                AuthErrorCode.ACCOUNT_RESTRICTED
            )
        }else if(user.status !== $Enums.UserStatus.active){
            throw new AuthError(
                "This account is restricted possibly from abuse or account deactivation. Contact administrators",
                401,
                AuthErrorCode.ACCOUNT_RESTRICTED
            )
        }
    }

    private async jwtSign (user:Prisma.UserMinAggregateOutputType ){
        const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET 
        const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET
        const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '1h'
        const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d'

        try {
            const accesstoken = jwt.sign({
                        id:user.id, 
                        email: user.email, 
                        gender: user.gender, 
                        userType: user.userType
                    }, JWT_ACCESS_SECRET as string, {expiresIn: JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn']})
            const refreshToken = jwt.sign({id:user.id}, JWT_REFRESH_SECRET as string, {expiresIn: JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn']})

            // update user with refreshtoken
            await this.databaseService.user.update({data: {refreshToken}, where: {id: user.id as string}} )
            return {
                user,
                refreshToken,
                accesstoken
            }  
        } catch (error) {
            throw new AuthError(
                'An unexpected json error occurred. Please try again later.',
                500,
                AuthErrorCode.INTERNAL_ERROR
            )
        }
        
    }
}
