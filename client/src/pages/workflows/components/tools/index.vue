<template>
  <div class="flex flex-col gap-2 h-full" v-show="toolSelect">
    <div class="flex gap-2 mt-2">
      <h3
        v-for="item in options"
        :key="item.key"
        class="text-[12px] cursor-pointer pl-2 pr-2 rounded-bl-md rounded-br-md"
        :class="{ 'text-primary': toolSelect.key === item.key }"
        @click="toolSelect = item"
      >
        <span class="material-icons">{{ item?.icon }}</span>
        {{ item?.label }}
      </h3>
    </div>
    <div class="h-full flex w-full overflow-hidden">
      <component_logger
        v-show="toolSelect.key === 'logger'"
        :canvasInstance="props.canvasInstance"
      />
      <component_debug
        v-show="toolSelect.key === 'debug'"
        :canvasInstance="props.canvasInstance"
      />
      <component_stats
        v-show="toolSelect.key === 'stats'"
        :canvasInstance="props.canvasInstance"
      />
      <component_dataNode
        v-show="toolSelect.key === 'data'"
        :canvasInstance="props.canvasInstance"
      />
      <component_statsNode
        v-show="toolSelect.key === 'statsNode'"
        :canvasInstance="props.canvasInstance"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Canvas } from "../../utils/canvas";
import component_logger from "./logger.vue";
import component_debug from "./debug.vue";
import component_stats from "./stats.vue";
import component_dataNode from "./dataNode.vue";
import component_statsNode from "./statsNode.vue";
import { ref } from "vue";
import { useWorkflow } from "../../../../stores/workflow";
import { watch } from "vue";

interface ITool {
  label: string;
  key: string;
  icon: string;
}

const workflow = useWorkflow();
const props = defineProps<{
  canvasInstance: Canvas;
}>();
const options = ref<ITool[]>([
  {
    label: "Logs",
    key: "logger",
    icon: "󰆍",
  },
  {
    label: "Debug",
    key: "debug",
    icon: "󰃤",
  },
  {
    label: "Estadísticas",
    key: "stats",
    icon: "󰱐",
  },
]);
const toolSelect = ref<ITool>(options.value[0]);

watch(
  () => workflow.dataNode,
  (value) => {
    options.value = options.value.filter((f) => f.key !== "data");
    if (value) {
      options.value.push({
        label: "Datos del nodo",
        key: "data",
        icon: "󰆍",
      });
      toolSelect.value = options.value[options.value.length - 1];
    } else {
      toolSelect.value = options.value[0];
    }
  }
);

watch(
  () => workflow.statsNode,
  (value) => {
    options.value = options.value.filter((f) => f.key !== "statsNode");
    if (value) {
      options.value.push({
        label: "Estadísticas del nodo",
        key: "statsNode",
        icon: "󰱐",
      });
      toolSelect.value = options.value[options.value.length - 1];
    } else {
      toolSelect.value = options.value[0];
    }
  }
);
</script>
