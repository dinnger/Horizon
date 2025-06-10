<template>
  <div v-if="props.selected.length > 0"
    class="absolute top-4 right-4 bottom-4  dark:bg-neutral-900 bg-white  w-[340px] rounded-xl box-content"
    :style="{ border: `1px solid  ${selectedNode.color}` }">
    <div v-if="props.selected.length === 1" class="flex flex-col h-full relative">


      <div class="p-4 rounded-tl-md rounded-tr-md" :style="{ color: selectedNode.color }">
        <div class="flex w-full items-center gap-2">
          <!-- {{ selectedNode.inputs }} -->
          <div class="material-icons text-3xl background-active">
            {{ selectedNode.icon }}
          </div>
          <div class="flex-1  w-1 text-lg">
            <div class="join">
              <CustomField ref="input_name" v-model:value="name" type="string" :disabled="lock_name" :maxlength="15"
                @blur="name = name.trim()" @focus="input_name.select()" @keyup="name = utilsStandardName(name)"
                @keydown.enter="change_name" />

              <button v-if="lock_name" class="btn join-item btn-sm btn-primary" @click="enable_name()"><span
                  class="mdi mdi-pencil"></span></button>
              <button v-else class="btn join-item btn-sm btn-success" @click="change_name"><span
                  class="mdi mdi-floppy"></span>
              </button>
            </div>

            <div class="text-ellipsis overflow-hidden text-nowrap text-sm mt-2">
              Ver documentación
            </div>
          </div>
        </div>
        <span class="text-red-500 text-[11px] mdi mdi-alert" v-if="error_name !== ''">
          <span class="pl-2">{{ error_name }}</span></span>
      </div>

      <div class="flex-1 overflow-auto border-t border-neutral-800 p-4">

        <div class="tabs tabs-border w-fuil ">
          <label class="tab">
            <input type="radio" name="my_tabs_4" :checked="true" />
            <span class="mdi mdi-hammer-screwdriver text-lg"></span>
          </label>
          <div class="tab-content p-2 bg-neutral-950/10 " v-if="selectedNode.properties">
            <CustomFields :value="selectedNode.properties" @change="changeProperties"
              @button:click="handleButtonClick" />
          </div>

          <label class="tab">
            <input type="radio" name="my_tabs_4" />
            <span class="mdi mdi-file-code-outline text-lg"></span>
          </label>
          <div class="tab-content p-2 bg-neutral-950/10 ">
            <!-- <Logs :node="selectedNode" :canvasInstance="canvasInstance" /> -->
          </div>
        </div>

      </div>
    </div>
    <div v-else class="mt-2 text-center">
      Seleccione un nodo
    </div>
  </div>
</template>

<script setup lang="ts">
import type { INodeCanvas } from '@shared/interfaces/workflow.interface.js'
import type { Canvas } from '../utils/canvas'
import { computed, onMounted, ref, watch } from 'vue'
import { utilsStandardName, utilsValidateName } from '../../../shared/utils'
import { useSocket } from '../../../stores/socket'
import { useRoute } from 'vue-router'
import Logs from './properties/logs.vue'
import CustomField from '../../../shared/components/customField.vue'
import CustomFields from '../../../shared/components/customFields.vue'
import { toast } from 'vue-sonner'
import type { INodeCanvasNewClass } from '@shared/interface/node.interface'

const route = useRoute()
const socket = useSocket()

const props = defineProps<{
  selected: INodeCanvasNewClass[]
}>()

const input_name = ref()
const name = ref('')
const lock_name = ref(true)
const error_name = ref('')

const selectedNode = computed<INodeCanvas>(() => {
  return props.selected[0] as INodeCanvas
})

watch(props.selected, (value) => {
  if (value.length > 0) {
    const node = Array.from(value.values())
    name.value = node[0].name
  }
})

const enable_name = () => {
  lock_name.value = !lock_name.value
  setTimeout(() => {
    input_name.value.focus()
  }, 100)
}

const change_name = () => {
  const nodes = Object.values(props.canvasInstance.nodes).filter((f) => f.id !== selectedNode.value.id)

  name.value = utilsStandardName(name.value)
  const name_valid = utilsValidateName({ text: name.value, nodes })
  if (name_valid !== name.value) {
    error_name.value = 'El nombre del nodo ya existe'
  } else {
    error_name.value = ''
    lock_name.value = false
    selectedNode.value.name = name.value
    lock_name.value = !lock_name.value
  }
}

const changeProperties = ({ key, value }: { key: string; value: any }) => {
  const flow = route.params.workflow_id
  const node = selectedNode.value
  socket.socketEmit(
    'server/workflows/virtual/nodeProperty',
    { flow, node: { id: node.id, type: node.type }, key, value: value },
    (value: { error?: string } & any[]) => {
      if (value?.error) return console.log(value.error)
      if (!value || typeof value !== 'object' || Object.keys(value).length === 0) return

      // inputs/outputs
      const inputs = value.find((item: any) => item.key === '_inputs_')
      const outputs = value.find((item: any) => item.key === '_outputs_')
      if (inputs) {
        selectedNode.value.inputs = inputs.value
        selectedNode.value.update()
      }
      if (outputs) {
        selectedNode.value.outputs = outputs.value
        selectedNode.value.update()
        selectedNode.value.updateConnectionsOutput({
          before: outputs.before,
          after: outputs.value
        })
      }

      for (const item of value) {
        let property: any = selectedNode.value?.properties || {}
        const keys = item.key.split('.')
        if (keys.length > 1 && keys[0] === '_') keys.shift()
        for (let i = 0; i < keys.length - 1; i++) {
          property = property[keys[i]]
        }
        if (keys.length > 1) {
          property[keys[keys.length - 1]] = item.value
        }
      }
    }
  )
}

const handleButtonClick = (e: any) => {
  const flow = route.params.workflow_id
  const node = selectedNode.value
  socket.socketEmit('server/workflows/virtual/action', { flow, node: { id: node.id, type: node.type }, action: e.action }, (value) => {
    if (value.error) {
      toast.error(value.error.join(' -- '))
    } else {
      toast.success('Esquema validado correctamente')
    }
  })
}

onMounted(() => {
  name.value = selectedNode.value.name
})
</script>

<style>
.n-tabs-tab-pad {
  width: 10px !important;
}

.n-tabs .n-tabs-tab {
  padding: 0px !important;
}
</style>