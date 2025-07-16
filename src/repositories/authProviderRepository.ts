import {Prisma, $Enums, PersonalAccessToken, PrismaClient} from "../../@prisma/client";
import { OAuth2Client } from 'google-auth-library'
import {  FindManyUsers } from "../utils/interfaces/account.interface"
import { CreateAuthProviderDto } from "../utils/dtos/user/create-user.dto"
import BaseRepository from "./baseRepository";
import { AuthProvider } from "../../@prisma/client";
import Logger from "../utils/log";
import { ICacheHandler } from "../utils/interfaces/base.interfaces";
import { AuthError } from "../utils/errorhandlers";
import { AuthErrorCode } from "../utils/enums";

/**
 * Repository for managing authProvider relations.
 *
 * @remarks
 * This class extends the BaseRepository to handle database operations related to accounts.
 * It encapsulates the logic for interacting with the AuthProviderModel and integrates caching via
 * the provided ICacheHandler.
 *
 * @example
 * ```typescript
 * const cacheHandler: ICacheHandler = new SomeCacheHandler();
 * const accountRepository = new AccountRepository(prisma, cacheHandler);
 * ```
 *
 * 
 * @see AuthProvider
 */

export class AuthProviderRepository extends BaseRepository<AuthProvider, Prisma.AuthProviderCreateInput, Prisma.AuthProviderFindUniqueArgs, Prisma.AuthProviderUpdateInput>{
     #logHandler: Logger
 
     constructor(
         redis: ICacheHandler,
         logHandler: Logger,
         superLogHandler: Logger,
         model: string,
         databaseService: PrismaClient
     ) {
         super(redis, superLogHandler, model, databaseService);
         this.#logHandler = logHandler;
     }

    async connectUser (createAuthProviderDto: CreateAuthProviderDto): Promise<AuthProvider> {
        try {
            return await this.withTransaction(async (prisma) => {
                const data: Prisma.AuthProviderFindUniqueArgs ={
                    where: {
                        userId_provider: {
                        userId: createAuthProviderDto.userId,
                        provider: createAuthProviderDto.provider as $Enums.AuthenticationProviders,
                        }
                    }                                                       
                }
                let existingAuthUser = await this.findUnique(data);
                if(!existingAuthUser){
                    const authProviderData = {
                        user: {connect: {id: createAuthProviderDto.userId}} , 
                        provider: createAuthProviderDto.provider as $Enums.AuthenticationProviders, 
                        providerUserId: createAuthProviderDto.providerUserId!}
                    existingAuthUser = await super.create(authProviderData)
                }

                return existingAuthUser
            })
        } catch (error) {
            throw new AuthError(
                "Sever error! An unexpected error occurred with third party authentication.",
                500,
                AuthErrorCode.AUTH_FAILED
            ) 
        }
    }

    public async findOneByIdProvider(userId: string, provider: $Enums.AuthenticationProviders){
        const data: Prisma.AuthProviderFindUniqueArgs ={
            where: {
                    userId_provider: {
                    userId,
                    provider,
                    },
                }
                                                            
        }
        return await this.findUnique(data);
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

    // public async delete(id: string, deletedBy: string, deleteReason:string ){
    //     const user = await this.delete({
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


    async googleAuthProvider(idToken: string) {
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

}



/**
 * Repository for managing authProvider relations.
 *
 * @remarks
 * This class extends the BaseRepository to handle database operations related to accounts.
 * It encapsulates the logic for interacting with the AuthProviderModel and integrates caching via
 * the provided ICacheHandler.
 *
 * @example
 * ```typescript
 * const cacheHandler: ICacheHandler = new SomeCacheHandler();
 * const accountRepository = new AccountRepository(prisma, cacheHandler);
 * ```
 *
 * 
 * @see AuthProvider
 */

export class PersonalAccessRepository extends BaseRepository<PersonalAccessToken, Prisma.PersonalAccessTokenCreateInput, Prisma.PersonalAccessTokenFindUniqueArgs, Prisma.PersonalAccessTokenUpdateInput>{
     #logHandler: Logger
 
     constructor(
         redis: ICacheHandler,
         logHandler: Logger,
         superLogHandler: Logger,
         model: string,
         databaseService: PrismaClient
     ) {
         super(redis, superLogHandler, model, databaseService);
         this.#logHandler = logHandler;
     }
    async create (data: Prisma.PersonalAccessTokenCreateInput): Promise<PersonalAccessToken> {
        try {
            return await super.create(data );  

        } catch (error) {
             this.#logHandler.alarm("PatientRepository/create", JSON.stringify(`failed to create patient for a user at ${Date.now()} data: ${data}`))
            throw new Error("Could not create patient")
        }

    }
  
    // public async findOneByIdProvider(userId: string, provider: $Enums.AuthenticationProviders){
    //     const data: Prisma.AuthProviderFindUniqueArgs ={
    //         where: {
    //                 userId_provider: {
    //                 userId,
    //                 provider,
    //                 },
    //             }
                                                            
    //     }
    //     return await this.findUnique(data);
    // }

   
    // public async findAll(data: FindManyUsers){
    //     const WhereClause:any = {deletedAt: null}
    //     if(data.isEmailVerified) WhereClause.isEmailVerified = data.isEmailVerified
    //     if(data.status) WhereClause.status = data.status as $Enums.UserStatus
    //     if(data.userType) WhereClause.userType = data.userType as $Enums.UserType
    //     if(data.deleted) WhereClause.deletedAt = {not: null}
    //     // deleted
    // }

    // public async update(id: string, updateDate: ){

    // }

    // public async delete(id: string, deletedBy: string, deleteReason:string ){
    //     const user = await this.delete({
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


    async googleAuthProvider(idToken: string) {
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

}