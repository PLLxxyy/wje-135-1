import { defineStore } from "pinia";
import { stockOrderApi } from "../api/stockOrder";
import type { OperationLog, StockOrder } from "../types";

export const useOrderStore = defineStore("order", {
  state: () => ({
    orders: [] as StockOrder[],
    logs: [] as OperationLog[],
    current: null as StockOrder | null,
    loading: false
  }),
  actions: {
    async fetchOrders(type?: string) {
      this.loading = true;
      try {
        this.orders = await stockOrderApi.list(type ? { type } : undefined);
      } finally {
        this.loading = false;
      }
    },
    async fetchLogs() {
      this.logs = await stockOrderApi.operationLogs();
    },
    async fetchDetail(id: string) {
      this.current = await stockOrderApi.detail(id);
    }
  }
});
