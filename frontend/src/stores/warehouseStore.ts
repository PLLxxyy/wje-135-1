import { defineStore } from "pinia";
import { warehouseApi, type DashboardSummary } from "../api/warehouse";
import type { PermissionState, Warehouse } from "../types";

export const useWarehouseStore = defineStore("warehouse", {
  state: () => ({
    warehouses: [] as Warehouse[],
    current: null as Warehouse | null,
    dashboard: null as DashboardSummary | null,
    permissions: { role: "Viewer", canWrite: false, canManageWarehouse: false } as PermissionState,
    loading: false
  }),
  actions: {
    async fetchWarehouses() {
      this.loading = true;
      try {
        this.warehouses = await warehouseApi.list();
      } finally {
        this.loading = false;
      }
    },
    async fetchDashboard() {
      this.dashboard = await warehouseApi.dashboard();
    },
    async fetchDetail(id: string) {
      this.current = await warehouseApi.detail(id);
    },
    async fetchPermissions() {
      this.permissions = await warehouseApi.permissions();
    }
  }
});
