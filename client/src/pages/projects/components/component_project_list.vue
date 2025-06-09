<template>
  <div class="divider divider-start">Listado de Proyectos</div>
  <div class="p-3 background rounded-md h-[70px] mb-4 flex gap-4">
    <CustomField v-model:value="filter" type="string" :placeholder="`Buscar Proyecto`" class="w-full" />
    <CustomNew ref="customNew" :title="'Nuevo Proyecto'" :buttonTitle="'Crear Proyecto'" :steps="steps" />
    <!-- {{ steps }} -->
  </div>
  <table class="w-full" v-if="list_projects.length > 0">
    <thead>
      <tr>
        <th width="60px">ID</th>
        <th>Nombre</th>
        <th width="80px">Estado</th>
        <th width="150px">Creado por</th>
        <th width="100px">Acciones</th>
      </tr>
    </thead>
    <tbody>
      <tr class="custom-table" v-for="project in list_projects">
        <td class="text-center" @click="project_select(project)">
          PJ-{{ project.id }}
        </td>
        <td @click="project_select(project)">
          {{ project.name }}
          <div class="description text-[12px] text-base-content/30">
            {{ project.description || "Sin descripción definida" }}
          </div>
        </td>
        <td class="text-center" @click="project_select(project)">
          <span class="badge badge-sm badge-soft" :class="[
            project?.status?.name === 'Active'
              ? 'badge-success'
              : 'badge-error',
          ]">
            {{ project?.status?.name }}
          </span>
        </td>

        <td class="text-center" @click="project_select(project)">
          {{ project?.user?.name }}
        </td>
        <td class="text-center">
          <div class="dropdown dropdown-end">
            <div tabindex="0" role="button" class="btn btn-sm btn-outline btn-primary">
              ...
            </div>
            <div tabindex="0" class="dropdown-content card card-sm bg-base-100 z-1 w-64 shadow-md">
              <div @click="option_project({ project, option: 'delete_workflow' })"
                class="cursor-pointer hover:bg-black/10 p-2 text-left text-error">
                <span class="mdi mdi-delete mr-2"></span>Eliminar Proyecto
              </div>

            </div>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
  <CustomEmpty v-else description="No existen proyectos" />
</template>

<script setup lang="ts">
import type { Interface_Project } from "../../../shared/interfaces/interface_project";
import type { IClientStepContent, IClientStepType } from "@shared/interfaces/client.interface";
import { useRouter } from "vue-router";
import { onMounted, ref } from "vue";
import { useSocket } from "../../../stores/socket";
// biome-ignore lint/style/useImportType: <explanation>
import CustomNew from "../../../shared/components/customNew.vue";
import { projectListSteps } from "./component_project_list_new";
import CustomField from "../../../shared/components/customField.vue";
import CustomEmpty from "../../../shared/components/customEmpty.vue";
import { toast } from "vue-sonner";

const router = useRouter();
const socket = useSocket();

const structureSteps = projectListSteps(
  (e: any) => newProject(e),
  (e: any) => testProject(e)
);
const filter = ref("");
const customNew = ref<InstanceType<typeof CustomNew>>();
const list_projects = ref<Interface_Project[]>([]);
const steps = ref<typeof structureSteps>(structureSteps);

const project_select = (project: Interface_Project) => {
  router.push(`/projects/${project.uid}`);
};

const newProject = ({ steps }: { steps: IClientStepContent }) => {
  const projectData = {
    name: String(steps.info.element.name),
    description: String(steps.info.element.description),
    transport_type: steps.transport,
    transport_config: (String(steps.transport) === 'rabbitMQ' ? steps.rabbitConfig : String(steps.transport) === 'tcp' ? steps.tcpConfig : {})?.element
  };

  socket.socketEmit(
    "server/projects/new",
    projectData,
    (value: { error?: string }) => {
      if (value.error) return console.log(value.error);
      customNew.value?.closeModal();
      get_projects();
    }
  );
};

const testProject = ({ step }: { step: IClientStepType }) => {
  return new Promise((resolve) => {
    socket.socketEmit(
      "server/projects/test/rabbitMQ",
      {
        url: step.element.url,
      },
      (value: { error?: string; msg?: string }) => {
        if (value.error) return resolve({ alert: value.error, type: 'error' })
        resolve({ alert: value?.msg || "", type: 'success' })
      }
    );
  })
}

const get_projects = () => {
  socket.socketEmit(
    "server/projects/get_projects",
    {},
    (value: Interface_Project[] | null) => {
      console.log(value);
      list_projects.value = [];
      if (!value) return;
      for (const project of value) {
        list_projects.value.push(project);
      }
    }
  );
};

const delete_project = (project: Interface_Project) => {
  socket.socketEmit('server/projects/delete', { uid: project.uid }, (value: { error?: string }) => {
    if (value.error) {
      toast.error(value.error)
    } else {
      toast.success('Proyecto eliminado')
      get_projects()
    }
  })
}

const option_project = ({ project, option }: { project: Interface_Project, option: string }) => {
  if (option === 'delete_workflow') delete_project(project)
}

// const showNew = () => {
//   data_project.value.name = ''
//   data_project.value.description = ''
//   data_project.value.show = true
// }

onMounted(() => {
  get_projects();
});
</script>

<style scoped>
.project-list-item {
  padding: 10px;
  border-radius: 15px;
  background-color: rgba(0, 0, 0, 0.1);
  border: 4px solid var(--color-background-element);
  margin-bottom: 10px;
  height: 200px;
  min-width: 300px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.project-list-item:hover {
  border: 4px solid var(--color-background-active);
  background-color: rgba(0, 0, 0, 0.2);
}

.project-item-title {
  >div>span {
    padding-right: 10px;
  }

  >div>span {
    /* @apply text-gray-500; */
    border-right: 1px solid var(--color-border);
    margin-right: 10px;
  }
}

.project-item-content {
  margin-bottom: 20px;
  /* padding: 15px; */
}
</style>
