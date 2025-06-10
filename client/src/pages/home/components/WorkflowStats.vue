<script setup lang="ts">
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { ref, onMounted, computed } from 'vue';
import { useSocket } from '../../../stores/socket';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Interfaces para tipado
interface WorkflowDashboardStats {
  totalWorkflows: number;
  activeWorkers: number;
  weeklyExecutions: number[];
  recentHistory: Array<{
    name: string;
    version: string;
    workflow: any;
  }>;
}

interface WorkflowDashboardResponse {
  error?: string;
  stats?: WorkflowDashboardStats;
  workflows?: any[];
}

const socket = useSocket();

// Estados reactivos
const loading = ref(true);
const error = ref<string | null>(null);
const retryCount = ref(0);
const maxRetries = 3;
const stats = ref<WorkflowDashboardStats>({
  totalWorkflows: 0,
  activeWorkers: 0,
  weeklyExecutions: [0, 0, 0, 0, 0, 0, 0],
  recentHistory: []
});

// Datos del gráfico computados
const chartData = computed(() => ({
  labels: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  datasets: [
    {
      label: 'Ejecuciones de Workflows',
      data: stats.value.weeklyExecutions,
      fill: false,
      borderColor: '#60a5fa',
      backgroundColor: 'rgba(96, 165, 250, 0.1)',
      tension: 0.1,
      pointBackgroundColor: '#60a5fa',
      pointBorderColor: '#1d4ed8',
      pointRadius: 4
    }
  ]
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
      labels: {
        color: '#6b7280',
        font: {
          size: 12
        }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(17, 24, 39, 0.8)',
      titleColor: '#f9fafb',
      bodyColor: '#f9fafb',
      borderColor: '#374151',
      borderWidth: 1
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(107, 114, 128, 0.1)'
      },
      ticks: {
        color: '#6b7280',
        font: {
          size: 11
        }
      }
    },
    x: {
      grid: {
        color: 'rgba(107, 114, 128, 0.1)'
      },
      ticks: {
        color: '#6b7280',
        font: {
          size: 11
        }
      }
    }
  }
};

// Función para cargar datos del dashboard
const loadDashboardData = async () => {
  try {
    loading.value = true;
    error.value = null;

    socket.socketEmit(
      'server/workflows/dashboard',
      {},
      (response: WorkflowDashboardResponse) => {
        if (response.error) {
          error.value = response.error;
          console.error('Error loading workflow dashboard:', response.error);
        } else if (response.stats) {
          stats.value = response.stats;
          retryCount.value = 0; // Reset retry count on success
        }
        loading.value = false;
      }
    );
  } catch (err) {
    error.value = 'Error de conexión al cargar estadísticas de workflows';
    loading.value = false;
    console.error('Workflow dashboard error:', err);
  }
};

// Función para reintentar carga
const retryLoad = async () => {
  if (retryCount.value < maxRetries) {
    retryCount.value++;
    await loadDashboardData();
  }
};

// Cargar datos al montar el componente
onMounted(() => {
  loadDashboardData();
});
</script>

<template>
  <div class="h-full relative">
    <!-- Loading state -->
    <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 z-10">
      <div class="flex flex-col items-center space-y-2">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span class="text-sm text-gray-500 dark:text-gray-400">Cargando estadísticas...</span>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error"
      class="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 z-10">
      <div class="text-center space-y-3">
        <div class="text-red-500 text-sm">{{ error }}</div>
        <button v-if="retryCount < maxRetries" @click="retryLoad"
          class="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
          Reintentar ({{ retryCount }}/{{ maxRetries }})
        </button>
        <div v-else class="text-xs text-gray-500">
          Máximo de reintentos alcanzado
        </div>
      </div>
    </div>

    <!-- Chart -->
    <Line v-show="!loading && !error" :data="chartData" :options="chartOptions" class="h-full" />
  </div>
</template>