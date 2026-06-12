<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import EmptyState from "../components/common/EmptyState.vue";
import { stockRecordApi } from "../api/stockRecord";
import { useStockStore } from "../stores/stockStore";
import { useWarehouseStore } from "../stores/warehouseStore";

const warehouseStore = useWarehouseStore();
const stockStore = useStockStore();
const selectedWarehouseId = ref("");

const differences = computed(() =>
  stockStore.report.map((row) => ({
    ...row,
    difference: row.actualQuantity - row.bookQuantity
  }))
);

onMounted(async () => {
  await warehouseStore.fetchWarehouses();
  selectedWarehouseId.value = warehouseStore.warehouses[0]?.id || "";
  await loadReport();
});

async function loadReport() {
  if (selectedWarehouseId.value) {
    await stockStore.fetchInventoryReport(selectedWarehouseId.value);
  }
}

async function applyAdjust(row: { recordId: string; actualQuantity: number }) {
  await stockRecordApi.adjust(row.recordId, row.actualQuantity);
  await loadReport();
}
</script>

<template>
  <section class="panel">
    <div class="panel-title">
      <h2>盘点任务</h2>
      <el-select v-model="selectedWarehouseId" @change="loadReport" placeholder="选择仓库">
        <el-option v-for="warehouse in warehouseStore.warehouses" :key="warehouse.id" :label="warehouse.name" :value="warehouse.id" />
      </el-select>
    </div>
    <el-table v-if="differences.length" :data="differences">
      <el-table-column prop="productName" label="商品" min-width="160" />
      <el-table-column prop="sku" label="SKU" min-width="130" />
      <el-table-column prop="shelfCode" label="库位" width="100" />
      <el-table-column prop="bookQuantity" label="账面数" width="100" />
      <el-table-column label="实盘数" width="160">
        <template #default="{ row }">
          <el-input-number v-model="row.actualQuantity" :min="0" />
        </template>
      </el-table-column>
      <el-table-column prop="difference" label="差异" width="100" />
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="applyAdjust(row)">校准</el-button>
        </template>
      </el-table-column>
    </el-table>
    <EmptyState v-else title="暂无盘点记录" description="选择仓库后会展示可盘点商品" />
  </section>
</template>
