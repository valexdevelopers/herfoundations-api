"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonalAccessRepository = exports.AuthProviderRepository = void 0;
const google_auth_library_1 = require("google-auth-library");
const baseRepository_1 = __importDefault(require("./baseRepository"));
const errorhandlers_1 = require("../utils/errorhandlers");
const enums_1 = require("../utils/enums");
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
class AuthProviderRepository extends baseRepository_1.default {
    #logHandler;
    constructor(redis, logHandler, superLogHandler, model, databaseService) {
        super(redis, superLogHandler, model, databaseService);
        this.#logHandler = logHandler;
    }
    async connectUser(createAuthProviderDto) {
        try {
            return await this.withTransaction(async (prisma) => {
                const data = {
                    where: {
                        userId_provider: {
                            userId: createAuthProviderDto.userId,
                            provider: createAuthProviderDto.provider,
                        }
                    }
                };
                let existingAuthUser = await this.findUnique(data);
                if (!existingAuthUser) {
                    const authProviderData = {
                        user: { connect: { id: createAuthProviderDto.userId } },
                        provider: createAuthProviderDto.provider,
                        providerUserId: createAuthProviderDto.providerUserId
                    };
                    existingAuthUser = await super.create(authProviderData);
                }
                return existingAuthUser;
            });
        }
        catch (error) {
            throw new errorhandlers_1.AuthError("Sever error! An unexpected error occurred with third party authentication.", 500, enums_1.ErrorCodes.AUTH_FAILED);
        }
    }
    async findOneByIdProvider(userId, provider) {
        const data = {
            where: {
                userId_provider: {
                    userId,
                    provider,
                },
            }
        };
        return await this.findUnique(data);
    }
    async findAll(data) {
        const WhereClause = { deletedAt: null };
        if (data.isEmailVerified)
            WhereClause.isEmailVerified = data.isEmailVerified;
        if (data.status)
            WhereClause.status = data.status;
        if (data.userType)
            WhereClause.userType = data.userType;
        if (data.deleted)
            WhereClause.deletedAt = { not: null };
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
    async googleAuthProvider(idToken) {
        const client = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        return {
            email: payload?.email,
            providerUserId: payload?.sub,
            email_verified: payload?.email_verified,
        };
    }
}
exports.AuthProviderRepository = AuthProviderRepository;
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
class PersonalAccessRepository extends baseRepository_1.default {
    #logHandler;
    constructor(redis, logHandler, superLogHandler, model, databaseService) {
        super(redis, superLogHandler, model, databaseService);
        this.#logHandler = logHandler;
    }
    async create(data) {
        try {
            return await super.create(data);
        }
        catch (error) {
            this.#logHandler.alarm("PatientRepository/create", JSON.stringify(`failed to create patient for a user at ${Date.now()} data: ${data}`));
            throw new Error("Could not create patient");
        }
    }
    async findOneByUnique(data) {
        try {
            return await super.findUnique(data);
        }
        catch (error) {
            this.#logHandler.alarm("PatientRepository/findOneByUnique", JSON.stringify(`failed to find findOneByUnique for a user at ${Date.now()} data: ${data}`));
            throw new Error("Could not create fpersonal Access token ");
        }
    }
    async upsert(data) {
        try {
            return await super.upsert(data);
        }
        catch (error) {
            this.#logHandler.alarm("PatientRepository/upsert", JSON.stringify(`failed to upsert user at ${Date.now()} data: ${data} due to ${error}`));
            throw error;
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
    async googleAuthProvider(idToken) {
        const client = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        return {
            email: payload?.email,
            providerUserId: payload?.sub,
            email_verified: payload?.email_verified,
        };
    }
}
exports.PersonalAccessRepository = PersonalAccessRepository;
