
import { PrismaClient, Prisma, $Enums } from "../../prisma/generated/client"
import {prisma} from './db'
import { OAuth2Client } from 'google-auth-library'
import {  IAuthRepository } from "../utils/interfaces/account.interface"
import { AuthError } from "../utils/errorhandlers"
import { AuthErrorCode } from "../utils/enums"
import { CreateAuthProviderDto, CreateUserDto } from "../utils/dtos/user/create-user.dto"
import { LoginUserDto } from "../utils/dtos/user/login-user.dto"
import bcrypt from 'bcrypt';

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

class AuthRepository {
    private databaseService: PrismaClient
    constructor(
        database: PrismaClient
    ){
        this.databaseService = database
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
                // check password
                


                await bcrypt.compare(data.password!, user.password!)
                break;
        
            default:
                break;
        }
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
                const user = await prisma.user.create({data: newUserInput});

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

    private checkAccount (user: {} | undefined){
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
}

const authrepository: IAuthRepository = new AuthRepository(prisma)
export default  authrepository 