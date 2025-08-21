"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("../../@prisma/client");
const errorhandlers_1 = require("../utils/errorhandlers");
const enums_1 = require("../utils/enums");
const baseRepository_1 = __importDefault(require("./baseRepository"));
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
class AuthRepository extends baseRepository_1.default {
    #logHandler;
    #patientRepository;
    #adminRepository;
    #doctorRepository;
    #personAccessRepository;
    constructor(redis, logHandler, superLogHandler, model, databaseService, patientRepository, adminRepository, doctorRepository, personAccessRepository) {
        super(redis, superLogHandler, model, databaseService);
        this.#logHandler = logHandler;
        this.#patientRepository = patientRepository;
        this.#adminRepository = adminRepository;
        this.#doctorRepository = doctorRepository;
        this.#personAccessRepository = personAccessRepository;
    }
    #clientt = new client_1.PrismaClient();
    async createUser(data) {
        try {
            return await this.withTransaction(async (prisma) => {
                const newUserInput = {
                    isEmailVerified: data.isEmailVerified ?? false,
                    email: data.email,
                    password: data.password,
                    userType: data.userType,
                    status: data.userType === client_1.$Enums.UserType.patient ? client_1.$Enums.UserStatus.active : client_1.$Enums.UserStatus.restricted
                };
                const user = await super.create(newUserInput);
                switch (user.userType) {
                    case client_1.$Enums.UserType.admin:
                        const admin = {
                            user: { connect: { id: user.id } }
                        };
                        await this.#adminRepository.create(admin);
                        break;
                    case client_1.$Enums.UserType.patient:
                        const patient = {
                            user: { connect: { id: user.id } }
                        };
                        await this.#patientRepository.create(patient);
                        break;
                    case client_1.$Enums.UserType.doctor:
                        const doctor = {
                            user: { connect: { id: user.id } }
                        };
                        await this.#doctorRepository.create(doctor);
                        break;
                    default:
                        throw new errorhandlers_1.AuthError("Invalid user type provided.", 403, enums_1.ErrorCodes.MISING_DATA);
                }
                // create personal access token for user account verification
                const hexCode = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0");
                const expiry = new Date();
                expiry.setHours(expiry.getHours() + 3);
                const personalAccess = {
                    user: { connect: { id: user.id } },
                    token: hexCode,
                    type: client_1.$Enums.TokenType.verifyEmail,
                    expiry: expiry,
                };
                const personalaAccessTokens = await this.#personAccessRepository.create(personalAccess);
                return { user, personalaAccessTokens }; // Return created user
            });
        }
        catch (error) {
            this.#logHandler.alarm("AuthRepository/createUser", JSON.stringify(`failed to create user at ${Date.now()} data: ${data} due to ${error}`));
            throw error;
        }
    }
    async findOneById(id) {
        try {
            return await super.findUnique({ where: { id } });
        }
        catch (error) {
            this.#logHandler.alarm("AuthRepository/createUser", JSON.stringify(`failed to create user at ${Date.now()} data: ${id}`));
            throw new Error("Could not create user");
        }
    }
    async findOneByEmail(email) {
        try {
            const data = {
                where: {
                    email
                }
            };
            this.#logHandler.info("AuthRepository/FindOneByEmail", JSON.stringify(email));
            return await this.findUnique(data);
        }
        catch (error) {
            this.#logHandler.error("AuthRepository/FindOneByEmail", JSON.stringify(`Could not find one by email using: ${email}. ${error}`));
            throw error;
        }
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
    async updateUser(findBy, updateData) {
        try {
            const findUniqueBy = { where: { ...findBy } };
            const updateUserInput = { ...updateData };
            this.#logHandler.info("AuthRepository/updateUser", JSON.stringify({ findUniqueBy, updateUserInput }));
            return await this.update(findUniqueBy, updateUserInput);
        }
        catch (error) {
            this.#logHandler.error("AuthRepository/updateUser", JSON.stringify(`Could not update user ${findBy} with data: ${updateData}`));
            throw error;
        }
    }
    async verifyUser(id, token) {
        try {
            const findUniqueBy = {
                select: {
                    token: true,
                    userId: true,
                    expiry: true,
                    createdAt: true,
                    updatedAt: true
                },
                where: {
                    userId_type_token: {
                        userId: id,
                        token: token,
                        type: client_1.$Enums.TokenType.verifyEmail
                    }
                }
            };
            this.#logHandler.info("AuthRepository/verifyUser", JSON.stringify({ findUniqueBy }));
            return await this.#personAccessRepository.findOneByUnique(findUniqueBy);
        }
        catch (error) {
            this.#logHandler.error("AuthRepository/verifyUser", JSON.stringify(`Could not find user, token and type with id: ${id} and ${token}`));
            throw error;
        }
    }
    async upsertVerificationToken(userId) {
        try {
            return await this.withTransaction(async (prisma) => {
                // create personal access token for user account verification
                const hexCode = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0");
                const expiry = new Date();
                expiry.setHours(expiry.getHours() + 3);
                console.log({ hexCode });
                const personalAccess = {
                    select: {
                        user: true,
                        token: true,
                        type: true,
                        expiry: true,
                        createdAt: true
                    },
                    where: {
                        userId_type: {
                            userId,
                            type: client_1.$Enums.TokenType.verifyEmail
                        }
                    },
                    create: {
                        user: { connect: { id: userId } },
                        token: hexCode,
                        type: client_1.$Enums.TokenType.verifyEmail,
                        expiry: expiry,
                    },
                    update: {
                        token: hexCode,
                        expiry: expiry,
                    }
                };
                const personalaAccessTokens = await this.#personAccessRepository.upsert(personalAccess);
                return { ...personalaAccessTokens }; // Return created user
            });
        }
        catch (error) {
            this.#logHandler.alarm("AuthRepository/upsertVerificationToken", JSON.stringify(`failed to upsert user verification token  at ${Date.now()} data: ${userId} due to ${error}`));
            throw error;
        }
    }
}
exports.default = AuthRepository;
