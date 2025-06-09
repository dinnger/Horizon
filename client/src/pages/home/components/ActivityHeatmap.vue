<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue';
import ApexCharts from 'apexcharts';
import { useMain } from '../../../stores/main';
// import { useSocket } from '../../../stores/socket';

const theme = useMain();
// const socket = useSocket();
let chart: ApexCharts | null = null;

interface DayActivity {
  x: string;
  y: number;
}

interface ActivityData {
  name: string;
  data: DayActivity[];
}

interface ActivityStats {
  workflowActivity: ActivityData[];
  totalActivities: number;
  averageDaily: number;
}

// Estados reactivos
const loading = ref(true);
const error = ref<string | null>(null);
const retryCount = ref(0);
const maxRetries = 3;

// Generar datos simulados para demostración
const generateData = (count: number, minMax: { min: number; max: number }, workflowName: string): DayActivity[] => {
  const data: DayActivity[] = [];
  const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  for (let i = 0; i < count; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (count - 1 - i)); // Últimos N días
    const activities = Math.floor(Math.random() * (minMax.max - minMax.min + 1)) + minMax.min;
    data.push({
      x: `${daysOfWeek[date.getDay()]} ${date.getDate()}/${(date.getMonth() + 1)}`,
      y: activities
    });
  }
  return data;
};

const generateSimulatedStats = (): ActivityStats => {
  const workflowNames = ['Workflow Procesamiento', 'Workflow API', 'Workflow Datos', 'Workflow Reportes'];
  const workflowActivity = workflowNames.map(name => ({
    name,
    data: generateData(7, { min: 0, max: 20 }, name)
  }));

  const totalActivities = workflowActivity.reduce((sum, workflow) =>
    sum + workflow.data.reduce((wSum, day) => wSum + day.y, 0), 0
  );

  const averageDaily = totalActivities / 7;

  return {
    workflowActivity,
    totalActivities,
    averageDaily
  };
};

const stats = ref<ActivityStats>(generateSimulatedStats());

const chartOptions = ref({
  series: stats.value.workflowActivity,
  chart: {
    height: 300,
    type: 'heatmap' as const,
    background: 'transparent',
    toolbar: {
      show: false
    },
    animations: {
      enabled: true,
      easing: 'easeinout',
      speed: 800
    }
  },
  dataLabels: {
    enabled: true,
    style: {
      colors: [theme.theme === 'dark' ? '#ffffff' : '#000000']
    }
  },
  colors: [theme.theme === 'dark' ? '#1e40af' : '#3b82f6'],
  plotOptions: {
    heatmap: {
      shadeIntensity: 0.5,
      radius: 4,
      useFillColorAsStroke: true,
      colorScale: {
        ranges: [{
          from: 0,
          to: 5,
          name: 'Baja',
          color: theme.theme === 'dark' ? '#1f2937' : '#f3f4f6'
        }, {
          from: 6,
          to: 10,
          name: 'Media',
          color: theme.theme === 'dark' ? '#3730a3' : '#60a5fa'
        }, {
          from: 11,
          to: 15,
          name: 'Alta',
          color: theme.theme === 'dark' ? '#1e40af' : '#3b82f6'
        }, {
          from: 16,
          to: 20,
          name: 'Muy Alta',
          color: theme.theme === 'dark' ? '#1e3a8a' : '#1d4ed8'
        }]
      }
    }
  },
  xaxis: {
    type: 'category' as const,
    labels: {
      style: {
        colors: theme.theme === 'dark' ? '#d1d5db' : '#6b7280',
        fontSize: '11px'
      }
    }
  },
  yaxis: {
    labels: {
      style: {
        colors: theme.theme === 'dark' ? '#d1d5db' : '#6b7280',
        fontSize: '11px'
      }
    }
  },
  tooltip: {
    theme: theme.theme,
    custom: ({ series, seriesIndex, dataPointIndex, w }: any) => {
      const workflowName = w.globals.seriesNames[seriesIndex];
      const day = w.globals.labels[dataPointIndex];
      const value = series[seriesIndex][dataPointIndex];

      return `
        <div class="px-3 py-2 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded shadow-lg">
          <div class="font-semibold text-gray-900 dark:text-gray-100">${workflowName}</div>
          <div class="text-sm text-gray-600 dark:text-gray-300">${day}</div>
          <div class="text-sm font-medium text-blue-600 dark:text-blue-400">${value} actividades</div>
        </div>
      `;
    }
  },
  legend: {
    show: true,
    position: 'bottom' as const,
    labels: {
      colors: theme.theme === 'dark' ? '#d1d5db' : '#6b7280'
    }
  }
});

