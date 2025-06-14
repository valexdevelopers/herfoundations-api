import Redis from "ioredis"
import Logger from "./utils/log"

const logger = new Logger('BasRepository')
const redis = new Redis('redis://:password@host:6379')


// const authrepository: IAuthRepository = new AuthRepository(prisma)
// const baseRepository  = new AuthRepository(redis, logger)