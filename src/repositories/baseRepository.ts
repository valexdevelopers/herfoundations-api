import Logger from "../utils/log";
import { ICacheHandler } from "../utils/interfaces/base.interfaces";
import { Prisma, PrismaClient } from "@prisma/client";

export default abstract class BaseRepository<M> {

    /** 
    * Base Repository
    *
    * @summary
    * This repository acts as the foundation for all repositories. 
    * It must be extended by all other repositories
    * Handles core logic such as:
    * - DB queries
    * - caching
    * - Logging
    * - Retry Logic for trasient errors
    * 
    * @remarks
    * This repository is tightly coupled with the prisma API, what this means is, prisma is the only orm 
    * this application uses. You can switch databases but not the ORM-Prisma.
    * It might look like its loosely coupled with prisma, however unless theres another ORM that uses the prisma API style,
    * in reality, its tightly coupled. Regardless of the fact that I am injecting prisma as a dependency
    * One question is why inject it then? I am injecting everything else, and maybe in the future another ORM uses prisma API style 
    * 
    * @param cacheHandler - The cache Handler that implemets redis.
    * @param logHandler - Logger instance for output.
    * @param model - The Prisma model delegate to operate on.
    * 
    * 
    * 
    */

    #MAX_ATTEMPTS = Number(process.env.MAX_ATTEMPTS) || 3
    #RETRY_DELAY = Number(process.env.RETRY_DELAY) || 100;
    #CACHE_MODE = Boolean(Number(process.env.CACHE_MODE)) || false
    #TTL= Number(process.env.TTL) || 3600
    #cacheHandler: ICacheHandler
    #logHandler: Logger
    #model: M
    #databaseService: PrismaClient
    constructor(
        redis: ICacheHandler,
        logHandler: Logger,
        model:M,
        databaseService: PrismaClient
    ){
        this.#cacheHandler = redis
        this.#logHandler = logHandler
        this.#model = model
        this.#databaseService = databaseService
    }
 
    async #withRetry<T>(fn: () => Promise<T>, attempts=1): Promise<T>{
        try {
            return await fn()
        }catch(error: any){
            if(attempts >= this.#MAX_ATTEMPTS || !this.#isTransientError(error)){
                console.error(error)
                throw error
            }

            // exponential backoff for delay with every retry
            const Delay = this.#RETRY_DELAY * 2 ** attempts
            this.#logHandler.warn(`Retrying operation (Attempt ${attempts + 1}) in ${Delay}ms...`, 'withRetry');
            await new Promise((resolve) => {
                setTimeout(resolve, Delay)
            })

            return await this.#withRetry(fn, attempts + 1)
        }
    }

    /**
     * 
     * @param error 
     * @returns boolean
     */
    #isTransientError(error: (Error & {code?: string}) | null): boolean{
        const TRANSIENT_ERROR_CODES = [
            'ECONNRESET',
            'ETIMEDOUT',
            'ECONNREFUSED',
            'EAI_AGAIN',
            'ENOTFOUND'
        ];

        if (!error) return false;

        return TRANSIENT_ERROR_CODES.includes(error.code || '')
    }

    
}
