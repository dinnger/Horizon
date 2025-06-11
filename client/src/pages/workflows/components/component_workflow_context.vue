<template>
  <div ref="contextual" class="absolute dark:bg-neutral-900 bg-white p-4 w-60 rounded-xl overflow-hidden"
    @mouseup.prevent.stop :style="{ top: pos_top, left: pos_left }">
    <div v-if="!Array.isArray(node)" class="text-sm">
      <span class="material-icons text-md" :style="{ color: node.color }">{{
        node.icon
      }}</span>
      <span class="ml-2" :style="{ color: node.color }">{{ node.name }}</span>
      <hr class="border-neutral-800 mt-1 mb-1" />
      <!-- Eliminar -->
      <template v-if="node.type !== 'workflow_init'">
        <div class="flex gap-2 hover:bg-black/20 p-1 rounded-md cursor-pointer" @click="dataNode">
          <span class="mdi mdi-magnify"></span>
          Visualizar Datos
        </div>
        <div class="flex gap-2 hover:bg-black/20 p-1 rounded-md cursor-pointer" @click="statsNode">
          <span class="mdi mdi-finance"></span>
          Visualizar Estadísticas
        </div>
        <hr class="opacity-50 border-neutral-800 mt-1 mb-1" />
        <div class="flex gap-2 hover:bg-black/20 p-1 rounded-md cursor-pointer" @click="duplicateNode">
          <span class="mdi mdi-content-copy"></span> Duplicar
        </div>

        <div class="flex gap-2 hover:bg-black/20 p-1 rounded-md cursor-pointer text-error" @click="deleteNode">
          <span class="mdi mdi-delete"></span> Eliminar
        </div>
      </template>
    </div>
    <div v-else>
      <span class="mdi mdi-book-multiple-outline"></span> Multiples Nodos
      <hr class="border-neutral-800 mt-1 mb-1" />
      <div class="flex gap-2 hover:bg-black/20 p-1 rounded-md cursor-pointer" @click="duplicateNodes">
        <span class="mdi mdi-content-copy"></span> Duplicar
      </div>
      <hr class="opacity-50 border-neutral-800 mt-1 mb-1" />
      <div class="flex gap-2 hover:bg-black/20 p-1 rounded-md cursor-pointer" @click="deleteNodes">
        <span class="mdi mdi-delete"></span> Eliminar
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  ICanvasPoint,
  INode,
} from "@shared/interfaces/workflow.interface";
import type { Canvas } from "../utils/canvas";
import { onMounted, ref, watch } from "vue";
import { computed } from "vue";
import { toast } from "vue-sonner";
import { useWorkflow } from "../../../stores/workflow";
import type { INodeCanvas } from "@shared/interface/node.interface";

const workflow = useWorkflow();
const props = defineProps<{
  canvasInstance: Canvas;
}>();
const contextual = ref<HTMLDivElement>();
const canvas_position = ref<ICanvasPoint>({ x: 0, y: 0 });

const is_canvas_width = computed(() => {
  return (
    props.canvasInstance.canvasWidth >
    (canvas_position.value.x || 0) + (contextual.value?.clientWidth || 0)
  );
});

const is_canvs_height = computed(() => {
  return (
    props.canvasInstance.canvasHeight >
    (canvas_position.value.y || 0) + (contextual.value?.clientHeight || 0)
  );
});

const pos_top = computed(() => {
  if (!is_canvs_height.value)
    return `${(canvas_position.value.y || 0) - (contextual.value?.clientHeight || 0)
      }px`;
  return `${(canvas_position.value.y || 0) - 1}px`;
});
const pos_left = computed(() => {
  if (!is_canvas_width.value)
    return `${(canvas_position.value.x || 0) - (contextual.value?.clientWidth || 0)
      }px`;
  return `${canvas_position.value.x || 0}px`;
});

const node = computed<INodeCanvas | INodeCanvas[]>(() => {
  const arr = Array.from(props.canvasInstance.selectedNode.values()).map(
    (value) => value.node
  );
  if (arr.length === 1) return arr[0];
  return arr;
});

watch(props.canvasInstance.selectedNode, () => {
  canvas_position.value = props.canvasInstance.canvasPosition;
});

const dataNode = () => {
  if (!Array.isArray(node.value)) {
    workflow.dataNode = node.value;
    props.canvasInstance.actionNode('dataNode', node.value);
  }
};

const statsNode = () => {
  if (!Array.isArray(node.value)) {
    workflow.statsNode = node.value;
    props.canvasInstance.actionNode('statsNode', node.value);
  }
};

const deleteNode = () => {
  if (!Array.isArray(node.value)) {
    props.canvasInstance.actionNode('removeNode', node.value);
  }
};

const duplicateNode = () => {
  if (!Array.isArray(node.value)) {
    props.canvasInstance.actionNode('duplicateNode', node.value);
  }
};

const deleteNodes = () => {
  for (const node of Array.from(props.canvasInstance.selectedNode.values())) {
    if (node.node.type === "workflow_init") continue;
    props.canvasInstance.actionNode('removeNode', node.node);
  }
};

const duplicateNodes = () => {
  props.canvasInstance.actionNode(
    'duplicateNode',
    Array.from(props.canvasInstance.selectedNode.values()).map(m => m.node).filter(f => f.type !== 'workflow_init')
  );
  toast.success("Nodo duplicado exitosamente");
};

onMounted(() => {
  canvas_position.value = props.canvasInstance.canvasPosition;
});
</script>
