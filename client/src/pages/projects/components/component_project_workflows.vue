<template>

  <dialog id="my_modal_1" class="modal" :class="{ 'modal-open': data_workflow.show }">
    <div class="modal-box">
      <h3 class="text-lg font-bold">Nuevo Workflow</h3>
      <div class="border-b border-neutral-600/40 mb-2 mt-2"></div>
      <div class="flex flex-col gap-2">
        <CustomField v-model:value="data_workflow.name" name="Nombre" type="string" placeholder="Nombre del workflow"
          class="w-full" />
        <CustomField v-model:value="data_workflow.description" name="Descripción" type="textarea"
          placeholder="Descripción del workflow" class="w-full" />
      </div>
      <div class="flex justify-between mt-4">
        <button class="btn" @click="data_workflow.show = false">
          Cancelar
        </button>
        <button class="btn btn-primary" @click="new_workflow">
          Crear Workflow
        </button>
      </div>
    </div>
  </dialog>

  <div class="p-3 background  rounded-md h-[80px] mb-4 flex  gap-4">
    <CustomField v-model:value="filter" type="string" :placeholder="`Buscar Workflows`" class="w-full" />
    <button class="btn join-item btn-sm btn-primary" @click="data_workflow.show = true">
      Nuevo Workflow
    </button>
  </div>
  <component_project_workflows_list ref="workflows_list" :project="props.project" />
</template>

<script setup lang="ts">
import type { Interface_Project } from '../../../shared/interfaces/interface_project';
// biome-ignore lint/style/useImportType: <explanation>
import component_project_workflows_list from './component_project_workflows_list.vue';
import { ref } from 'vue';
import { useSocket } from '../../../stores/socket';
import CustomField from '../../../shared/components/customField.vue';

const socket = useSocket()
const props = defineProps<{
  project: Interface_Project
}>()

const workflows_list = ref<InstanceType<typeof component_project_workflows_list>>()
const data_workflow = ref({
  show: false,
  name: '',
  description: ''
})
const filter = ref('')


const new_workflow = () => {
  socket.socketEmit('server/workflows/new', {
    id_project: props.project.id,
    name: data_workflow.value.name,
    description: data_workflow.value.description,
    flow: null
  }, (value: { error?: string }) => {
    if (value.error) return console.log(value.error)
    if (workflows_list.value) workflows_list.value.get_workflows()
  })
  data_workflow.value.show = false
}

</script>

<style scoped>
div>div {
  /* height: 200px; */
  position: relative;
  overflow: hidden;
}

div>div>.mdi {
  font-size: 160px;
  position: absolute;
  top: -80px;
  opacity: 0.05;
  right: -20px;
}
</style>