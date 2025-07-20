import { PrismaClient, Prisma, $Enums, PersonalAccessToken} from "../../@prisma/client";
import { FindManyUsers, FindUniqueUser, IAdminRepository, IAuthRepository, IDoctorRepository, IPatientRepository, IPersonalAccessRepository } from "../utils/interfaces/account.interface"
import { AuthError } from "../utils/errorhandlers"
import { AuthErrorCode } from "../utils/enums"
import { CreateUserDto } from "../utils/dtos/user/create-user.dto"
import BaseRepository from "./baseRepository";
import { User } from "../../@prisma/client";
import Logger from "../utils/log";
import { ICacheHandler } from "../utils/interfaces/base.interfaces";
import { UpdateUserDto } from "../utils/dtos/user/update-user.dto";
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

export default class AuthRepository extends BaseRepository<User, Prisma.UserCreateInput, Prisma.UserFindUniqueArgs, Prisma.UserUpdateInput>{
    #logHandler: Logger
    #patientRepository: IPatientRepository
    #adminRepository: IAdminRepository
    #doctorRepository: IDoctorRepository
    #personAccessRepository: IPersonalAccessRepository

    constructor(
        redis: ICacheHandler,
        logHandler: Logger,
        superLogHandler: Logger,
        model: string,
        databaseService: PrismaClient,
        patientRepository: IPatientRepository,
        adminRepository: IAdminRepository,
        doctorRepository: IDoctorRepository,
        personAccessRepository: IPersonalAccessRepository
    ) {
        super(redis, superLogHandler, model, databaseService);
        this.#logHandler = logHandler;
        this.#patientRepository = patientRepository;
        this.#adminRepository = adminRepository;
        this.#doctorRepository = doctorRepository;
        this.#personAccessRepository = personAccessRepository;
    }
    #clientt = new PrismaClient()
    async createUser (data: CreateUserDto): Promise<{ user: User, personalaAccessTokens: PersonalAccessToken }> {
        try {
            return await this.withTransaction(async (prisma) => {
                const newUserInput: Prisma.UserCreateInput = {
                    isEmailVerified: data.isEmailVerified ?? false,
                    email: data.email!,
                    password: data.password,
                    userType: data. userType  as $Enums.UserType,
                    status: data.userType === $Enums.UserType.patient ? $Enums.UserStatus.active : $Enums.UserStatus.restricted 
                }
                const user = await super.create(newUserInput);

                switch (user.userType) {
                    case $Enums.UserType.admin:
                        const admin: Prisma.AdminCreateInput = {
                            user: {connect: {id: user.id}}
                        }
                        await this.#adminRepository.create(admin);
                        break;
                    case $Enums.UserType.patient:
                        const patient: Prisma.PatientCreateInput = {
                            user: {connect: {id: user.id}}
                        }
                        await this.#patientRepository.create(patient);
                        break;
                    case $Enums.UserType.doctor:
                        const doctor: Prisma.DoctorCreateInput = {
                            user: {connect: {id: user.id}}
                        }
                        await this.#doctorRepository.create(doctor);
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
                
                const personalAccess: Prisma.PersonalAccessTokenCreateInput = {
                    user: { connect: { id: user.id } },
                    token: hexCode,
                    type: $Enums.TokenType.verifyEmail,
                    expiry: expiry,
                }
                const personalaAccessTokens = await this.#personAccessRepository.create(personalAccess);

                return { user, personalaAccessTokens }; // Return created user
            });
            
            
        } catch (error) {
            this.#logHandler.alarm("AuthRepository/createUser", JSON.stringify(`failed to create user at ${Date.now()} data: ${data}`))
            throw new Error("Could not create user")
        }
        
        
    }

    public async findOneById(id: string){
        try {
            return await super.findUnique({where: {id}});

        } catch (error) {
            this.#logHandler.alarm("AuthRepository/createUser", JSON.stringify(`failed to create user at ${Date.now()} data: ${id}`))
            throw new Error("Could not create user")
        }
        
    }


    async findOneByEmail(email: string){
        try {
            const data: Prisma.UserFindUniqueArgs = {
                where: {
                    email
                }
            }
            this.#logHandler.info("AuthRepository/FindOneByEmail", JSON.stringify(email))
            return await this.findUnique(data);
        } catch (error) {
            this.#logHandler.error("AuthRepository/FindOneByEmail", JSON.stringify(`Could not find one by email using: ${email}. ${error}`))
            throw error
        } 
    }

    public async findAll(data: FindManyUsers){
        const WhereClause:any = {deletedAt: null}
        if(data.isEmailVerified) WhereClause.isEmailVerified = data.isEmailVerified
        if(data.status) WhereClause.status = data.status as $Enums.UserStatus
        if(data.userType) WhereClause.userType = data.userType as $Enums.UserType
        if(data.deleted) WhereClause.deletedAt = {not: null}
        // deleted
    }

    async updateUser(findBy: FindUniqueUser, updateData: UpdateUserDto ){
        try {
            
            const findUniqueBy: Prisma.UserFindUniqueArgs = {where: {...findBy}}
            const updateUserInput: Prisma.UserUpdateInput = {...updateData}
            this.#logHandler.info("AuthRepository/updateUser", JSON.stringify({findUniqueBy, updateUserInput}))
            return await this.update(findUniqueBy, updateUserInput);

        } catch (error) {
            this.#logHandler.error("AuthRepository/updateUser", JSON.stringify(`Could not update user ${findBy} with data: ${updateData}`))
            throw error
        } 
    }

    // public async delete(id: string, deletedBy: string, deleteReason:string ){
    //     const user = await this.#clientt['user'].update({
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

    // private async connectUser  (data: CreateAuthProviderDto) {
    //     const authProviderInput: Prisma.AuthProviderCreateInput = {
    //         user: {
    //             connect: { id: data.userId },
    //         },
    //         provider: data.provider as $Enums.AuthenticationProviders,
    //         providerUserId: data.providerUserId!,
    //     };

    //     await this.databaseService.authProvider.create({ data: authProviderInput });
    // };


    // private async googleAuthProvider(idToken: string) {
    //     const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
    //     const ticket = await client.verifyIdToken({
    //         idToken,
    //         audience: process.env.GOOGLE_CLIENT_ID,
    //     })
    //     const payload = ticket.getPayload()


    //     return {
    //         email: payload?.email,
    //         providerUserId: payload?.sub,
    //         email_verified: payload?.email_verified,
    //     }
    // }

    // async userProvider (data:CreateUserDto ) {
    //     const SALT_ROUNDS = 10;
    //     const hashPassword = async (plainPassword: string): Promise<string> => {
    //         return await bcrypt.hash(plainPassword, SALT_ROUNDS);
    //     };
    //     data.password = data.password ? await hashPassword(data.password) : undefined
    //     try {
            
    //             const newUserInput: Prisma.UserCreateInput = {
    //             isEmailVerified: data.isEmailVerified ?? false,
    //             email: data.email!,
    //             password: data.password,
    //             userType: data. userType  as $Enums.UserType,
    //             status: data.userType === $Enums.UserType.patient ? $Enums.UserStatus.active: $Enums.UserStatus.restricted 
    //         }


    //         // Start a transaction - for an all or fail process of creating a user
    //         const account = await this.databaseService.$transaction(async (prisma) => {

    //             // Create the user
    //             const user = await prisma['user'].create({data: newUserInput});

    //             // Create the related entity based on user type
    //             switch (user.userType) {
    //                 case $Enums.UserType.admin:
    //                     await prisma.admin.create({
    //                         data: {
    //                             id: user.id,
    //                         }
    //                     });
    //                     break;
    //                 case $Enums.UserType.patient:
    //                     await prisma.patient.create({
    //                         data: {
    //                             id: user.id
    //                         }
    //                     });
    //                     break;
    //                 case $Enums.UserType.doctor:
    //                     await prisma.doctor.create({
    //                         data: {
    //                             id: user.id,
    //                         }
    //                     });
    //                     break;
                    
    //                 default:
    //                     throw new AuthError(
    //                         "Invalid user type provided.",
    //                         403,
    //                         AuthErrorCode.MISING_DATA
    //                     )
    //             }

    //             // create personal access token for user account verification
    //             const hexCode = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0");
    //             const expiry = new Date();
    //             expiry.setHours(expiry.getHours() + 3);

    //             const personalaAccessTokens = await prisma.personalAccessToken.create({
    //                 data: {
    //                     user: { connect: { id: user.id } },
    //                     token: hexCode,
    //                     type: $Enums.TokenType.verifyEmail,
    //                     expiry: expiry,
    //                 }
    //             });

    //             return { user, personalaAccessTokens }; // Return created user
    //         });

        
    //         return account;

    //     } catch (error) {
    //         if (error instanceof AuthError) {
    //             throw error
    //         }

    //         throw new AuthError(
    //             'An unexpected error occurred while creating your account. Please try again later.',
    //             500,
    //             AuthErrorCode.INTERNAL_ERROR
    //         )
    //     }
        
    // }

    // private checkAccount (user: Prisma.UserMinAggregateOutputType){
    //     if(!user){
    //         throw new AuthError(
    //             "We have no exisitng user account  with this email, kindly register to get started.",
    //             401,
    //             AuthErrorCode.USER_NOT_FOUND
    //         )
    //     }else if(user.status === $Enums.UserStatus.deleted){
    //         throw new AuthError(
    //             "This account does not exist",
    //             401,
    //             AuthErrorCode.ACCOUNT_RESTRICTED
    //         )
    //     }else if(user.status !== $Enums.UserStatus.active){
    //         throw new AuthError(
    //             "This account is restricted possibly from abuse or account deactivation. Contact administrators",
    //             401,
    //             AuthErrorCode.ACCOUNT_RESTRICTED
    //         )
    //     }
    // }

    // private async jwtSign (user:Prisma.UserMinAggregateOutputType ){
    //     const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET 
    //     const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET
    //     const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '1h'
    //     const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d'

    //     try {
    //         const accesstoken = jwt.sign({
    //                     id:user.id, 
    //                     email: user.email, 
    //                     gender: user.gender, 
    //                     userType: user.userType
    //                 }, JWT_ACCESS_SECRET as string, {expiresIn: JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn']})
    //         const refreshToken = jwt.sign({id:user.id}, JWT_REFRESH_SECRET as string, {expiresIn: JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn']})

    //         // update user with refreshtoken
    //         await this.databaseService.user.update({data: {refreshToken}, where: {id: user.id as string}} )
    //         return {
    //             user,
    //             refreshToken,
    //             accesstoken
    //         }  
    //     } catch (error) {
    //         throw new AuthError(
    //             'An unexpected json error occurred. Please try again later.',
    //             500,
    //             AuthErrorCode.INTERNAL_ERROR
    //         )
    //     }
        
    // }
}
