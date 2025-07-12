import Redis from "ioredis"
import Logger from "./utils/log"
import globalprisma from "./repositories/db"
import { IAdminRepository, IAuthProviderRepository, IAuthRepository, IDoctorRepository, IPatientRepository, IPersonalAccessRepository } from "./utils/interfaces/account.interface"
import DoctorRepository from "./repositories/DoctorRepository"
import PatientRepository from "./repositories/PatientRepository"
import AdminRepository from "./repositories/AdminRepository"
import AuthRepository from "./repositories/authRepository copy 2"
import { AuthService } from "./services/authService"
import { AuthProviderRepository, PersonalAccessRepository } from "./repositories/authProviderRepository"

const redisUrl = `redis://default:${encodeURIComponent(process.env.REDIS_PASS as string)}@${process.env.REDIS_HOST}:6379`
const redis = new Redis(redisUrl)

// loggers
// repo loggers
const baseRepologger = new Logger('BasRepository')
const authRepologger = new Logger('AuthRepository')
const patientRepologger = new Logger('PatientRepository')
const doctorRepologger = new Logger('DoctorRepository')
const adminRepologger = new Logger('BasRepository')
const authProviderRepologger = new Logger('AuthProviderRepository')
// service loggers

// controller loggers
export const authControllerlogger = new Logger("AuthController")


// Repositories
const doctorRepository: IDoctorRepository = new DoctorRepository(redis, doctorRepologger, baseRepologger, 'doctor', globalprisma)
const patientRepository: IPatientRepository = new PatientRepository(redis, patientRepologger, baseRepologger, 'patient', globalprisma)
const adminRepository: IAdminRepository = new AdminRepository(redis, adminRepologger, baseRepologger, 'admin', globalprisma)
const authProviderRepository: IAuthProviderRepository = new AuthProviderRepository(redis, adminRepologger, baseRepologger, 'admin', globalprisma)
const personAccessRepository: IPersonalAccessRepository = new PersonalAccessRepository(redis, adminRepologger, baseRepologger, 'personalAccessToken', globalprisma)
const authrepository: IAuthRepository = new AuthRepository(redis, authRepologger, baseRepologger, 'user', globalprisma,patientRepository, adminRepository, doctorRepository, personAccessRepository )

// services
export const authService =  new AuthService(authrepository, authProviderRepository)
// const baseRepository  = new AuthRepository(redis, logger)