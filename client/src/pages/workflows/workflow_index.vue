<template>
  <div class="flex flex-col h-full" v-if="data_workflow && data_nodes">
    <div class="flex justify-between">
      <h2 class="text-xl mb-2">
        {{ data_workflow.name }}
        <div class="text-sm opacity-80 flex overflow-hidden text-nowrap text-ellipsis">
          {{ data_workflow.description }} | <span class="text-cyan-600">
            Proyecto: {{ data_workflow?.project?.name }}
          </span>
          <div class="flex gap-2">
          </div>
        </div>
      </h2>
      <component_workflow_options v-if="canvasInstance" :workflow="data_workflow" :canvasInstance="canvasInstance" />
    </div>

    <div class="flex flex-col h-full rounded-md overflow-auto p-3 dark:bg-black/30 bg-neutral-200">
      <NSplit direction="vertical" style="height: 100%" :max="1" :min="0" default-size="calc(100% - 200px)"
        @drag-end="componentCanvas ? componentCanvas.windowListenerResize() : null">
        <template #1>
          <div class="h-full flex flex-col overflow-hidden">
            <component_workflow_canvas ref="componentCanvas" :data_workflow="data_workflow" :data_nodes="data_nodes"
              @canvasInstance="canvasInstance = $event" />
          </div>
        </template>
        <template #2>
          <Component_workflow_tools v-if="canvasInstance" :canvasInstance="canvasInstance" />
        </template>
      </NSplit>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { INode } from '@shared/interface/node.interface.js';
import type { Canvas } from './utils/canvas';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { toast } from 'vue-sonner';
import { NSplit } from 'naive-ui';
// biome-ignore lint/style/useImportType: <explanation>
import component_workflow_canvas from './components/component_workflow_canvas.vue';
import Component_workflow_options from './components/options/index.vue';
import Component_workflow_tools from './components/tools/index.vue';
import { useSocket } from '../../stores/socket';

const socket = useSocket()
const route = useRoute()

const data_workflow = ref()
const data_nodes = ref<INode[]>([])
const componentCanvas = ref<InstanceType<typeof component_workflow_canvas>>()
const canvasInstance = ref<Canvas>()

const uid = route.params.workflow_id as string

onMounted(() => {
  data_nodes.value = []
  socket.socketEmit('server/workflows/initialize', { uid }, (value) => {
    console.log(value)
    socket.socketJoin(uid)
    data_workflow.value = value
    toast.success(`Workflow ${data_workflow?.value?.name} cargado exitosamente`)
  })


  socket.socketEmit('server/plugins/nodes/get', {}, (value: { nodes: any } | null) => {
    console.log(value)
    if (!value) return
    for (const node of value.nodes) {
      data_nodes.value.push({
        ...node
      })
    }
  })
})

onBeforeUnmount(() => {
  socket.socketLeave(uid)
})
</script>
