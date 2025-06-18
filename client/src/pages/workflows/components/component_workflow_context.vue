<template>
  <div ref="contextual" class="absolute dark:bg-neutral-900 bg-white p-4 w-60 rounded-xl overflow-hidden"
    @mouseup.prevent.stop :style="{ top: pos_top, left: pos_left }">
    <div v-if="!Array.isArray(node)" class="text-sm">
      <span class="material-icons text-xl" :style="{ color: node.info.color }">
        {{ node.info.icon }}
      </span>
      <span class="ml-2 text-md" :style="{ color: node.info.color }">{{ node.info.name }}</span>
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
    <div v-else class="text-sm">
      <span class="mdi mdi-book-multiple-outline text-[20px]"></span>
      <span class="ml-2 text-md">
        Multiples Nodos
      </span>
      <hr class="border-neutral-800 mt-1 mb-1" />
      <div class="flex gap-2 hover:bg-black/20 p-1 rounded-md cursor-pointer" @click="duplicateNodes">
        <span class="mdi mdi-content-copy"></span> Duplicar
      </div>
      <hr class="opacity-50 border-neutral-800 mt-1 mb-1" />

      <div class="flex gap-2 hover:bg-black/20 p-1 rounded-md cursor-pointer text-error" @click="deleteNodes">
        <span class="mdi mdi-delete"></span> Eliminar
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { computed } from "vue";
import { toast } from "vue-sonner";
import type { ICanvasNodeNew } from "../utils/canvasNodes";
import type { INodeCanvas } from "@shared/interface/node.interface";

// const workflow = useWorkflow();
const props = defineProps<{
  selectedContext: ICanvasNodeNew[]
  selectedCanvasTranslate?: INodeCanvas['design']
}>();

const emit = defineEmits(['onRefresh'])

const contextual = ref<HTMLDivElement>();

const node = computed<ICanvasNodeNew | ICanvasNodeNew[]>(() => {
  console.log(props.selectedContext)
  if (props.selectedContext.length === 1) return props.selectedContext[0];
  return props.selectedContext;
});

const pos_top = computed(() => {
  const y = (Array.isArray(node.value) ? node.value[0].design.y : node.value.design.y) + ((props.selectedCanvasTranslate?.y ?? 0) | 0) + 10
  return `${y}px`;
});

const pos_left = computed(() => {
  const x = (Array.isArray(node.value) ? node.value[0].design.x : node.value.design.x) + (props.selectedCanvasTranslate?.x ?? 0) + 10
  return `${x}px`;
});

const dataNode = () => {

  // if (!Array.isArray(node.value)) {
  //   workflow.dataNode = node.value;
  //   // props.canvasInstance.actionNode('dataNode', node.value);
  // }
};

const statsNode = () => {
  // if (!Array.isArray(node.value)) {
  //   workflow.statsNode = node.value;
  //   // props.canvasInstance.actionNode('statsNode', node.value);
  // }
};

const deleteNode = () => {
  if (!Array.isArray(node.value)) {
    node.value.delete()
  }
  emit('onRefresh')
};

const duplicateNode = () => {
  if (!Array.isArray(node.value)) {
    node.value.duplicate()
  }
  emit('onRefresh')
};

const deleteNodes = () => {
  if (Array.isArray(node.value)) {
    for (const item of node.value) {
      item.delete()
    }
    emit('onRefresh')
  }
};

const duplicateNodes = () => {
  if (Array.isArray(node.value)) {
    node.value[0].duplicateMultiple()
    emit('onRefresh')
  }
  toast.success("Nodo duplicado exitosamente");
};

onMounted(() => {
  // canvas_position.value = props.canvasInstance.canvasPosition;
});
</script>
