import { PrismaClient } from '@prisma/client';

// Синглтон: в dev Next перезагружает модули на каждое изменение,
// без кэша в globalThis получим десятки живых пулов соединений.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
