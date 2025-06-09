<script setup lang="ts">
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { ref, onMounted, computed } from 'vue';
// import { useSocket } from '../../../stores/socket';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Interfaces para tipado
interface ExecutionStats {
  hourlyData: {
    hour: number;
    successful: number;
    failed: number;
    running: number;
  }[];
  totalExecutions: number;
  successRate: number;
}

// const socket = useSocket();

// Estados reactivos
const loading = ref(true);
const error = ref<string | null>(null);
const retryCount = ref(0);
const maxRetries = 3;
const stats = ref<ExecutionStats>({
  hourlyData: Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    successful: 0,
    failed: 0,
    running: 0
  })),
  totalExecutions: 0,
  successRate: 0
});

// Generar datos simulados para demostración (se reemplazará con datos reales)
const generateSimulatedData = () => {
  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    successful: Math.floor(Math.random() * 30),
    failed: Math.floor(Math.random() * 10),
    running: Math.floor(Math.random() * 15)
  }));

  const totalExecutions = hourlyData.reduce((sum, hour) =>
    sum + hour.successful + hour.failed + hour.running, 0
  );

  const successfulTotal = hourlyData.reduce((sum, hour) => sum + hour.successful, 0);
  const successRate = totalExecutions > 0 ? (successfulTotal / totalExecutions) * 100 : 0;

  return {
    hourlyData,
    totalExecutions,
    successRate
  };
};

// Datos del gráfico computados
const chartData = computed(() => ({
  labels: stats.value.hourlyData.map(hour => `${hour.hour}:00`),
  datasets: [
    {
      label: 'En Ejecución',
      data: stats.value.hourlyData.map(hour => hour.running),
      backgroundColor: '#3b82f6', // Blue
      borderColor: '#1d4ed8',
      borderWidth: 1,
      stack: 'stack0',
    },
    {
      label: 'Exitosas',
      data: stats.value.hourlyData.map(hour => hour.successful),
      backgroundColor: '#22c55e', // Green
      borderColor: '#16a34a',
      borderWidth: 1,
      stack: 'stack0',
    },
    {
      label: 'Fallidas',
      data: stats.value.hourlyData.map(hour => hour.failed),
      backgroundColor: '#ef4444', // Red
      borderColor: '#dc2626',
      borderWidth: 1,
      stack: 'stack0',
    }
  ]
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      stacked: true,
      title: {
        display: true,
        text: 'Hora del Día',
        color: '#6b7280',
        font: {
          size: 12
        }
      },
      grid: {
        color: 'rgba(107, 114, 128, 0.1)'
      },
      ticks: {
        color: '#6b7280',
        font: {
          size: 10
        }
      }
    },
    y: {
      stacked: true,
      beginAtZero: true,
      title: {
        display: true,
        text: 'Número de Ejecuciones',
        color: '#6b7280',
        font: {
          size: 12
        }
      },
      grid: {
        color: 'rgba(107, 114, 128, 0.1)'
      },
      ticks: {
        color: '#6b7280',
        font: {
          size: 10
        }
      }
    }
  },
  plugins: {
    tooltip: {
      mode: 'index' as const,
      intersect: false,
      backgroundColor: 'rgba(17, 24, 39, 0.8)',
      titleColor: '#f9fafb',
      bodyColor: '#f9fafb',
      borderColor: '#374151',
      borderWidth: 1, callbacks: {
        footer: (context: any) => {
          const total = context.reduce((sum: number, item: any) => sum + item.parsed.y, 0);
          return `Total: ${total} ejecuciones`;
        }
      }
    },
    legend: {
      position: 'top' as const,
      labels: {
        color: '#6b7280',
        font: {
          size: 12
        }
      }
    }
  }
};

// Función para cargar datos de ejecución
const loadExecutionData = async () => {
  try {
    loading.value = true;
    error.value = null;

    // Por ahora usaremos datos simulados
    // En el futuro se conectará al endpoint real
    await new Promise(resolve => setTimeout(resolve, 500)); // Simular carga

    // Simular posible error de API
    if (Math.random() > 0.8) {
      throw new Error('Error simulado de conexión');
    }

    stats.value = generateSimulatedData();
    retryCount.value = 0;
    loading.value = false;

    // TODO: Implementar cuando esté disponible el endpoint
    /*
    socket.socketEmit(
      'server/workflows/executions/stats',
      { period: '24h' },
      (response: ExecutionStatsResponse) => {
        if (response.error) {
          error.value = response.error;
          console.error('Error loading execution stats:', response.error);
        } else if (response.stats) {
          stats.value = response.stats;
          retryCount.value = 0;
        }
        loading.value = false;
      }
    );
    */
  } catch (err) {
    error.value = 'Error de conexión al cargar estadísticas de ejecución';
    loading.value = false;
    console.error('Execution stats error:', err);
  }
};

// Función para reintentar carga
const retryLoad = async () => {
  if (retryCount.value < maxRetries) {
    retryCount.value++;
    await loadExecutionData();
  }
};

// Cargar datos al montar el componente
onMounted(() => {
  loadExecutionData();
});
</script>

<template>
  <div class="h-full relative">
    <!-- Loading state -->
    <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 z-10">
      <div class="flex flex-col items-center space-y-2">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span class="text-sm text-gray-500 dark:text-gray-400">Cargando estadísticas de ejecución...</span>
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

    <!-- Summary info -->
    <div v-show="!loading && !error"
      class="absolute top-2 right-2 bg-white/90 dark:bg-gray-800/90 rounded-lg p-2 text-xs space-y-1 shadow-sm z-10">
      <div class="font-medium text-gray-700 dark:text-gray-300">
        Total: {{ stats.totalExecutions.toLocaleString() }}
      </div>
      <div class="text-green-600 dark:text-green-400">
        Éxito: {{ stats.successRate.toFixed(1) }}%
      </div>
    </div>

    <!-- Chart -->
    <Bar v-show="!loading && !error" :data="chartData" :options="chartOptions" class="h-full" />
  </div>
</template>