"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errorhandlers_1 = require("../utils/errorhandlers");
const enums_1 = require("../utils/enums");
class BaseRepository {
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
    #MAX_ATTEMPTS = Number(process.env.MAX_ATTEMPTS) || 3;
    #RETRY_DELAY = Number(process.env.RETRY_DELAY) || 100;
    #CACHE_MODE = Boolean(Number(process.env.CACHE_MODE)) || false;
    #TTL = Number(process.env.TTL) || 3600;
    #cacheHandler;
    #logHandler;
    #model;
    #databaseService;
    constructor(redis, logHandler, model, databaseService) {
        this.#cacheHandler = redis;
        this.#logHandler = logHandler;
        this.#model = model;
        this.#databaseService = databaseService;
    }
    async #withRetry(fn, attempts = 1) {
        try {
            return await fn();
        }
        catch (error) {
            if (attempts >= this.#MAX_ATTEMPTS || !this.#isTransientError(error)) {
                throw error;
            }
            // exponential backoff for delay with every retry
            const Delay = this.#RETRY_DELAY * 2 ** attempts;
            this.#logHandler.warn(`Retrying operation (Attempt ${attempts + 1}) in ${Delay}ms...`, 'withRetry');
            await new Promise((resolve) => {
                setTimeout(resolve, Delay);
            });
            return await this.#withRetry(fn, attempts + 1);
        }
    }
    /**
     *
     * @param error
     * @returns boolean
     */
    #isTransientError(error) {
        const TRANSIENT_ERROR_CODES = [
            'ECONNRESET',
            'ETIMEDOUT',
            'ECONNREFUSED',
            'EAI_AGAIN',
            'ENOTFOUND'
        ];
        if (!error)
            return false;
        return TRANSIENT_ERROR_CODES.includes(error.code || '');
    }
    generateCacheKey(prefix, id) {
        return `${prefix}:${id}`;
    }
    async setCache(key, value, ttl = this.#TTL) {
        if (!this.#CACHE_MODE)
            return;
        await this.#withRetry(async () => {
            await this.#cacheHandler.set(key, value, "EX", ttl);
        }).catch(() => { });
    }
    async getCache(key) {
        if (!this.#CACHE_MODE)
            return null;
        return await this.#withRetry(async () => {
            const cachedResult = await this.#cacheHandler.get(key);
            return cachedResult;
        }).catch(() => Promise.resolve(null));
    }
    async invalidateCache(key) {
        if (!this.#CACHE_MODE)
            return;
        return await this.#withRetry(async () => {
            await this.#cacheHandler.del(key);
        }).catch(() => { });
    }
    /**
     *  creates new row in the database
     *
     * @param {Partial<M>} data - the data is takes to create a new record
     *
     * @returns {Promise<M>} - the newly created record
     *
     */
    async create(data) {
        try {
            return await this.#withRetry(async () => {
                return await this.#databaseService[this.#model].create({ data });
            });
        }
        catch (error) {
            throw new errorhandlers_1.DatabaseError(`Could not create data with the provided parameters`, 500, enums_1.ErrorCodes.INTERNAL_ERROR, error);
        }
    }
    /**
     *  finds a single record using unique parameters
     *
     * @param {any} data - the data is takes to find a single unique record
     *
     * @returns {Promise<M>} - the found created record or null
     *
     */
    async findUnique(data) {
        try {
            return await this.#withRetry(async () => {
                return await this.#databaseService[this.#model].findUnique(data);
            });
        }
        catch (error) {
            throw new errorhandlers_1.DatabaseError(`Could not find unique data with the provided parameters`, 500, enums_1.ErrorCodes.INTERNAL_ERROR, error);
        }
    }
    async update(findBy, data) {
        try {
            return await this.#withRetry(async () => {
                return await this.#databaseService[this.#model].update({
                    ...findBy,
                    data
                });
            });
        }
        catch (error) {
            throw new errorhandlers_1.DatabaseError(`Could not update data with the provided parameters`, 500, enums_1.ErrorCodes.INTERNAL_ERROR, error);
        }
    }
    async createMany() { }
    async upsert(data) {
        try {
            return await this.#withRetry(async () => {
                return await this.#databaseService[this.#model].upsert({
                    ...data
                });
            });
        }
        catch (error) {
            throw new errorhandlers_1.DatabaseError(`Could not upsert data with the provided parameters`, 500, enums_1.ErrorCodes.INTERNAL_ERROR, error);
        }
    }
    async withTransaction(cb) {
        try {
            this.#logHandler.info(`${this.#model}/withTransaction`, JSON.stringify(cb));
            return await this.#withRetry(async () => {
                return await this.#databaseService.$transaction(cb, { timeout: 20000 });
            });
        }
        catch (error) {
            throw new errorhandlers_1.DatabaseError(`Server error, transaction error and rollback initiated`, 500, enums_1.ErrorCodes.INTERNAL_ERROR, error);
        }
    }
    async findOneById(id) {
        let cachedData = null;
        let cacheKey = '';
        if (this.#CACHE_MODE) {
            cacheKey = this.generateCacheKey(String(this.#model), id);
            cachedData = this.getCache(cacheKey);
            if (!cachedData) {
                cachedData = await this.#databaseService[this.#model].findUnique({
                    where: {
                        id
                    }
                });
                this.setCache(cacheKey, cachedData);
            }
            return cachedData;
        }
        return await this.#databaseService[this.#model].findUnique({
            where: {
                id
            }
        });
    }
    async findAll(data) { }
    async delete(id, deletedBy, deleteReason) { }
    async permanentdelete(id) { }
    restore(id) { }
}
exports.default = BaseRepository;
