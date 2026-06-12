<script setup lang="ts">
const props = defineProps<{ value: string }>();

const maps: Record<string, { label: string; type: "success" | "warning" | "info" | "danger" | "primary" }> = {
  Active: { label: "启用", type: "success" },
  Inactive: { label: "停用", type: "info" },
  Maintenance: { label: "维护", type: "warning" },
  Draft: { label: "草稿", type: "info" },
  Submitted: { label: "已提交", type: "primary" },
  Processing: { label: "处理中", type: "warning" },
  Completed: { label: "已完成", type: "success" },
  Cancelled: { label: "已取消", type: "danger" },
  Inbound: { label: "入库", type: "success" },
  Outbound: { label: "出库", type: "danger" },
  Transfer: { label: "调拨", type: "warning" },
  InventoryCheck: { label: "盘点", type: "primary" },
  Adjust: { label: "调整", type: "primary" }
};

const item = maps[props.value] || { label: props.value, type: "info" };
</script>

<template>
  <el-tag :type="item.type" effect="light" round>{{ item.label }}</el-tag>
</template>
