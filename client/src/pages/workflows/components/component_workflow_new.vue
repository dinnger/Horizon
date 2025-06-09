<template>
  <div class="absolute  dark:bg-neutral-900 bg-white  p-4 w-72 rounded-xl overflow-hidden" @mouseup.prevent.stop
    :style="{ top: pos_top, left: pos_left }">
    <CustomField ref="input_search" class="mb-2" type="string" placeholder="Buscar nodo" v-model:value="search" />
    <div class="overflow-y-auto h-52 p-2">
      <div v-for="(items, type) in nodesList" :key="type" class="">
        <div class="mt-2">
          {{ type }}
        </div>
        <div class="">
          <div v-for="item in items" :key="item.name" @click="canvasAddNode(item)"
            class="flex items-center cursor-pointer bg-black/20 p-1 pl-2 rounded-md mb-1">
            <span class="material-icons text-lg ">{{ item.icon }}</span>
            <span class="ml-2 text-sm">{{ item.name }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ICanvasPoint, INode, INodeNew } from '@shared/interfaces/workflow.interface.js';
import type { Canvas } from '../utils/canvas';
import { onMounted, ref } from 'vue';
import { computed } from 'vue';
import CustomField from '../../../shared/components/customField.vue';

const props = defineProps<{
  new_node_start: { pos: ICanvasPoint; relative_pos: ICanvasPoint; node: INode, output_index: number }
  data_nodes: INodeNew[]
  canvasInstance: Canvas
}>()
const search = ref('')
const input_search = ref<HTMLInputElement | null>(null)

const is_canvas_width = computed(() => {
  return props.canvasInstance.canvasWidth > (props.new_node_start?.pos.x || 0) + 288
})

const is_canvs_height = computed(() => {
  return props.canvasInstance.canvasHeight > (props.new_node_start?.pos.y || 0) + 288
})

const pos_top = computed(() => {
  if (!is_canvs_height.value) return `${(props.new_node_start?.pos.y || 0) - 270}px`
  return `${(props.new_node_start?.pos.y || 0) - 1}px`
})
const pos_left = computed(() => {
  if (!is_canvas_width.value) return `${(props.new_node_start?.pos.x || 0) - 288}px`
  return `${props.new_node_start?.pos.x || 0}px`
})

const nodesList = computed(() => {
  // agrupar por type description
  const nodesGrouped: { [key: string]: INodeNew[] } = {}
  for (const node of props.data_nodes) {
    if (node.typeDescription === undefined) continue
    if (!nodesGrouped[node.typeDescription]) nodesGrouped[node.typeDescription] = []
    nodesGrouped[node.typeDescription].push(node)
  }
  // search
  for (const key in nodesGrouped) {
    let searchGroup = false
    if (key.toLocaleLowerCase().includes(search.value.toLocaleLowerCase())) searchGroup = true
    nodesGrouped[key] = nodesGrouped[key].filter(f => f.name.toLocaleLowerCase().includes(search.value.toLocaleLowerCase()) || searchGroup)
  }
  // eliminar los que no tienen nodos
  for (const key in nodesGrouped) {
    if (nodesGrouped[key].length === 0) delete nodesGrouped[key]
  }

  return nodesGrouped
})


const canvasAddNode = (item: INodeNew) => {
  console.log(item)
  if (item.inputs && item.inputs.length === 0) return
  const new_node = props.canvasInstance.actionAddNode({
    ...item,
    x: props.new_node_start.relative_pos.x,
    y: props.new_node_start.relative_pos.y - 30,
    isManual: true
  })
  props.canvasInstance.actionAddConnection({
    id_node_origin: props.new_node_start.node.id,
    output: props.new_node_start.node.outputs[props.new_node_start.output_index],
    id_node_destiny: new_node,
    input: item.inputs ? item.inputs[0] : '',
    isManual: true
  })

  props.canvasInstance.event_mouse_end()
}

onMounted(() => {
  if (input_search.value) {
    input_search.value.focus()
  }
})

</script>