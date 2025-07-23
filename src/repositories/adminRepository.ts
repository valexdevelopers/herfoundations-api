import { PrismaClient, Prisma, Admin} from "../../@prisma/client";
import BaseRepository from "./baseRepository";
import Logger from "../utils/log";
import { ICacheHandler } from "../utils/interfaces/base.interfaces";

/**
 * Repository for managing account relations.
 *
 * @remarks
 * This class extends the AdminRepository to handle database operations related to accounts.
 * It encapsulates the logic for interacting with the AdminModel and integrates caching via
 * the provided ICacheHandler.
 *
 * @example
 * ```typescript
 * const cacheHandler: ICacheHandler = new SomeCacheHandler();
 * const accountRepository = new AccountRepository(prisma, cacheHandler);
 * ```
 *
 * 
 * @see AdminModel
 */

export default class AdminRepository extends BaseRepository<Admin, Prisma.AdminCreateInput, Prisma.AdminFindUniqueArgs, Prisma.AdminUpdateInput>{
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

    async create (data: Prisma.AdminCreateInput): Promise<Admin> {

        try {
            const admin = await super.create(data);
            return admin
        } catch (error) {
            this.#logHandler.alarm("AdminRepository/create", JSON.stringify(`failed to create admin for a user at ${Date.now()} data: ${data}`))
            throw new Error("Could not create admin")
        }    
    }

}
