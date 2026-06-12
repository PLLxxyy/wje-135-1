import { OperationType } from "./enums";
import type { Product } from "./product";
import type { Shelf, Warehouse } from "./warehouse";

export interface StockRecord {
  id: string;
  productId: string;
  product?: Product;
  warehouseId: string;
  warehouse?: Warehouse;
  shelfId?: string;
  shelf?: Shelf;
  batchNo: string;
  quantity: number;
  inboundDate: string;
  expiryDate?: string;
  lastOperationType: OperationType;
  lastOperationAt: string;
}

export interface InventoryReportRow {
  recordId: string;
  productName: string;
  sku: string;
  shelfCode: string;
  bookQuantity: number;
  actualQuantity: number;
  difference: number;
}
