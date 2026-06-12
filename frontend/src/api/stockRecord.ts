import { API_PATHS } from "../constants/apiPaths";
import type { InventoryReportRow, StockRecord } from "../types";
import { request, unwrap } from "../utils/request";

export const stockRecordApi = {
  list: (params?: { warehouseId?: string; productId?: string; batchNo?: string }) =>
    unwrap<StockRecord[]>(request.get(API_PATHS.stockRecords, { params })),
  inbound: (payload: Partial<StockRecord>) => unwrap<StockRecord>(request.post(`${API_PATHS.stockRecords}/inbound`, payload)),
  outbound: (id: string, quantity: number) => unwrap<StockRecord>(request.post(`${API_PATHS.stockRecords}/${id}/outbound`, { quantity })),
  adjust: (id: string, actualQuantity: number) =>
    unwrap<StockRecord>(request.post(`${API_PATHS.stockRecords}/${id}/adjust`, { actualQuantity })),
  transfer: (id: string, payload: { targetWarehouseId: string; targetShelfId?: string; quantity: number }) =>
    unwrap(request.post(`${API_PATHS.stockRecords}/${id}/transfer`, payload)),
  inventoryReport: (warehouseId: string) =>
    unwrap<InventoryReportRow[]>(request.get(`${API_PATHS.stockRecords}/inventory-report/${warehouseId}`))
};
