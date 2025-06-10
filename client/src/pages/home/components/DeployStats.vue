<template>
  <div>
    <!-- Error state -->
    <div v-if="error"
      class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md p-3 mb-4">
      <div class="flex items-center gap-2">
        <span class="mdi mdi-alert-circle text-red-500"></span>
        <span class="text-red-700 dark:text-red-300 text-sm">Error al cargar datos: {{ error }}</span>
        <button @click="loadDashboardData"
          class="ml-auto text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200">
          <span class="mdi mdi-refresh"></span>
        </button>
      </div>
    </div>

    <div class="grid grid-cols-4 gap-2">
      <div v-for="item in data.info" :key="item.label"
        class="bg-black/5 dark:bg-white/5 rounded-md p-2 flex flex-col gap-2 relative">
        <span class="mdi absolute top-1 right-1 text-xl opacity-20" :class="item.icon"></span>

        <!-- Loading spinner -->
        <div v-if="loading"
          class="absolute inset-0 flex items-center justify-center bg-black/5 dark:bg-white/5 rounded-md">
          <span class="mdi mdi-loading mdi-spin text-lg opacity-50"></span>
        </div>

        <div class="text-sm opacity-70 flex overflow-hidden text-ellipsis -mb-2">
          {{ item.label }}
        </div>
        <div class="text-lg font-bold -mb-2">{{ item.value }}</div>
        <div class="text-[10px] opacity-40">{{ item.info }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IGlobalDeploymentsQueueEntity } from '../../../../../shared/interfaces/entities/global.deploymentsQueue.interface.js';
import { useSocket } from '../../../stores/socket';
import { onMounted, ref } from 'vue';

interface IDashboardDeployments {
  info: { label: string, value: number, icon: string, info: string }[]
  recent: IGlobalDeploymentsQueueEntity[]
}

interface IDashboardResponse {
  error?: string
  stats: {
    total: number
    successful: number
    failed: number
    pending: number
  }
  deploys: IGlobalDeploymentsQueueEntity[]
}

const socket = useSocket()
const data = ref<IDashboardDeployments>({
  info: [
    { label: 'Totales', value: 0, icon: 'mdi-progress-question', info: 'Cargando...' },
    { label: 'Exitosos', value: 0, icon: 'mdi-check-circle-outline', info: 'Cargando...' },
    { label: 'Errores', value: 0, icon: 'mdi-close-circle-outline', info: 'Cargando...' },
    { label: 'Pendientes', value: 0, icon: 'mdi-progress-clock', info: 'Cargando...' },
  ],
  recent: []
})

const loading = ref(true)
const error = ref<string | null>(null)

const loadDashboardData = () => {
  loading.value = true
  error.value = null

  socket.socketEmit('server/global/deploy/queue/dashboard', { status: [1, 6, 3, 4, 7] }, (value: IDashboardResponse) => {
    loading.value = false

    if (value.error) {
      error.value = value.error
      console.error('Error loading dashboard data:', value.error)
      return
    }

    // Update the stats with real data
    data.value.info = [
      { label: 'Totales', value: value.stats.total, icon: 'mdi-progress-question', info: 'Total de despliegues' },
      { label: 'Exitosos', value: value.stats.successful, icon: 'mdi-check-circle-outline', info: 'Despliegues exitosos' },
      { label: 'Errores', value: value.stats.failed, icon: 'mdi-close-circle-outline', info: 'Despliegues fallidos' },
      { label: 'Pendientes', value: value.stats.pending, icon: 'mdi-progress-clock', info: 'En proceso' },
    ]

    data.value.recent = value.deploys
  })
}

onMounted(() => {
  loadDashboardData()
})
</script>