"use strict";
// src/lib/db.ts
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("../../@prisma/client");
/**
 * Use a global variable in development to avoid creating new instances on hot reload.
 * In production, use a local PrismaClient.
 */
const globalForPrisma = globalThis;
// singleton instance for prisma
const globalprisma = globalForPrisma.prisma ??
    new client_1.PrismaClient({
        log: ['query', 'error', 'warn'],
    });
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = globalprisma;
}
exports.default = globalprisma;
