import { Response } from "express";
import { ApiResponse } from "../types/interfaces";
import { ErrorCode } from "../types/enums";

export class BusinessError extends Error {
  status: number;
  code: ErrorCode;

  constructor(message: string, status = 400, code = ErrorCode.BusinessError) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function ok<T>(res: Response, data: T, message = "ok") {
  const body: ApiResponse<T> = { success: true, data, message };
  return res.json(body);
}

export function created<T>(res: Response, data: T, message = "created") {
  const body: ApiResponse<T> = { success: true, data, message };
  return res.status(201).json(body);
}

export function fail(res: Response, status: number, code: ErrorCode, message: string) {
  const body: ApiResponse<never> = { success: false, code, message };
  return res.status(status).json(body);
}
