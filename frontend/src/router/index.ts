import { createRouter, createWebHistory } from "vue-router";
import Dashboard from "../pages/Dashboard.vue";
import WarehouseManage from "../pages/WarehouseManage.vue";
import ProductManage from "../pages/ProductManage.vue";
import OrderManage from "../pages/OrderManage.vue";
import InventoryCheck from "../pages/InventoryCheck.vue";
import { setupGuards } from "./guards";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/dashboard" },
    { path: "/dashboard", component: Dashboard, meta: { label: "库存总览" } },
    { path: "/warehouses", component: WarehouseManage, meta: { label: "仓库管理" } },
    { path: "/products", component: ProductManage, meta: { label: "商品管理" } },
    { path: "/orders", component: OrderManage, meta: { label: "出入库管理", requiresWrite: true } },
    { path: "/inventory-check", component: InventoryCheck, meta: { label: "盘点管理", requiresWrite: true } }
  ]
});

setupGuards(router);
