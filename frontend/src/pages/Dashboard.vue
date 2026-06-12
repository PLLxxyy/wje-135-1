<script setup lang="ts">
import * as echarts from "echarts";
import { nextTick, onMounted, ref } from "vue";
import StockAlert from "../components/common/StockAlert.vue";
import StatusBadge from "../components/common/StatusBadge.vue";
import EmptyState from "../components/common/EmptyState.vue";
import { useOrderStore } from "../stores/orderStore";
import { useWarehouseStore } from "../stores/warehouseStore";

const warehouseStore = useWarehouseStore();
const orderStore = useOrderStore();
const chartRef = ref<HTMLDivElement>();

onMounted(async () => {
  await Promise.all([warehouseStore.fetchDashboard(), orderStore.fetchOrders()]);
  await nextTick();
  renderChart();
});

function renderChart() {
  if (!chartRef.value || !warehouseStore.dashboard) {
    return;
  }
  const chart = echarts.init(chartRef.value);
  chart.setOption({
    grid: { left: 40, right: 16, top: 20, bottom: 36 },
    tooltip: {},
    xAxis: { type: "category", data: warehouseStore.dashboard.stockValueByWarehouse.map((item) => item.warehouseName) },
    yAxis: { type: "value" },
    series: [
      {
        type: "bar",
        data: warehouseStore.dashboard.stockValueByWarehouse.map((item) => item.stockValue),
        itemStyle: { color: "#2f6f73", borderRadius: [5, 5, 0, 0] }
      }
    ]
  });
}
</script>

<template>
  <section class="page-grid">
    <div class="metric-strip">
      <article>
        <span>今日出入库流水</span>
        <strong>{{ warehouseStore.dashboard?.todaysFlowCount ?? 0 }}</strong>
      </article>
      <article>
        <span>库存周转率</span>
        <strong>{{ warehouseStore.dashboard?.turnoverRate ?? 0 }}</strong>
      </article>
      <article>
        <span>单据总数</span>
        <strong>{{ orderStore.orders.length }}</strong>
      </article>
    </div>

    <div class="panel wide">
      <div class="panel-title">
        <h2>各仓库存货金额</h2>
        <StatusBadge value="Active" />
      </div>
      <div ref="chartRef" class="chart"></div>
    </div>

    <div class="panel">
      <div class="panel-title">
        <h2>库存预警 TOP10</h2>
      </div>
      <div v-if="warehouseStore.dashboard?.alerts.length" class="stack">
        <StockAlert
          v-for="item in warehouseStore.dashboard.alerts"
          :key="item.id"
          :name="item.name"
          :sku="item.sku"
          :current="item.currentStock"
          :min="item.minStock"
          :unit="item.unit"
        />
      </div>
      <EmptyState v-else title="没有低库存商品" description="所有商品都在库存阈值以上" />
    </div>

    <div class="panel">
      <div class="panel-title">
        <h2>最近单据</h2>
      </div>
      <el-table :data="orderStore.orders.slice(0, 6)" height="320">
        <el-table-column prop="orderNo" label="单号" min-width="150" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }"><StatusBadge :value="row.type" /></template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }"><StatusBadge :value="row.status" /></template>
        </el-table-column>
      </el-table>
    </div>
  </section>
</template>
