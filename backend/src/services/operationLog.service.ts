import { prisma } from "../config/database.config";

export class OperationLogService {
  async list() {
    return prisma.operationLog.findMany({
      include: { warehouse: true, product: true, order: true, operator: true },
      orderBy: { createdAt: "desc" },
      take: 100
    });
  }
}
