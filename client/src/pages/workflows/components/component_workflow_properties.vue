<template>
  <div v-if="props.selected.length > 0"
    class="absolute top-4 right-4 bottom-4  dark:bg-neutral-900 bg-white  w-[340px] rounded-xl box-content"
    :style="{ border: `1px solid  ${selectedNode.info.color}` }">
    <div v-if="props.selected.length === 1" class="flex flex-col h-full relative">
      <div class="pl-4 pt-4 pr-4 pb-1 rounded-tl-md rounded-tr-md" :style="{ color: selectedNode.info.color }">
        <div class="flex w-full items-center gap-2">
          <!-- {{ selectedNode.inputs }} -->
          <div class="material-icons text-[36px] background-active self-start p-0" style="line-height: 32px;">
            {{ selectedNode.info.icon }}
          </div>
          <div class="flex-1   text-lg">
            <div class="join w-full h-[32px] ">
              <CustomField ref="input_name" v-model:value="name" type="string" :disabled="lock_name" :maxlength="15"
                @blur="name = name.trim()" @focus="input_name.select()" @keyup="name = utilsStandardName(name)"
                @keydown.enter="change_name" />

              <button v-if="lock_name" class="btn join-item btn-sm btn-primary" @click="enable_name()"><span
                  class="mdi mdi-pencil"></span></button>
              <button v-else class="btn join-item btn-sm btn-success" @click="change_name"><span
                  class="mdi mdi-floppy"></span>
              </button>
            </div>
            <div class="text-ellipsis overflow-hidden text-nowrap text-[11px]">
              Ver documentación
            </div>
          </div>
        </div>
        <span class="text-red-500 text-[11px] mdi mdi-alert" v-if="error_name !== ''">
          <span class="pl-2">{{ error_name }}</span></span>
      </div>

      <div class="flex-1 overflow-auto border-t border-neutral-800 pl-2 pr-2 pb-2">
        <div class="tabs tabs-border w-fuil h-full ">
          <label class="tab">
            <input type="radio" name="my_tabs_4" :checked="true" />
            <span class="mdi mdi-hammer-screwdriver text-lg " style="line-height: 20px;"></span>
          </label>
          <div class="tab-content p-2 bg-neutral-950/10 h-full overflow-auto " v-if="selectedNode.properties">
            <CustomFields :value="selectedNode.properties" @button:click="handleButtonClick" />
          </div>

          <label class="tab">
            <input type="radio" name="my_tabs_4" />
            <span class="mdi mdi-file-code-outline text-lg" style="line-height: 20px;"></span>
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
import type { ICanvasNodeNew } from '../utils/canvasNodes.js'
import { computed, onMounted, ref, watch } from 'vue'
import { utilsStandardName } from '../../../shared/utils'
import { useSocket } from '../../../stores/socket'
import { useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import CustomField from '../../../shared/components/customField.vue'
import CustomFields from '../../../shared/components/customFields.vue'

const route = useRoute()
const socket = useSocket()

const props = defineProps<{
  selected: ICanvasNodeNew[]
}>()

const input_name = ref()
const name = ref('')
const lock_name = ref(true)
const error_name = ref('')

const selectedNode = computed<ICanvasNodeNew>(() => {
  return props.selected[0] as ICanvasNodeNew
})

watch(props.selected, (value) => {
  if (value.length > 0) {
    const node = Array.from(value.values())
    name.value = node[0].info.name
  }
})

const enable_name = () => {
  lock_name.value = !lock_name.value
  setTimeout(() => {
    input_name.value.focus()
  }, 100)
}

const change_name = () => {
  const validName = selectedNode.value.changeName(name.value)
  if (!validName) return
  lock_name.value = true
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
  name.value = selectedNode.value.info.name
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