<template>
  <div class="flex flex-col h-full" v-if="data_project">
    <h2 class="text-xl mb-2">
      PJ-{{ data_project.id }} | {{ data_project.name }}
      <div class="text-sm opacity-80">
        {{ data_project.description }}
      </div>
    </h2>
    <div class="flex-1 flex flex-col overflow-auto p-2  dark:bg-black/30 bg-neutral-200 rounded-md">
      <div class="background p-4 rounded-md grid  md:grid-cols-5  sm:grid-cols-2 gap-2">
        <div>
          <div class="text-sm opacity-50">
            Orquestación:
          </div>
          <div>
            <span class="mdi mdi-rabbit"></span> RabbitMQ
            <span class="badge badge-soft badge-success badge-sm">Activo</span>
          </div>
        </div>
        <div>
          <div class="text-sm opacity-50">
            Patrones:
          </div>
          <div>
            Saga (Coreografía)
          </div>
        </div>
        <div>
          <div class="text-sm opacity-50">
            Estado:
          </div>
          <div>
            Activo
          </div>
        </div>
        <div>
          <div class="text-sm opacity-50">
            Creado por:
          </div>
          <div>
            {{ data_project.name }}
          </div>
        </div>
        <div class="flex justify-end">
          <button class="btn btn-sm btn-primary">Editar</button>
        </div>

      </div>
      <div class="divider divider-start pl-3 pr-3">Flujos de trabajo</div>
      <component_project_workflows :project="data_project" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Interface_Project } from '../../shared/interfaces/interface_project';
import component_project_workflows from './components/component_project_workflows.vue'
import { useRoute } from 'vue-router';
import { onMounted, ref } from 'vue';
import { useSocket } from '../../stores/socket';

const socket = useSocket()
const route = useRoute()
const data_project = ref<Interface_Project>()

const get_project_by_uid = () => {
  socket.socketEmit('server/projects/get_project_by_uid', { uid: route.params.project_id }, (value) => {
    console.log(value)
    if (value?.error) return console.log(value.error)
    data_project.value = value
  })
}

onMounted(() => {
  get_project_by_uid()
})

</script>


<style scoped>
.project-options {
  background-color: var(--color-background);
  border-radius: 20px;
  padding: 10px;
}
</style>