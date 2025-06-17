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
          <div v-for="item in items" :key="item.info.name" @click="canvasAddNode(item)"
            class="flex items-center cursor-pointer bg-black/20 p-1 pl-2 rounded-md mb-1">
            <span class="material-icons text-lg ">{{ item.info.icon }}</span>
            <span class="ml-2 text-sm">{{ item.info.name }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { INodeCanvas } from '@shared/interface/node.interface';
import type { Canvas } from '../utils/canvas';
import { onMounted, ref } from 'vue';
import { computed } from 'vue';
import CustomField from '../../../shared/components/customField.vue';

const props = defineProps<{
  new_node_start: { design: INodeCanvas['design']; relative_pos: INodeCanvas['design']; node: INodeCanvas, output_index: number }
  data_nodes: INodeCanvas[]
  canvasInstance: Canvas
}>()
const emit = defineEmits(['nodeCreated'])

const search = ref('')
const input_search = ref<HTMLInputElement | null>(null)

const is_canvas_width = computed(() => {
  return props.canvasInstance.canvasWidth > (props.new_node_start?.design.x || 0) + 288
})

const is_canvs_height = computed(() => {
  return props.canvasInstance.canvasHeight > (props.new_node_start?.design.y || 0) + 288
})

const pos_top = computed(() => {
  if (!is_canvs_height.value) return `${(props.new_node_start?.design.y || 0) - 270}px`
  return `${(props.new_node_start?.design.y || 0) - 1}px`
})
const pos_left = computed(() => {
  if (!is_canvas_width.value) return `${(props.new_node_start?.design.x || 0) - 288}px`
  return `${props.new_node_start?.design.x || 0}px`
})

const nodesList = computed(() => {
  // agrupar por type description
  const nodesGrouped: { [key: string]: INodeCanvas[] } = {}
  for (const node of props.data_nodes) {
    if (node.info.group === undefined) continue
    if (!nodesGrouped[node.info.group]) nodesGrouped[node.info.group] = []
    nodesGrouped[node.info.group].push(node)
  }
  // search
  for (const key in nodesGrouped) {
    let searchGroup = false
    if (key.toLocaleLowerCase().includes(search.value.toLocaleLowerCase())) searchGroup = true
    nodesGrouped[key] = nodesGrouped[key].filter(f => f.info.name.toLocaleLowerCase().includes(search.value.toLocaleLowerCase()) || searchGroup)
  }
  // eliminar los que no tienen nodos
  for (const key in nodesGrouped) {
    if (nodesGrouped[key].length === 0) delete nodesGrouped[key]
  }

  return nodesGrouped
})


const canvasAddNode = (item: INodeCanvas) => {
  if (item.info.connectors.inputs && item.info.connectors.inputs.length === 0) return
  if (!props.new_node_start.node.connections) return
  const outputName = props.new_node_start.node.info.connectors.outputs[props.new_node_start.output_index]
  const newNode = props.canvasInstance.actionAddNode({
    origin: {
      idNode: props.new_node_start.node.id!,
      connectorType: 'output',
      connectorName: outputName,
    },
    node: {
      info: item.info,
      type: item.type,
      design: {
        x: props.new_node_start.relative_pos.x,
        y: props.new_node_start.relative_pos.y - 30,
        width: 90,
        height: 90
      },
      properties: item.properties,
    },
    isManual: true,
  })
  emit('nodeCreated', newNode)
}

onMounted(() => {
  if (input_search.value) {
    input_search.value.focus()
  }
})

</script>