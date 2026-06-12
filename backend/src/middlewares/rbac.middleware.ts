import { NextFunction, Response } from "express";
import { ErrorCode, UserRole } from "../types/enums";
import { AuthedRequest } from "../types/interfaces";
import { BusinessError } from "../utils/response";

export function rbacMiddleware(allowedRoles: UserRole[]) {
  return (req: AuthedRequest, _res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (!role) {
      next(new BusinessError("未登录", 401, ErrorCode.Unauthorized));
      return;
    }
    if (!allowedRoles.includes(role)) {
      next(new BusinessError("当前角色无权执行该操作", 403, ErrorCode.Forbidden));
      return;
    }
    next();
  };
}

export const writeRoles = [UserRole.Admin, UserRole.WarehouseManager, UserRole.Operator];
export const manageRoles = [UserRole.Admin, UserRole.WarehouseManager];
