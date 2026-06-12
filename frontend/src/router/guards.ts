import type { Router } from "vue-router";
import { useWarehouseStore } from "../stores/warehouseStore";

export function setupGuards(router: Router) {
  router.beforeEach(async (to) => {
    const warehouseStore = useWarehouseStore();
    if (!warehouseStore.permissions.role || warehouseStore.permissions.role === "Viewer") {
      await warehouseStore.fetchPermissions();
    }
    if (to.meta.requiresWrite && !warehouseStore.permissions.canWrite) {
      return "/dashboard";
    }
    return true;
  });
}
