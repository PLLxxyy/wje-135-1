import { Request } from "express";
import { UserRole } from "./enums";

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
}

export interface AuthedRequest extends Request {
  user?: AuthUser;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
}
