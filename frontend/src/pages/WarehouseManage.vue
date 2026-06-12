<script setup lang="ts">
import { onMounted, ref } from "vue";
import OccupancyBar from "../components/common/OccupancyBar.vue";
import StatusBadge from "../components/common/StatusBadge.vue";
import EmptyState from "../components/common/EmptyState.vue";
import { useWarehouseStore } from "../stores/warehouseStore";
import { formatStockNumber } from "../utils/formatStockNumber";

const warehouseStore = useWarehouseStore();
const selectedId = ref("");

onMounted(async () => {
  await warehouseStore.fetchWarehouses();
  selectedId.value = warehouseStore.warehouses[0]?.id || "";
  if (selectedId.value) {
    await warehouseStore.fetchDetail(selectedId.value);
  }
});

async function selectWarehouse(id: string) {
  selectedId.value = id;
  await warehouseStore.fetchDetail(id);
}
</script>

<template>
  <section class="split-page">
    <div class="warehouse-list">
      <article v-for="item in warehouseStore.warehouses" :key="item.id" class="warehouse-card" :class="{ active: item.id === selectedId }" @click="selectWarehouse(item.id)">
        <div class="panel-title">
          <h2>{{ item.name }}</h2>
          <StatusBadge :value="item.status" />
        </div>
        <p>{{ item.code }} · {{ item.address }}</p>
        <dl>
          <div><dt>面积</dt><dd>{{ item.area }} m²</dd></div>
          <div><dt>库存量</dt><dd>{{ formatStockNumber(item.totalQuantity) }}</dd></div>
        </dl>
        <OccupancyBar :value="item.occupancyRate || 0" compact />
      </article>
      <EmptyState v-if="!warehouseStore.warehouses.length" title="暂无仓库" />
    </div>

    <div class="panel">
      <div class="panel-title">
        <h2>{{ warehouseStore.current?.name || "仓库详情" }}</h2>
        <span>{{ warehouseStore.current?.contactPhone }}</span>
      </div>
      <div class="shelf-grid" v-if="warehouseStore.current?.shelves?.length">
        <div v-for="shelf in warehouseStore.current.shelves" :key="shelf.id" class="shelf-cell">
          <strong>{{ shelf.shelfCode }}</strong>
          <span>{{ shelf.levels }} 层 / {{ shelf.columns }} 列</span>
          <OccupancyBar :value="shelf.occupancyRate || 0" compact />
          <small>{{ shelf.used || 0 }} / {{ shelf.capacity }}</small>
        </div>
      </div>
      <EmptyState v-else title="暂无库位" description="可为该仓库维护货架与容量" />
    </div>
  </section>
</template>
