import { WarehouseStatus } from "./enums";
import type { StockRecord } from "./stock";

export interface Shelf {
  id: string;
  warehouseId: string;
  shelfCode: string;
  levels: number;
  columns: number;
  capacity: number;
  used?: number;
  occupancyRate?: number;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string;
  area: number | string;
  managerId?: string;
  manager?: { displayName: string };
  status: WarehouseStatus;
  contactPhone: string;
  shelves: Shelf[];
  stockRecords?: StockRecord[];
  totalQuantity?: number;
  stockValue?: number;
  occupancyRate?: number;
}
