import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../config/database.config";
import { jwtConfig } from "../config/jwt.config";
import { ErrorCode, UserRole } from "../types/enums";
import { AuthedRequest } from "../types/interfaces";
import { BusinessError } from "../utils/response";

export async function authMiddleware(req: AuthedRequest, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header) {
      req.user = await getDemoUser();
      next();
      return;
    }

    const token = header.replace(/^Bearer\s+/i, "");
    const payload = jwt.verify(token, jwtConfig.secret) as { userId: string };
    const user = await prisma.user.findUnique({ where: { id: payload.userId }, include: { role: true } });
    if (!user) {
      throw new BusinessError("用户不存在", 401, ErrorCode.Unauthorized);
    }

    req.user = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role.name as UserRole
    };
    next();
  } catch (error) {
    next(error instanceof BusinessError ? error : new BusinessError("认证失败", 401, ErrorCode.Unauthorized));
  }
}

async function getDemoUser() {
  const user = await prisma.user.findFirst({ include: { role: true }, orderBy: { createdAt: "asc" } });
  if (!user) {
    return { id: "system", username: "demo-admin", displayName: "演示管理员", role: UserRole.Admin };
  }
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role.name as UserRole
  };
}