// Función para cargar datos de actividad
const loadActivityData = async () => {
  try {
    loading.value = true;
    error.value = null;

    // Simular carga de datos
    await new Promise(resolve => setTimeout(resolve, 600));

    // Simular posible error
    if (Math.random() > 0.85) {
      throw new Error('Error simulado de conexión');
    }

    stats.value = generateSimulatedStats();
    retryCount.value = 0;

    // Actualizar datos del gráfico
    chartOptions.value.series = stats.value.workflowActivity;

    if (chart) {
      chart.updateSeries(stats.value.workflowActivity);
    }

    loading.value = false;

    // TODO: Implementar cuando esté disponible el endpoint
    /*
    socket.socketEmit(
      'server/workflows/activity/heatmap',
      { days: 7 },
      (response: ActivityStatsResponse) => {
        if (response.error) {
          error.value = response.error;
        } else if (response.stats) {
          stats.value = response.stats;
          chartOptions.value.series = stats.value.workflowActivity;
          if (chart) {
            chart.updateSeries(stats.value.workflowActivity);
          }
        }
        loading.value = false;
      }
    );
    */
  } catch (err) {
    error.value = 'Error al cargar datos de actividad';
    loading.value = false;
    console.error('Activity heatmap error:', err);
  }
};

// Función para reintentar carga
const retryLoad = async () => {
  if (retryCount.value < maxRetries) {
    retryCount.value++;
    await loadActivityData();
  }
};

// Actualizar tema
watch(() => theme.theme, (value) => {
  const isDark = value === 'dark';
  const newOptions = {
    colors: [isDark ? '#1e40af' : '#3b82f6'],
    dataLabels: {
      style: {
        colors: [isDark ? '#ffffff' : '#000000']
      }
    },
    plotOptions: {
      heatmap: {
        colorScale: {
          ranges: [{
            from: 0,
            to: 5,
            name: 'Baja',
            color: isDark ? '#1f2937' : '#f3f4f6'
          }, {
            from: 6,
            to: 10,
            name: 'Media',
            color: isDark ? '#3730a3' : '#60a5fa'
          }, {
            from: 11,
            to: 15,
            name: 'Alta',
            color: isDark ? '#1e40af' : '#3b82f6'
          }, {
            from: 16,
            to: 20,
            name: 'Muy Alta',
            color: isDark ? '#1e3a8a' : '#1d4ed8'
          }]
        }
      }
    },
    xaxis: {
      labels: {
        style: {
          colors: isDark ? '#d1d5db' : '#6b7280'
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: isDark ? '#d1d5db' : '#6b7280'
        }
      }
    },
    legend: {
      labels: {
        colors: isDark ? '#d1d5db' : '#6b7280'
      }
    },
    tooltip: {
      theme: value
    }
  };

  chart?.updateOptions(newOptions);
});

onMounted(async () => {
  await loadActivityData();

  chart = new ApexCharts(document.querySelector("#heatmap"), chartOptions.value);
  chart.render();
});

onUnmounted(() => {
  if (chart) {
    chart.destroy();
  }
});
</script>

<template>
  <div class="relative h-full">
    <!-- Loading state -->
    <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 z-10">
      <div class="flex flex-col items-center space-y-2">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        <span class="text-xs text-gray-500 dark:text-gray-400">Cargando mapa de actividad...</span>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error"
      class="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 z-10">
      <div class="text-center space-y-2">
        <div class="text-red-500 text-xs">{{ error }}</div>
        <button v-if="retryCount < maxRetries" @click="retryLoad"
          class="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
          Reintentar ({{ retryCount }}/{{ maxRetries }})
        </button>
      </div>
    </div>

    <!-- Summary stats -->
    <div v-show="!loading && !error"
      class="absolute top-2 right-2 bg-white/90 dark:bg-gray-800/90 rounded-lg p-2 text-xs space-y-1 shadow-sm z-10">
      <div class="font-medium text-gray-700 dark:text-gray-300">
        Total: {{ stats.totalActivities.toLocaleString() }}
      </div>
      <div class="text-blue-600 dark:text-blue-400">
        Promedio: {{ stats.averageDaily.toFixed(1) }}/día
      </div>
    </div>

    <!-- Heatmap chart -->
    <div id="heatmap" class="h-full w-full"></div>
  </div>
</template>