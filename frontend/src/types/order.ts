import { OrderStatus, OrderType, OperationType } from "./enums";
import type { Product } from "./product";
import type { Shelf, Warehouse } from "./warehouse";

export interface StockOrderItem {
  id?: string;
  productId: string;
  product?: Product;
  shelfId?: string;
  shelf?: Shelf;
  quantity: number;
  actualQuantity?: number;
}

export interface StockOrder {
  id: string;
  orderNo: string;
  type: OrderType;
  sourceWarehouseId?: string;
  sourceWarehouse?: Warehouse;
  targetWarehouseId?: string;
  targetWarehouse?: Warehouse;
  status: OrderStatus;
  createdById: string;
  approvedById?: string;
  remark?: string;
  items: StockOrderItem[];
  createdAt: string;
}

export interface OperationLog {
  id: string;
  operationType: OperationType;
  entityType: string;
  entityId?: string;
  remark?: string;
  createdAt: string;
}
