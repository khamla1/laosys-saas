import { PrismaClient } from '../generated/prisma-v2/client'
import "./env"

const prismaClientSingleton = () => {
  return new PrismaClient({
    // In production, only log errors. In development, log warnings and errors to monitor query behavior.
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })
}

// Use a global variable to preserve the Prisma client instance across hot reloads in development.
// This strictly prevents Next.js from exhausting database connections during HMR.
declare global {
  var prismaGlobalV2: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobalV2 ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobalV2 = prisma
}
