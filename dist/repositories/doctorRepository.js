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
 * @see DoctorModel
 */
class DoctorRepository extends baseRepository_1.default {
    #logHandler;
    constructor(redis, logHandler, superLogHandler, model, databaseService) {
        super(redis, superLogHandler, model, databaseService);
        this.#logHandler = logHandler;
    }
    async create(data) {
        try {
            const doctor = await super.create(data);
            return doctor;
        }
        catch (error) {
            this.#logHandler.alarm("DoctorRepository/create", JSON.stringify(`failed to create doctor for a user at ${Date.now()} data: ${data}`));
            throw new Error("Could not create doctor");
        }
    }
}
exports.default = DoctorRepository;
