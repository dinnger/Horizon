<template>
  <div class="bg-black/10 h-full w-full">
    <Line :data="data" :options="options" />
  </div>
</template>

<script setup lang="ts">
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { onBeforeUnmount, onMounted, ref } from "vue";
import { Line } from "vue-chartjs";
import { useSocket } from "../../../../stores/socket";

defineProps(["debug", "userInterface", "context"]);

const store = useSocket();

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const labels: any[] = [];
const data2: any[] = [];

const data = ref({
  labels: [],
  datasets: [
    {
      label: "Memoria",
    },
  ],
});

const delayBetweenPoints = 0;
const previousY = (ctx) =>
  ctx.index === 0
    ? ctx.chart.scales.y.getPixelForValue(100)
    : ctx.chart
        .getDatasetMeta(ctx.datasetIndex)
        .data[ctx.index - 1].getProps(["y"], true).y;
const animation = {
  x: {
    type: "number",
    easing: "linear",
    duration: delayBetweenPoints,
    from: Number.NaN, // the point is initially skipped
    delay: (ctx) => {
      if (ctx.type !== "data" || ctx.xStarted) {
        return 0;
      }
      ctx.xStarted = true;
      return ctx.index * delayBetweenPoints;
    },
  },
  y: {
    type: "number",
    easing: "linear",
    duration: delayBetweenPoints,
    from: previousY,
    delay: (ctx) => {
      if (ctx.type !== "data" || ctx.yStarted) {
        return 0;
      }
      ctx.yStarted = true;
      return ctx.index * delayBetweenPoints;
    },
  },
};

const options = {
  animation,
  interaction: {
    intersect: false,
  },
  plugins: {
    subtitle: {
      display: true,
      text: "Custom Chart Subtitle",
    },
  },
  scales: {
    //   x: {
    //     type: 'linear'
    //   }
    y: {
      ticks: {
        // Include a dollar sign in the ticks
        callback: (value, index, ticks) =>
          `${Number.parseFloat(value).toFixed(2)} mb`,
      },
    },
  },
};

onMounted(() => {
  store.socketOn("memory", (value) => {
    data2.push(value);
    labels.push(new Date().toISOString().slice(11, 19));
    if (data2.length > 200) {
      data2.shift();
      labels.shift();
    }
    data.value = {
      labels,
      datasets: [
        {
          label: "Memoria",
          borderColor: "#333",
          borderWidth: 1,
          radius: 0,
          data: data2,
        },
      ],
    };
  });
});

onBeforeUnmount(() => {
  store.socketOff("memory");
});
</script>
