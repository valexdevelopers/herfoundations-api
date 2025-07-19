import Logger from "../utils/log";
import { ICacheHandler } from "../utils/interfaces/base.interfaces";
import { Prisma, PrismaClient } from "@prisma/client";

export default abstract class BaseRepository<M, T, W, U> {

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
    * @param model<M> - The Prisma model delegate to operate on.
    * @param T - Prisma.ModelCreateInputType
    * @param U - Prisma.ModelUpdateInputType
    * @param W - Prisma.UserFindUniqueArgsType
    * 
    * 
    */

    #MAX_ATTEMPTS = Number(process.env.MAX_ATTEMPTS) || 3
    #RETRY_DELAY = Number(process.env.RETRY_DELAY) || 100;
    #CACHE_MODE = Boolean(Number(process.env.CACHE_MODE)) || false
    #TTL= Number(process.env.TTL) || 3600
    #cacheHandler: ICacheHandler
    #logHandler: Logger
    #model: string
    #databaseService: PrismaClient
    constructor(
        redis: ICacheHandler,
        logHandler: Logger,
        model:string,
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

    public generateCacheKey(prefix: string, id: string){
        return `${prefix}:${id}`
    }

    public async setCache(key: string, value: any, ttl=this.#TTL): Promise<void> {
        if(!this.#CACHE_MODE) return
        await this.#withRetry(async () => {
            await this.#cacheHandler.set(key, value, "EX", ttl)
        }).catch(()=> {})
        
    }

    public async getCache<R>(key: string):Promise<R | null>{
        if(!this.#CACHE_MODE) return null

        return await this.#withRetry(async () => {
            const cachedResult = await this.#cacheHandler.get(key);
            return cachedResult as R
        }).catch(():Promise<R | null> => Promise.resolve(null))
    }

    public async invalidateCache(key: string):Promise<void>{
        if(!this.#CACHE_MODE) return
        return await this.#withRetry(async () => {
            await this.#cacheHandler.del(key)
        }).catch(() => {})
    }

    /**
     *  creates new row in the database
     * 
     * @param {Partial<M>} data - the data is takes to create a new record
     * 
     * @returns {Promise<M>} - the newly created record
     * 
     */
    async create(data: T): Promise<M>{
        try {
            console.log({data})
            return await this.#withRetry( async () => {
                return await this.#databaseService[this.#model].create({data})
            })
             
        } catch (error) {
            throw error
        }

    }


    /**
     *  creates new row in the database
     * 
     * @param {any} data - the data is takes to create a new record
     * 
     * @returns {Promise<M>} - the newly created record
     * 
     */
    async findUnique(data: W): Promise<M>{
        try {
            return await this.#withRetry( async () => {
                return await this.#databaseService[this.#model].findUnique(data)
            })
             
        } catch (error) {
            throw error
        }

    }
    
    async update(findBy:W, data: U){
        try {
            return await this.#withRetry(async () => {
                return await this.#databaseService[this.#model].update({
                    ...findBy,
                    data
                })
            })
            
        } catch (error) {
            throw error
        }
    }


    public async createMany(){}

    public async upsert(){}
    
   

    public async withTransaction(cb: (tx: Prisma.TransactionClient) => Promise<any>): Promise<any> {
        try {
            this.#logHandler.info(`${this.#model}/withTransaction`, JSON.stringify(cb))
            return await this.#withRetry(async() => {
                return await this.#databaseService.$transaction(cb, {timeout: 20000})
            })
        } catch (error) {
            throw error
        }
        
    }

    public async findOneById(id: string):Promise<any>{
        let cachedData = null
        let cacheKey = ''
        if(this.#CACHE_MODE) {
            cacheKey = this.generateCacheKey(String(this.#model), id)
            cachedData = this.getCache(cacheKey)
            if(!cachedData){
                cachedData = await this.#databaseService[this.#model].findUnique({
                    where: {
                        id
                    }
                });
                this.setCache(cacheKey, cachedData)
            }
            return cachedData
        }
        return await this.#databaseService[this.#model].findUnique({
                    where: {
                        id
                    }
                });
    }
    

    public async findAll(data: any){}
    public async delete(id: string, deletedBy: string, deleteReason:string ){}
    public async permanentdelete(id: string){}
    restore(id: string){}
}
