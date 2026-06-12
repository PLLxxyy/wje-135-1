import { API_PATHS } from "../constants/apiPaths";
import type { OperationLog, StockOrder } from "../types";
import { request, unwrap } from "../utils/request";

export const stockOrderApi = {
  list: (params?: { type?: string }) => unwrap<StockOrder[]>(request.get(API_PATHS.orders, { params })),
  detail: (id: string) => unwrap<StockOrder>(request.get(`${API_PATHS.orders}/${id}`)),
  create: (payload: Partial<StockOrder>) => unwrap<StockOrder>(request.post(API_PATHS.orders, payload)),
  updateStatus: (id: string, status: string) => unwrap<StockOrder>(request.patch(`${API_PATHS.orders}/${id}/status`, { status })),
  complete: (id: string) => unwrap<StockOrder>(request.post(`${API_PATHS.orders}/${id}/complete`)),
  operationLogs: () => unwrap<OperationLog[]>(request.get(API_PATHS.operationLogs))
};
