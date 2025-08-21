"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
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
 * @see PatientModel
 */
class PatientRepository extends baseRepository_1.default {
    #logHandler;
    constructor(redis, logHandler, superLogHandler, model, databaseService) {
        super(redis, superLogHandler, model, databaseService);
        this.#logHandler = logHandler;
    }
    async create(data) {
        try {
            const patient = await super.create(data);
            return patient;
        }
        catch (error) {
            this.#logHandler.alarm("PatientRepository/create", JSON.stringify(`failed to create patient for a user at ${Date.now()} data: ${data}`));
            throw new Error("Could not create patient");
        }
    }
}
exports.default = PatientRepository;
