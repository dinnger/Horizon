<template>
  <div class=" flex flex-col h-full">
    <h2 class="text-xl mb-5">
      <span class="text-xl pl-2 pr-2 mdi mdi-package-variant"></span> Despliegues
    </h2>
    <div class="flex-1 overflow-auto h-full p-2 bg-neutral-950/10">
      <listDeploy />
    </div>
  </div>
</template>

<script setup lang="ts">
import listDeploy from './components/deploy/list.deploy.vue'
</script>