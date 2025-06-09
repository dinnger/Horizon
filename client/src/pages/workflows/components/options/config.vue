<template>
  <dialog id="my_modal_1" class="modal" :class="{ 'modal-open': show }">
    <div class="modal-box w-11/12 max-w-xl">
      <h3 class="text-lg font-bold">Configuración</h3>
      <div class="border-b border-neutral-600/40 mb-2 mt-2"></div>
      <div class="flex flex-col gap-2 ">
        <div class="flex-1">
          <div class="tabs tabs-border">
            <label class="tab">
              <input type="radio" name="my_tabs_4" :checked="true" />
              <span class="mdi mdi-cog text-lg mr-2"></span> Básico
            </label>
            <div class="tab-content p-2 bg-neutral-950/10 ">
              <div class="flex flex-col gap-2">
                <CustomField v-model:value="propertiesInfo.basic.router" name="Ruta Base" type='string'
                  class="w-full" />
                <CustomField v-model:value="envs" name="Variables" type='code' lang='json' />
              </div>
            </div>

            <label class="tab">
              <input type="radio" name="my_tabs_4" />
              <span class="mdi mdi-package-variant text-lg mr-2"></span> Despliegue
            </label>
            <div class="tab-content p-2 bg-neutral-950/10 ">
              <div class="flex flex-col gap-2">
                <CustomField v-model:value="propertiesInfo.deploy" name="Despliegue" type='options'
                  :options="listDeploy" class="w-full" />
              </div>
            </div>
          </div>
        </div>
        <div class="flex justify-between mt-4 ">
          <CustomButton @click="show = false">Cerrar</CustomButton>
          <CustomButton permission="change_config" type="success" @click="save">Guardar</CustomButton>
        </div>
      </div>
    </div>

    <form method="dialog" class="modal-backdrop">
      <button @click="show = false">close</button>
    </form>
  </dialog>
  <button class="btn btn-soft  " @click="show_config">
    <span class="mdi mdi-cog mr-1"></span>
  </button>
</template>

<script setup lang="ts">
import type { IWorkflowProperties } from '../../../../../../shared/interfaces/workflow.interface.js'
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import type { IWorkflowWorkerEntity } from '@shared/interfaces/workflow.interface.js'
import CustomButton from '../../../../shared/components/customButton.vue'
import CustomField from '../../../../shared/components/customField.vue'

const emit = defineEmits(['saveConfig'])
const props = defineProps<{
  properties: IWorkflowProperties
  listDeploy: { label: string; value: number }[]
  workflow: IWorkflowWorkerEntity
}>()
const show = ref(false)

const propertiesInfo = ref<IWorkflowProperties>({
  basic: {
    router: '/',
    variables: {}
  },
  deploy: null
})
const envs = ref<string>('{\n}')

const show_config = () => {
  if (props.properties) {
    propertiesInfo.value.basic = props.properties.basic
    propertiesInfo.value.deploy = props.properties.deploy
    propertiesInfo.value.basic.variables = props.properties.basic.variables
    envs.value = props.properties.basic.variables && typeof props.properties.basic.variables === 'object' ? JSON.stringify(props.properties.basic.variables, null, 2) : '{\n}'
  }
  show.value = true
}

const save = () => {
  try {
    const validVariables = JSON.parse(envs.value as string)
    if (typeof validVariables !== 'object') {
      return toast.error('Las variables deben ser un objeto JSON')
    }
  } catch (error) {
    return toast.error('Las variables deben ser un objeto JSON')
  }
  propertiesInfo.value.basic.variables = JSON.parse(envs.value as string)
  emit('saveConfig', {
    data: propertiesInfo.value
  })
  show.value = false
}
</script>