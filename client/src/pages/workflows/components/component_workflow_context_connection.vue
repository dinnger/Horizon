<template>
  <div ref="contextual" class="absolute  dark:bg-neutral-900 bg-white  p-4 w-52 rounded-xl overflow-hidden"
    @mouseup.prevent.stop :style="{ top: pos_top, left: pos_left }">
    <div>
      <div class="flex gap-1">
        <div class="flex">
          <span class="material-icons text-md" :style="{ color: node_origin?.info?.color }">
            {{ node_origin?.info?.icon }}
          </span>
          <div class="w-14 text-ellipsis overflow-hidden text-nowrap" :style="{ color: node_origin?.info?.color }">{{
            node_origin?.info?.name }}
          </div>
        </div>
        <span class="mdi mdi-arrow-right-bold-circle-outline text-xl"></span>
        <div class="flex">
          <span class="material-icons text-md" :style="{ color: node_destiny?.info?.color }">
            {{ node_destiny?.info?.icon }}
          </span>
          <div class="w-14 text-ellipsis overflow-hidden text-nowrap" :style="{ color: node_destiny?.info?.color }">
            {{
              node_destiny?.info?.name }}
          </div>
        </div>
      </div>
      <hr class="border-neutral-800 mt-1 mb-1">
      <!-- Eliminar -->
      <div class="flex gap-2 hover:bg-black/20 p-1 rounded-md cursor-pointer" @click="delete_connect">
        <span class="mdi mdi-delete"></span> Eliminar
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Canvas } from '../utils/canvas';
import type { INodeCanvas } from '@shared/interface/node.interface.js';
import { onMounted, ref, watch } from 'vue';
import { computed } from 'vue';

const props = defineProps<{
  canvasInstance: Canvas,
  connection_properties_context: {
    id: string;
    nodeOrigin: INodeCanvas;
    nodeDestiny: INodeCanvas;
    input: string;
    output: string;
  }
}>()
const contextual = ref<HTMLDivElement>()
const canvas_position = ref<{ x: number; y: number }>({ x: 0, y: 0 })

const node_origin = ref(props.connection_properties_context?.nodeOrigin)
const node_destiny = ref(props.connection_properties_context?.nodeDestiny)

const is_canvas_width = computed(() => {
  return props.canvasInstance.canvasWidth > (canvas_position.value.x || 0) + (contextual.value?.clientWidth || 0) + 10
})

const is_canvs_height = computed(() => {
  return props.canvasInstance.canvasHeight > (canvas_position.value.y || 0) + (contextual.value?.clientHeight || 0)
})

const pos_top = computed(() => {
  if (!is_canvs_height.value) return `${(canvas_position.value.y || 0) - (contextual.value?.clientHeight || 0) - 10}px`
  return `${(canvas_position.value.y || 0) - 1}px`
})
const pos_left = computed(() => {
  if (!is_canvas_width.value) return `${(canvas_position.value.x || 0) - (contextual.value?.clientWidth || 0)}px`
  return `${canvas_position.value.x || 0}px`
})


watch(() => props.connection_properties_context, (value) => {
  node_origin.value = value.nodeOrigin
  node_destiny.value = value.nodeDestiny
  canvas_position.value = props.canvasInstance.canvasPosition
})

const delete_connect = () => {
  props.canvasInstance.actionDeleteConnectionById({ id: props.connection_properties_context.id })

}

onMounted(() => {
  canvas_position.value = props.canvasInstance.canvasPosition
})

</script>