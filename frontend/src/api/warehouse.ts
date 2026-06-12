import { API_PATHS } from "../constants/apiPaths";
import type { PermissionState, Warehouse } from "../types";
import { request, unwrap } from "../utils/request";

export interface DashboardSummary {
  stockValueByWarehouse: { warehouseName: string; stockValue: number; totalQuantity: number }[];
  alerts: { id: string; name: string; sku: string; currentStock: number; minStock: number; unit: string }[];
  todaysFlowCount: number;
  turnoverRate: number;
}

export const warehouseApi = {
  list: () => unwrap<Warehouse[]>(request.get(API_PATHS.warehouses)),
  detail: (id: string) => unwrap<Warehouse>(request.get(`${API_PATHS.warehouses}/${id}`)),
  dashboard: () => unwrap<DashboardSummary>(request.get(API_PATHS.dashboard)),
  permissions: () => unwrap<PermissionState>(request.get(API_PATHS.permissions)),
  create: (payload: Partial<Warehouse>) => unwrap<Warehouse>(request.post(API_PATHS.warehouses, payload)),
  updateStatus: (id: string, status: string) => unwrap<Warehouse>(request.patch(`${API_PATHS.warehouses}/${id}/status`, { status })),
  addShelf: (id: string, payload: { shelfCode: string; levels: number; columns: number; capacity: number }) =>
    unwrap(request.post(`${API_PATHS.warehouses}/${id}/shelves`, payload))
};
