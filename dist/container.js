"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.authControllerlogger = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const log_1 = __importDefault(require("./utils/log"));
const db_1 = __importDefault(require("./repositories/db"));
const doctorRepository_1 = __importDefault(require("./repositories/doctorRepository"));
const patientRepository_1 = __importDefault(require("./repositories/patientRepository"));
const adminRepository_1 = __importDefault(require("./repositories/adminRepository"));
const authRepository_1 = __importDefault(require("./repositories/authRepository"));
const authService_1 = require("./services/authService");
const authProviderRepository_1 = require("./repositories/authProviderRepository");
const redisUrl = `redis://default:${encodeURIComponent(process.env.REDIS_PASS)}@${process.env.REDIS_HOST}:6379`;
const redis = new ioredis_1.default(redisUrl);
// loggers
// repo loggers
const baseRepologger = new log_1.default('BasRepository');
const authRepologger = new log_1.default('AuthRepository');
const patientRepologger = new log_1.default('PatientRepository');
const doctorRepologger = new log_1.default('DoctorRepository');
const adminRepologger = new log_1.default('BasRepository');
const authProviderRepologger = new log_1.default('AuthProviderRepository');
// service loggers
// controller loggers
exports.authControllerlogger = new log_1.default("AuthController");
// Repositories
const doctorRepository = new doctorRepository_1.default(redis, doctorRepologger, baseRepologger, 'doctor', db_1.default);
const patientRepository = new patientRepository_1.default(redis, patientRepologger, baseRepologger, 'patient', db_1.default);
const adminRepository = new adminRepository_1.default(redis, adminRepologger, baseRepologger, 'admin', db_1.default);
const authProviderRepository = new authProviderRepository_1.AuthProviderRepository(redis, adminRepologger, baseRepologger, 'admin', db_1.default);
const personAccessRepository = new authProviderRepository_1.PersonalAccessRepository(redis, adminRepologger, baseRepologger, 'personalAccessToken', db_1.default);
const authrepository = new authRepository_1.default(redis, authRepologger, baseRepologger, 'user', db_1.default, patientRepository, adminRepository, doctorRepository, personAccessRepository);
// services
exports.authService = new authService_1.AuthService(authrepository, authProviderRepository);
// const baseRepository  = new AuthRepository(redis, logger)
