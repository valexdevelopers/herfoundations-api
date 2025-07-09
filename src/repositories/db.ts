// src/lib/db.ts

import { PrismaClient} from '../../@prisma/client'

/**
 * Use a global variable in development to avoid creating new instances on hot reload.
 * In production, use a local PrismaClient.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// singleton instance for prisma
 const globalprisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query', 'error', 'warn'], 
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = globalprisma
}

export default globalprisma