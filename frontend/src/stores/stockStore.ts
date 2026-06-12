import { defineStore } from "pinia";
import { stockRecordApi } from "../api/stockRecord";
import type { InventoryReportRow, StockRecord } from "../types";

export const useStockStore = defineStore("stock", {
  state: () => ({
    records: [] as StockRecord[],
    report: [] as InventoryReportRow[],
    loading: false
  }),
  actions: {
    async fetchRecords(params?: { warehouseId?: string; productId?: string; batchNo?: string }) {
      this.loading = true;
      try {
        this.records = await stockRecordApi.list(params);
      } finally {
        this.loading = false;
      }
    },
    async fetchInventoryReport(warehouseId: string) {
      this.report = await stockRecordApi.inventoryReport(warehouseId);
    }
  }
});
