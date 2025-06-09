<template>
  <div class="flex flex-col h-full">
    <h2 class="text-xl mb-2">
      Proyectos
    </h2>
    <div class="flex-1 flex flex-col overflow-auto p-2 dark:bg-black/30 bg-neutral-200 rounded-md ">
      <component_project_list />
    </div>
  </div>
</template>

<script setup lang="ts">
import component_project_list from './components/component_project_list.vue'
</script>


<style scoped>
.project-options {
  background-color: var(--color-background);
  border-radius: 20px;
  padding: 10px;
}
</style>