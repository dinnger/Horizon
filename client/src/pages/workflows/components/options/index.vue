<template>
  <!-- <NButtonGroup class="gap-1"> -->
  <div class="join ">
    <Component_Config ref="config" :properties="properties" :listDeploy="listDeploy" :workflow="workflow"
      @saveConfig="saveConfig" />
    <button @click="deploy" class="btn btn-soft" :loading="deployLoading">
      <span class=" mdi mdi-package-variant mr-1"></span>
    </button>
    <button @click="save" class="btn  btn-primary" :loading="saveLoading">
      <span class=" mdi mdi-content-save mr-1"></span>
    </button>
  </div>
  <!-- </NButtonGroup> -->

</template>

<script setup lang="ts">
import type { Canvas } from '../../utils/canvas'
import { useSocket } from '../../../../stores/socket'
import { toast } from 'vue-sonner'
import { onMounted, ref } from 'vue'
// biome-ignore lint/style/useImportType: <explanation>
import Component_Config from './config.vue'
import type { IWorkflow } from '@shared/interface/workflow.interface'

const socket = useSocket()
const props = defineProps<{
  workflow: IWorkflow
  canvasInstance: Canvas
}>()
const config = ref<InstanceType<typeof Component_Config>>()
const saveLoading = ref(false)
const deployLoading = ref(false)
const properties = ref<IWorkflow['properties']>({
  basic: {
    router: '/'
  },
  deploy: null
})
const listDeploy = ref<{ label: string; value: number }[]>([])

const deploy = async () => {
  if (!props.canvasInstance) return
  socket.socketEmit(
    'server/global/deploy/queue/new',
    { uid: props.workflow.uid, properties: properties.value },
    (value: { error?: string; msg?: string }) => {
      if (value.error) return toast.error(value.error)
      toast.success(value?.msg || 'Despliegue iniciado exitosamente')
    }
  )
}

const loadProperties = () => {
  properties.value = props.workflow.properties
}

const loadDeploy = () => {
  socket.socketEmit('server/global/deploy/list', {}, (value: { error?: string; deploys?: any }) => {
    if (value.error) return toast.error(value.error)
    listDeploy.value = value.deploys.map((f: any) => {
      return {
        label: f.name,
        value: f.id
      }
    })
  })
}

const saveConfig = ({ data }: { data: IWorkflow['properties'] }) => {
  properties.value.basic = data.basic
  properties.value.deploy = data.deploy

  socket.socketEmit(
    'server/workflows/virtual/property',
    { flow: props.workflow.uid, properties: properties.value },
    (value: { error?: string }) => {
      if (value.error) return toast.error(value.error)
    }
  )
}

const save = () => {
  if (!props.canvasInstance) return
  saveLoading.value = true
  console.log(props.workflow)
  return new Promise((resolve) => {
    socket.socketEmit(
      'server/workflows/save',
      {
        uid: props.workflow.uid,
        properties: properties.value
      },
      (value: { error?: string; msg?: string }) => {
        saveLoading.value = false
        if (value.error) {
          resolve(true)
          return toast.warning(value.error)
        }
        toast.success(value?.msg || 'Workflow guardado exitosamente')
        resolve(true)
      }
    )
  })
}

onMounted(() => {
  loadProperties()
  loadDeploy()
})
</script>