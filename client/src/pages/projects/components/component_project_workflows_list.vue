<template>
  <div class="project-list h-full" style="overflow: auto;">
    <table class="w-full" v-if="workflows_list.length > 0">
      <thead>
        <tr>
          <th width="60px">ID</th>
          <th>Nombre</th>
          <th width="80px">Estado</th>
          <th width="80px">Worker</th>
          <th width="150px">Creado por</th>
          <th width="100px">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr class="custom-table" v-for="workflow in workflows_list" :key="workflow.id">
          <td class="text-center">{{ workflow.id }}</td>
          <td class="relative h-12">
            <a :href="`/ui/workflows/${route.params.project_id}/${workflow.uid}`"
              class="absolute top-1 left-0 right-0 bottom-0">
              {{ workflow.name || 'Sin Nombre' }}
              <div class="description  text-[12px] text-base-content/30">
                {{ workflow.description || 'Sin descripción definida' }}
              </div>
            </a>
          </td>
          <td class="text-center cursor-auto">
            <span class="badge badge-sm badge-soft "
              :class="[workflow?.status?.name === 'Active' ? 'badge-success' : 'badge-error']">
              {{ workflow?.status?.name }}
            </span>
          </td>
          <td class="text-center cursor-auto">
            <span class="badge badge-sm badge-soft "
              :class="[workflow?.worker_status === 'Active' ? 'badge-success' : 'badge-error']">
              {{ workflow?.worker_status }}
            </span>
          </td>
          <td class="text-center cursor-auto">{{ workflow?.user?.name }}</td>
          <td class="text-center">
            <div class="dropdown dropdown-end">
              <div tabindex="0" role="button" class="btn btn-sm btn-outline btn-primary">...</div>
              <div tabindex="0" class="dropdown-content card card-sm bg-base-100 z-1 w-64 shadow-md">
                <ul class="menu dropdown-content bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
                  <div v-if="workflow?.worker_status === 'Inactive'"
                    @click="option_workflow({ workflow, option: 'start_workflow' })"
                    class="cursor-pointer hover:bg-black/10 p-2 text-left">
                    <span class="mdi mdi-play mr-2"></span>Iniciar Workflow
                  </div>
                  <div v-else @click="option_workflow({ workflow, option: 'close_workflow' })"
                    class="cursor-pointer hover:bg-black/10 p-2 text-left">
                    <span class="mdi mdi-stop mr-2"></span>Cerrar Workflow
                  </div>
                  <div class="divider p-1 m-0"></div>
                  <div @click="option_workflow({ workflow, option: 'edit_workflow' })"
                    class="cursor-pointer hover:bg-black/10 p-2 text-left">
                    <span class="mdi mdi-pencil mr-2"></span>Editar nombre
                  </div>
                  <div @click="option_workflow({ workflow, option: 'delete_workflow' })"
                    class="cursor-pointer hover:bg-black/10 p-2 text-left text-error">
                    <span class="mdi mdi-delete mr-2"></span>Eliminar Workflow
                  </div>
                </ul>
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <CustomEmpty v-else description="No existen flujos de trabajo" />

    <ModalWorkflowDelete :show="showDeleteModal" :workflowName="workflowToDelete?.name || ''"
      @close="showDeleteModal = false" @confirm="confirm_delete_workflow" />
    <ModalWorkflowEdit :show="showEditModal" :currentName="workflowToEdit?.name || ''" @close="showEditModal = false"
      @confirm="confirm_edit_workflow" />
  </div>
</template>

<script setup lang="ts">
import type { Interface_Project } from '../../../shared/interfaces/interface_project';
import type { IWorkflowWorkerEntity } from '@shared/interfaces/workflow.interface.js';
import { useRoute } from 'vue-router';
import { onMounted, ref } from 'vue';
import { useSocket } from '../../../stores/socket';
import { toast } from 'vue-sonner';
import ModalWorkflowDelete from './modal_workflow_delete.vue';
import ModalWorkflowEdit from './modal_workflow_edit.vue';
import CustomEmpty from '../../../shared/components/customEmpty.vue';
const route = useRoute()
const socket = useSocket()

const props = defineProps<{
  project: Interface_Project
}>()

interface IWorkflow extends IWorkflowWorkerEntity {
  show: boolean
}

const workflows_list = ref<IWorkflow[]>([])
const showDeleteModal = ref(false)
const showEditModal = ref(false)
const workflowToDelete = ref<IWorkflow | null>(null)
const workflowToEdit = ref<IWorkflow | null>(null)

const close_workflow = ({ workflow }: { workflow: string }) => {
  socket.socketEmit('server/worker/close', { flow: workflow }, (value: string) => {
    console.log(value)
  })
}

const delete_workflow = (workflow: IWorkflow) => {
  showDeleteModal.value = true
  workflowToDelete.value = workflow
}

const confirm_delete_workflow = () => {
  if (!workflowToDelete.value) return
  socket.socketEmit('server/workflows/delete', { uid: workflowToDelete.value.uid }, (value: { error?: string }) => {
    if (value.error) {
      toast.error(value.error)
    } else {
      toast.success('Workflow eliminado')
      workflows_list.value = workflows_list.value.filter(workflow => workflow.uid !== workflowToDelete.value?.uid)
      showDeleteModal.value = false
      workflowToDelete.value = null
    }
  })
}

const edit_workflow = (workflow: IWorkflow) => {
  showEditModal.value = true
  workflowToEdit.value = workflow
}

const confirm_edit_workflow = (newName: string) => {
  if (!workflowToEdit.value) return
  socket.socketEmit('server/workflows/edit', { uid: workflowToEdit.value.uid, name: newName }, (value: { error?: string }) => {
    if (value.error) {
      toast.error(value.error)
    } else {
      toast.success('Workflow renombrado')
      const workflowIndex = workflows_list.value.findIndex(workflow => workflow.uid === workflowToEdit.value?.uid)
      if (workflowIndex !== -1) {
        workflows_list.value[workflowIndex].name = newName
      }
      showEditModal.value = false
      workflowToEdit.value = null
    }
  })
}

const get_workflows = () => {
  socket.socketEmit('server/workflows/get', { id_project: props.project.id }, (value: IWorkflow[]) => {
    console.log(value, props.project.id)
    workflows_list.value = value.map(workflow => ({ ...workflow, show: false }))
  })
}

onMounted(() => {
  get_workflows()
})

defineExpose({ get_workflows })

function option_workflow({ workflow, option }: { workflow: IWorkflow, option: string }) {
  if (option === 'close_workflow') close_workflow({ workflow: workflow.uid })
  if (option === 'delete_workflow') delete_workflow(workflow)
  if (option === 'edit_workflow') edit_workflow(workflow)
}
</script>