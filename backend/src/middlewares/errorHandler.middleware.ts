import { NextFunction, Request, Response } from "express";
import { ErrorCode } from "../types/enums";
import { logger } from "../utils/logger";
import { BusinessError, fail } from "../utils/response";

export function notFoundMiddleware(req: Request, _res: Response, next: NextFunction) {
  next(new BusinessError(`接口不存在: ${req.method} ${req.originalUrl}`, 404, ErrorCode.NotFound));
}

export function errorHandlerMiddleware(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof BusinessError) {
    return fail(res, error.status, error.code, error.message);
  }
  const message = error instanceof Error ? error.message : String(error);
  logger.error("unhandled error", message);
  return fail(res, 500, ErrorCode.InternalError, "服务器内部错误");
}
