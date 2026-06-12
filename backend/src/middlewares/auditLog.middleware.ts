import { NextFunction, Response } from "express";
import { prisma } from "../config/database.config";
import { OperationType } from "../types/enums";
import { AuthedRequest } from "../types/interfaces";
import { logger } from "../utils/logger";

const methodOperation: Record<string, OperationType> = {
  POST: OperationType.Inbound,
  PUT: OperationType.Adjust,
  PATCH: OperationType.Adjust,
  DELETE: OperationType.Outbound
};

export function auditLogMiddleware(req: AuthedRequest, res: Response, next: NextFunction) {
  const startedAt = Date.now();
  res.on("finish", () => {
    const operationType = methodOperation[req.method];
    if (!operationType || res.statusCode >= 400) {
      return;
    }
    void prisma.operationLog
      .create({
        data: {
          operationType,
          entityType: req.path.split("/").filter(Boolean)[1] || "system",
          entityId: typeof req.params.id === "string" ? req.params.id : undefined,
          operatorId: req.user?.id === "system" ? undefined : req.user?.id,
          afterData: sanitizeBody(req.body),
          remark: `${req.method} ${req.originalUrl} ${Date.now() - startedAt}ms`
        }
      })
      .catch((error) => logger.warn("audit log failed", { message: String(error) }));
  });
  next();
}

function sanitizeBody(body: unknown) {
  if (!body || typeof body !== "object") {
    return undefined;
  }
  return JSON.parse(JSON.stringify(body));
}
