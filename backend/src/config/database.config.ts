import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger";

export const prisma = new PrismaClient({
  log: process.env.PRISMA_QUERY_LOG === "true" ? ["query", "error", "warn"] : ["error", "warn"]
});

export async function connectDatabase() {
  await prisma.$connect();
  logger.info("database connected");
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}
