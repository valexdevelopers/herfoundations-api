import { PrismaClient, Prisma, Patient} from "../../@prisma/client";
import BaseRepository from "./baseRepository";
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
 * @see PatientModel
 */

export default class PatientRepository extends BaseRepository<Patient, Prisma.PatientCreateInput, Prisma.PatientFindUniqueArgs>{
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

    async create (data: Prisma.PatientCreateInput): Promise<Patient> {

        try {
            const patient = await super.create(data);
            return patient
        } catch (error) {
            this.#logHandler.alarm("PatientRepository/create", JSON.stringify(`failed to create patient for a user at ${Date.now()} data: ${data}`))
            throw new Error("Could not create patient")
        }    
    }

}
