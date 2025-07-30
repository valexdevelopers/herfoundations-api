import { PrismaClient, Prisma} from "../../@prisma/client";
import BaseRepository from "./baseRepository";
import { Doctor } from "../../@prisma/client";
import Logger from "../utils/log";
import { ICacheHandler } from "../utils/interfaces/base.interfaces";

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
 * @see DoctorModel
 */

export default class DoctorRepository extends BaseRepository<
                                            Doctor, 
                                            Prisma.DoctorCreateInput, 
                                            Prisma.DoctorFindUniqueArgs,  
                                            Prisma.DoctorUpdateInput, 
                                            Prisma.DoctorUpsertArgs>{
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

    async create (data: Prisma.DoctorCreateInput): Promise<Doctor> {
        try {
            const doctor = await super.create(data);
            return doctor
            
        } catch (error) {
            this.#logHandler.alarm("DoctorRepository/create", JSON.stringify(`failed to create doctor for a user at ${Date.now()} data: ${data}`))
            throw new Error("Could not create doctor")
        }

    }

}