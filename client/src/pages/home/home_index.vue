<template>
  <div class="flex flex-col h-full">
    <div class="flex justify-between">
      <h2 class="text-2xl mb-2">Inicio</h2>

    </div>
    <div ref="container" class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6  p-2 bpx-content">

      <div data-swapy-slot="name" class="card  lg:col-span-2 bg-primary text-primary-content min-h-30 ">
        <div data-swapy-item="name">
          <User class="absolute -bottom-12 -right-4 w-70 " />
          Bienvenid@
          <div class="relative text-2xl font-semibold mb-4 text-shadow-[6px_6px_6px_rgba(0,0,0,0.4)]">
            {{ session.user?.alias }}

          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div data-swapy-slot="recent" class="card  lg:col-span-3">
        <div data-swapy-item="recent">
          <h2 class="text-xl font-semibold mb-4">Despliegues Recientes</h2>
          <div class="space-y-4 overflow-auto">
            <DeployStats></DeployStats>
          </div>
        </div>
      </div>

      <!-- Weekly Trends -->
      <div data-swapy-slot="weekly" class="card col-span-full lg:col-span-3">
        <div data-swapy-item="weekly">
          <h2 class="text-xl font-semibold mb-4">Cambios Semanales</h2>
          <div class="h-64">
            <WorkflowStats />
          </div>
        </div>

      </div>
      <div data-swapy-slot="hourly" class="card lg:col-span-2">
        <div data-swapy-item="hourly">
          <h2 class="text-xl font-semibold mb-4">Estados de Ejecución</h2>
          <div class="h-64">
            <ExecutionStats />
          </div>
        </div>
      </div>

      <!-- Activity Heatmap -->
      <div data-swapy-slot="activity" class="card col-span-full">
        <div data-swapy-item="activity">
          <h2 class="text-xl font-semibold mb-4">Mapa de Actividad</h2>
          <div class="h-64">
            <ActivityHeatmap />
          </div>
        </div>
      </div>


    </div>
  </div>
</template>

<script setup lang="ts">
import WorkflowStats from './components/WorkflowStats.vue';
import ExecutionStats from './components/ExecutionStats.vue';
import ActivityHeatmap from './components/ActivityHeatmap.vue';
import DeployStats from './components/DeployStats.vue';
import { createSwapy } from 'swapy'
import { onMounted, ref } from 'vue';
import { useSession } from '../../stores/session';
import User from './components/user.vue';

const swapy = ref<ReturnType<typeof createSwapy>>()
const container = ref<HTMLElement | null>(null)

const session = useSession()



onMounted(() => {
  // If container element is loaded
  if (container.value) {
    swapy.value = createSwapy(container.value)

    // Your event listeners
    swapy.value.onSwap(event => {
      console.log('swap', event)
    })
  }
})
</script>

<style scoped>
.card {
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.4);
  border-radius: 10px;
  padding: 10px
}
</style>