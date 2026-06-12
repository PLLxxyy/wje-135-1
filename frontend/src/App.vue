<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { DataAnalysis, Goods, House, List, Memo } from "@element-plus/icons-vue";
import { useWarehouseStore } from "./stores/warehouseStore";

const route = useRoute();
const warehouseStore = useWarehouseStore();
const activePath = computed(() => route.path);

onMounted(() => {
  void warehouseStore.fetchPermissions();
});
</script>

<template>
  <el-container class="app-shell">
    <el-aside width="248px" class="side-nav">
      <div class="brand">
        <span>WS</span>
        <div>
          <strong>仓储库存中台</strong>
          <small>{{ warehouseStore.permissions.role }}</small>
        </div>
      </div>
      <el-menu :default-active="activePath" router>
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>库存总览</span>
        </el-menu-item>
        <el-menu-item index="/warehouses">
          <el-icon><House /></el-icon>
          <span>仓库管理</span>
        </el-menu-item>
        <el-menu-item index="/products">
          <el-icon><Goods /></el-icon>
          <span>商品管理</span>
        </el-menu-item>
        <el-menu-item index="/orders">
          <el-icon><List /></el-icon>
          <span>出入库管理</span>
        </el-menu-item>
        <el-menu-item index="/inventory-check">
          <el-icon><Memo /></el-icon>
          <span>盘点管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="topbar">
        <div>
          <b>{{ route.meta.label }}</b>
          <span>多仓库 / 多库位精细化库存流转</span>
        </div>
        <el-tag v-if="!warehouseStore.permissions.canWrite" type="info">只读模式</el-tag>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>
