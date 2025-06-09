<template>
  <div class="flex w-full gap-3">
    <div class="flex flex-col items-center p-4 bg-white/5 rounded-sm flex-1">
      <span class="mdi mdi-graph"></span>
      <div class="text-4xl font-bold">
        {{ detail.workflows.length }}
      </div>
      <div class="text-xs opacity-80 text-ellipsis overflow-hidden text-nowrap">
        Flujos de Trabajo
      </div>
    </div>
    <div class="flex flex-col items-center p-4 bg-white/5 rounded-sm flex-1">
      <span class="mdi mdi-account-group"></span>
      <div class="text-4xl font-bold">
        0
      </div>
      <div class="text-xs opacity-80 text-ellipsis overflow-hidden text-nowrap">
        Colaboradores
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import type { Interface_Project } from '../../../shared/interfaces/interface_project';

defineProps<{
  detail: Interface_Project
}>()
</script>

<style scoped>
div>div {
  /* height: 200px; */
  position: relative;
  overflow: hidden;
}

div>div>.mdi {
  font-size: 160px;
  position: absolute;
  top: -80px;
  opacity: 0.05;
  right: -20px;
}
</style>