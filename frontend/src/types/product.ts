import type { Category } from "./index";
import type { StockRecord } from "./stock";

export interface Product {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  category?: Category;
  spec: string;
  unit: string;
  weight: number | string;
  volume: number | string;
  barcode: string;
  minStock: number;
  maxStock: number;
  shelfLifeDays?: number;
  imageUrl?: string;
  price?: number | string;
  stockRecords?: StockRecord[];
  totalStock?: number;
  stockWarning?: boolean;
}
