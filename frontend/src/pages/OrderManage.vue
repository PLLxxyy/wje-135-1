<script setup lang="ts">
import { ElMessage } from "element-plus";
import { onMounted, reactive, ref } from "vue";
import { stockOrderApi } from "../api/stockOrder";
import EmptyState from "../components/common/EmptyState.vue";
import StatusBadge from "../components/common/StatusBadge.vue";
import { OrderType } from "../types/enums";
import { useOrderStore } from "../stores/orderStore";
import { useProductStore } from "../stores/productStore";
import { useWarehouseStore } from "../stores/warehouseStore";

const orderStore = useOrderStore();
const productStore = useProductStore();
const warehouseStore = useWarehouseStore();
const activeType = ref("");
const form = reactive({
  type: OrderType.Inbound,
  targetWarehouseId: "",
  sourceWarehouseId: "",
  remark: "",
  items: [{ productId: "", shelfId: "", quantity: 1, actualQuantity: 1 }]
});

onMounted(async () => {
  await Promise.all([orderStore.fetchOrders(), orderStore.fetchLogs(), productStore.fetchProducts(), warehouseStore.fetchWarehouses()]);
  form.targetWarehouseId = warehouseStore.warehouses[0]?.id || "";
});

async function switchType(type: string) {
  activeType.value = type;
  await orderStore.fetchOrders(type || undefined);
}

function addItem() {
  form.items.push({ productId: "", shelfId: "", quantity: 1, actualQuantity: 1 });
}

async function submitOrder() {
  const payload = {
    ...form,
    sourceWarehouseId: form.sourceWarehouseId || undefined,
    targetWarehouseId: form.targetWarehouseId || undefined,
    items: form.items.filter((item) => item.productId)
  };
  await stockOrderApi.create(payload);
  ElMessage.success("单据已创建");
  await orderStore.fetchOrders(activeType.value || undefined);
}
</script>

<template>
  <section class="order-page">
    <div class="panel">
      <div class="panel-title">
        <h2>单据列表</h2>
      </div>
      <el-tabs v-model="activeType" @tab-change="switchType">
        <el-tab-pane label="全部" name="" />
        <el-tab-pane label="入库" :name="OrderType.Inbound" />
        <el-tab-pane label="出库" :name="OrderType.Outbound" />
        <el-tab-pane label="调拨" :name="OrderType.Transfer" />
        <el-tab-pane label="盘点" :name="OrderType.InventoryCheck" />
      </el-tabs>
      <el-table :data="orderStore.orders" v-loading="orderStore.loading">
        <el-table-column prop="orderNo" label="单号" min-width="160" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }"><StatusBadge :value="row.type" /></template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="110">
          <template #default="{ row }"><StatusBadge :value="row.status" /></template>
        </el-table-column>
        <el-table-column label="明细" width="90">
          <template #default="{ row }">{{ row.items?.length || 0 }} 行</template>
        </el-table-column>
      </el-table>
      <EmptyState v-if="!orderStore.loading && !orderStore.orders.length" title="暂无单据" />
    </div>

    <div class="panel">
      <div class="panel-title"><h2>创建单据</h2></div>
      <el-form label-position="top">
        <el-form-item label="单据类型">
          <el-select v-model="form.type">
            <el-option label="入库" :value="OrderType.Inbound" />
            <el-option label="出库" :value="OrderType.Outbound" />
            <el-option label="调拨" :value="OrderType.Transfer" />
            <el-option label="盘点" :value="OrderType.InventoryCheck" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标仓库">
          <el-select v-model="form.targetWarehouseId">
            <el-option v-for="warehouse in warehouseStore.warehouses" :key="warehouse.id" :label="warehouse.name" :value="warehouse.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" />
        </el-form-item>
        <div class="order-item" v-for="(item, index) in form.items" :key="index">
          <el-select v-model="item.productId" placeholder="商品">
            <el-option v-for="product in productStore.products" :key="product.id" :label="`${product.name} / ${product.sku}`" :value="product.id" />
          </el-select>
          <el-input-number v-model="item.quantity" :min="1" />
          <el-input-number v-model="item.actualQuantity" :min="0" />
        </div>
        <el-button @click="addItem">添加明细行</el-button>
        <el-button type="primary" @click="submitOrder">提交单据</el-button>
      </el-form>
    </div>

    <div class="panel">
      <div class="panel-title"><h2>操作日志</h2></div>
      <el-timeline>
        <el-timeline-item v-for="log in orderStore.logs.slice(0, 8)" :key="log.id" :timestamp="new Date(log.createdAt).toLocaleString()">
          <StatusBadge :value="log.operationType" /> {{ log.entityType }} {{ log.remark }}
        </el-timeline-item>
      </el-timeline>
    </div>
  </section>
</template>
