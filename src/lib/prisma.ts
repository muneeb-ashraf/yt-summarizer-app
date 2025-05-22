import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function getUserCredits(userId: string) {
  return prisma.credits.findUnique({
    where: { userId },
  });
}

export async function createUserCredits(userId: string) {
  return prisma.credits.create({
    data: {
      userId,
      summariesLeft: 0,
      plan: 'free',
    },
  });
}

export async function updateUserCredits(
  userId: string,
  data: {
    summariesLeft?: number;
    plan?: string;
    stripeCustomerId?: string;
    subscriptionId?: string;
    subscriptionStatus?: string;
    lastSummaryAt?: Date;
  }
) {
  return prisma.credits.update({
    where: { userId },
    data,
  });
}

export async function decrementUserCredits(userId: string) {
  return prisma.credits.update({
    where: { userId },
    data: {
      summariesLeft: { decrement: 1 },
      lastSummaryAt: new Date(),
    },
  });
}

export async function incrementUserCredits(userId: string, amount: number) {
  return prisma.credits.update({
    where: { userId },
    data: {
      summariesLeft: { increment: amount },
    },
  });
}
