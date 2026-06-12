<script setup lang="ts">
import { Box } from "@element-plus/icons-vue";
defineProps<{ title?: string; description?: string }>();
</script>

<template>
  <div class="empty-state">
    <el-icon><Box /></el-icon>
    <strong>{{ title || "暂无数据" }}</strong>
    <span>{{ description || "筛选条件下没有可展示记录" }}</span>
  </div>
</template>

<style scoped>
.empty-state {
  min-height: 180px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 8px;
  color: #637279;
  border: 1px dashed #c9d7dc;
  border-radius: 8px;
  background: #f9fbfb;
}
.empty-state .el-icon {
  font-size: 28px;
  color: #2f6f73;
}
.empty-state strong {
  color: #203338;
}
</style>
