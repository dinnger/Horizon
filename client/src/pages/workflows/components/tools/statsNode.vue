<template>
  <div ref="consoleRef" class="bg-black/10 flex-1 p-2 rounded-md overflow-auto">
    {{consoleData}}

    {{ totalTime }}
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { NCode } from "naive-ui";
import { useSocket } from "../../../../stores/socket";
const store = useSocket();

const consoleData = ref<{executeTime:number,length:number}>({
  executeTime:0,
  length:0
})
const consoleRef = ref<HTMLDivElement>();


const totalTime = computed(() => {
  if (!consoleData.value.length) return "0 ms";
  const avgMs = (consoleData.value.executeTime ) / consoleData.value.length;
  if (avgMs < 1000) return `${avgMs.toFixed(2)} ms`;
  if (avgMs < 60000) return `${(avgMs / 1000).toFixed(2)} s`;
  return `${(avgMs / 60000).toFixed(2)} min`;
});


onMounted(() => {
  store.socketOn("statsNode", (value: any) => {
    consoleData.value = value;
  });
});
</script>
