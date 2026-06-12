<script setup lang="ts">
defineProps<{ value: number; compact?: boolean }>();
</script>

<template>
  <div class="occupancy-bar">
    <el-progress :percentage="Math.min(100, Math.max(0, value || 0))" :stroke-width="compact ? 8 : 12" :show-text="!compact" />
  </div>
</template>
