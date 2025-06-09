<template>
  <div class="p-4 container mx-auto">
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title text-2xl mb-4">API Stress Tester</h2>

        <!-- Configuration Management Buttons -->
        <div class="mb-6 flex gap-2">
          <button @click="showSaveModal = true" class="btn btn-accent">Save Test Setup</button>
          <button @click="openHistoryModal" class="btn btn-secondary">View History</button>
        </div>

        <!-- Save Configuration Modal -->
        <dialog id="saveConfigModal" class="modal" :class="{ 'modal-open': showSaveModal }">
          <div class="modal-box">
            <h3 class="font-bold text-lg">Save Configuration</h3>
            <div class="py-4">
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Configuration Name</span>
                </label>
                <input
                  type="text"
                  v-model="configNameToSave"
                  placeholder="My API Test"
                  class="input input-bordered w-full"
                  @keyup.enter="executeSaveConfiguration"
                />
              </div>
            </div>
            <div class="modal-action">
              <button @click="executeSaveConfiguration" class="btn btn-primary" :disabled="!configNameToSave.trim()">Save</button>
              <button @click="showSaveModal = false" class="btn">Close</button>
            </div>
          </div>
           <form method="dialog" class="modal-backdrop">
            <button @click="showSaveModal = false">close</button>
          </form>
        </dialog>

        <!-- History Modal -->
        <dialog id="historyModal" class="modal" :class="{ 'modal-open': showHistoryModal }">
          <div class="modal-box w-11/12 max-w-5xl">
            <h3 class="font-bold text-lg">Saved Test Configurations</h3>
            <div class="py-4 overflow-x-auto">
              <table class="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Target RPS</th>
                    <th>Last Total</th>
                    <th>Last Success</th>
                    <th>Last Failed</th>
                    <th>Last Avg. Time (ms)</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="Object.keys(savedConfigs).length === 0">
                    <td colspan="7" class="text-center">No configurations saved yet.</td>
                  </tr>
                  <tr v-for="(config, name) in savedConfigs" :key="name">
                    <td>{{ name }}</td>
                    <td>{{ config.runInParallel ? 'Max (Parallel)' : config.targetRps }}</td>
                    <td>{{ config.lastTotalRequests ?? 'N/A' }}</td>
                    <td>{{ config.lastSuccessfulRequests ?? 'N/A' }}</td>
                    <td>{{ config.lastFailedRequests ?? 'N/A' }}</td>
                    <td>{{ config.lastAverageResponseTime?.toFixed(2) ?? 'N/A' }}</td>
                    <td class="flex gap-1">
                      <button @click="loadConfigurationFromHistory(name)" class="btn btn-sm btn-primary">Load</button>
                      <button @click="deleteConfiguration(name)" class="btn btn-sm btn-error btn-outline">Delete</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="modal-action">
              <button @click="showHistoryModal = false" class="btn">Close</button>
            </div>
          </div>
           <form method="dialog" class="modal-backdrop">
            <button @click="showHistoryModal = false">close</button>
          </form>
        </dialog>

        <!-- Configuration Section -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div class="form-control">
            <label class="label">
              <span class="label-text">API URL</span>
            </label>
            <input
              type="text"
              v-model="apiUrl"
              placeholder="https://api.example.com/data"
              class="input input-bordered w-full"
            />
          </div>
          <div class="form-control">
            <label class="label">
              <span class="label-text">HTTP Method</span>
            </label>
            <select v-model="httpMethod" class="select select-bordered w-full">
              <option>GET</option>
              <option>POST</option>
              <option>PUT</option>
              <option>DELETE</option>
            </select>
          </div>
          <div class="form-control">
            <label class="label">
              <span class="label-text"
                >Number of Clients (Max Concurrent)</span
              >
            </label>
            <input
              type="number"
              v-model.number="numClients"
              placeholder="10"
              class="input input-bordered w-full"
            />
          </div>
          <div class="form-control">
            <label class="label">
              <span class="label-text">Test Duration (seconds)</span>
            </label>
            <input
              type="number"
              v-model.number="testDuration"
              placeholder="30"
              class="input input-bordered w-full"
            />
          </div>

          <div class="form-control md:col-span-2">
            <label class="label cursor-pointer justify-start gap-2">
              <input type="checkbox" v-model="runInParallel" class="checkbox checkbox-primary" />
              <span class="label-text">Run Requests in Parallel (Max Speed Mode)</span> 
            </label>
          </div>
          
          <div class="form-control md:col-span-2" v-if="!runInParallel">
            <label class="label">
              <span class="label-text">Target RPS (e.g., 100) - Required if not parallel</span>
            </label>
            <input
              type="number"
              v-model.number="targetRps"
              placeholder="Specify target requests per second"
              class="input input-bordered w-full"
            />
          </div>
        </div>

        <div
          v-if="httpMethod === 'POST' || httpMethod === 'PUT'"
          class="form-control mb-6"
        >
          <label class="label">
            <span class="label-text">Request Body (JSON)</span>
          </label>
          <textarea
            v-model="requestBody"
            class="textarea textarea-bordered h-24"
            placeholder='{"key": "value"}'
          ></textarea>
        </div>

        <!-- Controls -->
        <div class="card-actions justify-start mb-6">
          <button
            @click="startTest"
            class="btn btn-primary"
            :disabled="isLoading"
          >
            <span v-if="isLoading" class="loading loading-spinner"></span>
            Start Test
          </button>
          <button
            @click="stopTest"
            class="btn btn-ghost"
            :disabled="!isLoading"
          >
            Stop Test
          </button>
        </div>

        <!-- Results Section -->
        <div
          v-if="testStarted || testFinished"
          class="stats shadow w-full mb-6"
        >
          <div class="stat">
            <div class="stat-figure text-primary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                class="inline-block w-8 h-8 stroke-current"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                ></path>
              </svg>
            </div>
            <div class="stat-title">RPS</div>
            <div class="stat-value text-primary">{{ rps.toFixed(2) }}</div>
            <div class="stat-desc">Requests per second</div>
          </div>
          <div class="stat">
            <div class="stat-figure text-success">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                class="inline-block w-8 h-8 stroke-current"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
            </div>
            <div class="stat-title">Successful</div>
            <div class="stat-value text-success">{{ successfulRequests }}</div>
            <div class="stat-desc">
              {{
                totalRequests > 0
                  ? ((successfulRequests / totalRequests) * 100).toFixed(1)
                  : 0
              }}% success
            </div>
          </div>
          <div class="stat">
            <div class="stat-figure text-error">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                class="inline-block w-8 h-8 stroke-current"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                ></path>
              </svg>
            </div>
            <div class="stat-title">Failed</div>
            <div class="stat-value text-error">{{ failedRequests }}</div>
            <div class="stat-desc">
              {{
                totalRequests > 0
                  ? ((failedRequests / totalRequests) * 100).toFixed(1)
                  : 0
              }}% failed
            </div>
          </div>
          <div class="stat">
            <div class="stat-title">Total Requests</div>
            <div class="stat-value">{{ totalRequests }}</div>
          </div>
          <div class="stat">
            <div class="stat-figure text-info">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                class="inline-block w-8 h-8 stroke-current"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            </div>
            <div class="stat-title">Avg. Response Time</div>
            <div class="stat-value text-info">
              {{ averageResponseTime.toFixed(2) }} ms
            </div>
            <div class="stat-desc">Average per request</div>
          </div>
        </div>

        <!-- Chart Section -->
        <div v-if="testStarted || testFinished" class="mb-6">
          <h3 class="text-lg font-semibold mb-2">Test Progress Chart</h3>
          <div class="p-4 bg-base-200 rounded-box h-96">
            <Line
              v-if="chartData.labels && chartData.labels.length > 0"
              :data="chartData"
              :options="chartOptions"
            />
            <p v-else class="text-center text-gray-500">
              Chart data will appear here once the test starts.
            </p>
          </div>
        </div>

        <!-- Status Codes -->
        <div
          v-if="testFinished && Object.keys(statusCodesCount).length > 0"
          class="mb-6"
        >
          <h3 class="text-lg font-semibold mb-2">Status Codes Received</h3>
          <div class="overflow-x-auto">
            <table class="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Status Code</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(count, code) in statusCodesCount" :key="code">
                  <td>{{ code }}</td>
                  <td>{{ count }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from "chart.js";
import { Line } from "vue-chartjs";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface TestConfig {
  apiUrl: string;
  httpMethod: string;
  requestBody: string;
  numClients: number;
  testDuration: number;
  runInParallel: boolean;
  targetRps: number | null;
  // For history
  lastTotalRequests?: number | null;
  lastSuccessfulRequests?: number | null;
  lastFailedRequests?: number | null;
  lastAverageResponseTime?: number | null;
}

const apiUrl = ref("https://jsonplaceholder.typicode.com/todos/1"); // Default API
const httpMethod = ref("GET");
const requestBody = ref("{}");
const numClients = ref(10);
const testDuration = ref(10); // in seconds
const runInParallel = ref(true); // New option, true by default
const targetRps = ref<number | null>(null); // For target RPS

const isLoading = ref(false);
const testStarted = ref(false);
const testFinished = ref(false);
const successfulRequests = ref(0);
const failedRequests = ref(0);
const totalRequests = ref(0);
const rps = ref(0);
const statusCodesCount = ref<Record<number, number>>({});
const totalResponseTime = ref(0); // Sum of all response times
const averageResponseTime = ref(0); // Average response time in ms
const requestsCompletedInLastInterval = ref(0); // For new RPS calculation
const activeRequests = ref(0); // Track active ongoing requests

// Chart related refs
const timeLabels = ref<string[]>([]);
const rpsHistory = ref<number[]>([]);
const successfulHistory = ref<number[]>([]);
const failedHistory = ref<number[]>([]);
const avgResponseTimeHistory = ref<number[]>([]);

const chartData = ref<{ labels: string[]; datasets: any[] }>({
  labels: [],
  datasets: [],
});

const chartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: "index" as const,
    intersect: false,
  },
  plugins: {
    legend: {
      position: "top" as const,
    },
    title: {
      display: true,
      text: "Real-time Test Metrics",
    },
  },
  scales: {
    x: {
      title: {
        display: true,
        text: "Time (seconds)",
      },
    },
    yRequests: {
      // Y-axis for RPS, Successful, Failed
      type: "linear" as const,
      display: true,
      position: "left" as const,
      title: {
        display: true,
        text: "Count / RPS",
      },
      beginAtZero: true,
    },
    yTime: {
      // Y-axis for Average Response Time
      type: "linear" as const,
      display: true,
      position: "right" as const,
      title: {
        display: true,
        text: "Avg. Response Time (ms)",
      },
      beginAtZero: true,
      grid: {
        drawOnChartArea: false, // Only show grid for the left axis
      },
    },
  },
});

// Configuration Management
const currentConfigName = ref(""); // Name of the currently loaded/active configuration
const configNameToSave = ref(""); // Name for new config being saved via modal
const showSaveModal = ref(false);
const showHistoryModal = ref(false);

const savedConfigs = ref<Record<string, TestConfig>>({});
const LOCAL_STORAGE_KEY = 'apiTesterConfigs';

let testInterval: number | null = null;
let chartUpdateIntervalId: number | null = null; // For chart updates and new RPS calculation
let stopSignal = false;
let startTime = 0;
let secondsElapsed = 0; // To track time for chart labels

const MAX_CHART_POINTS = 60; // Keep last 60 data points

const resetStats = () => {
  successfulRequests.value = 0;
  failedRequests.value = 0;
  totalRequests.value = 0;
  rps.value = 0;
  statusCodesCount.value = {};
  totalResponseTime.value = 0;
  averageResponseTime.value = 0;
  requestsCompletedInLastInterval.value = 0; 
  activeRequests.value = 0; 
  testStarted.value = false;
  testFinished.value = false;
  stopSignal = false;
  secondsElapsed = 0;

  timeLabels.value = [];
  rpsHistory.value = [];
  successfulHistory.value = [];
  failedHistory.value = [];
  avgResponseTimeHistory.value = [];
  chartData.value = { labels: [], datasets: [] };

  if (chartUpdateIntervalId) clearInterval(chartUpdateIntervalId);
  chartUpdateIntervalId = null;
  // currentConfigName.value = ""; // Do not reset currentConfigName here, allow re-running saved config
};

const updateChartDataAndRps = () => {
  // Update RPS based on requests completed in the last second
  rps.value = requestsCompletedInLastInterval.value;
  requestsCompletedInLastInterval.value = 0; // Reset for the next interval

  timeLabels.value.push(secondsElapsed.toString());
  rpsHistory.value.push(parseFloat(rps.value.toFixed(2))); // Use the new RPS value
  successfulHistory.value.push(successfulRequests.value);
  failedHistory.value.push(failedRequests.value);
  avgResponseTimeHistory.value.push(
    parseFloat(averageResponseTime.value.toFixed(2))
  );

  if (timeLabels.value.length > MAX_CHART_POINTS) {
    timeLabels.value.shift();
    rpsHistory.value.shift();
    successfulHistory.value.shift();
    failedHistory.value.shift();
    avgResponseTimeHistory.value.shift();
  }

  chartData.value = {
    labels: [...timeLabels.value],
    datasets: [
      {
        label: "RPS",
        borderColor: "hsl(var(--p))", // DaisyUI primary color
        backgroundColor: "hsla(var(--p)/.1)",
        data: [...rpsHistory.value],
        yAxisID: "yRequests",
        tension: 0.1,
      },
      {
        label: "Successful",
        borderColor: "hsl(var(--su))", // DaisyUI success color
        backgroundColor: "hsla(var(--su)/.1)",
        data: [...successfulHistory.value],
        yAxisID: "yRequests",
        tension: 0.1,
      },
      {
        label: "Failed",
        borderColor: "hsl(var(--er))", // DaisyUI error color
        backgroundColor: "hsla(var(--er)/.1)",
        data: [...failedHistory.value],
        yAxisID: "yRequests",
        tension: 0.1,
      },
      {
        label: "Avg. Response Time (ms)",
        borderColor: "hsl(var(--in))", // DaisyUI info color
        backgroundColor: "hsla(var(--in)/.1)",
        data: [...avgResponseTimeHistory.value],
        yAxisID: "yTime",
        tension: 0.1,
      },
    ],
  };
};

const makeRequest = async () => {
  if (stopSignal) return;

  const requestStartTime = performance.now();
  totalRequests.value++;
  try {
    const options: RequestInit = {
      method: httpMethod.value,
    };
    if (httpMethod.value === "POST" || httpMethod.value === "PUT") {
      options.headers = { "Content-Type": "application/json" };
      try {
        options.body = JSON.stringify(JSON.parse(requestBody.value));
      } catch (e) {
        console.error("Invalid JSON body:", e);
        failedRequests.value++;
        // Consider how to handle invalid JSON body before sending
        return;
      }
    }

    const response = await fetch(apiUrl.value, options);
    statusCodesCount.value[response.status] =
      (statusCodesCount.value[response.status] || 0) + 1;

    if (response.ok) {
      successfulRequests.value++;
    } else {
      failedRequests.value++;
    }
  } catch (error) {
    failedRequests.value++;
    // console.error('Request error:', error);
    // For network errors or other issues, we might not have a status code.
    // You could add a special category for these if needed.
    statusCodesCount.value[0] = (statusCodesCount.value[0] || 0) + 1; // 0 for network/client errors
  } finally {
    const requestEndTime = performance.now();
    const duration = requestEndTime - requestStartTime;
    totalResponseTime.value += duration;
    requestsCompletedInLastInterval.value++; // Increment for new RPS calculation

    if (totalRequests.value > 0) {
      // Average response time is still based on total requests that have a duration
      // This part of averageResponseTime calculation might need refinement if totalRequests
      // significantly outpaces completed requests, but for now, it's based on requests that finished.
      // To be more precise, it should be totalResponseTime / (successfulRequests + failedRequests)
      // if we only want to average completed ones. Let's adjust this.
      const completedCount = successfulRequests.value + failedRequests.value;
      if (completedCount > 0) {
        averageResponseTime.value = totalResponseTime.value / completedCount;
      } else {
        averageResponseTime.value = 0;
      }
    }
  }
};

const startTest = async () => {
  if (!apiUrl.value || numClients.value <= 0 || testDuration.value <= 0) {
    alert("Please fill in all fields correctly.");
    return;
  }
  if (!runInParallel.value && (!targetRps.value || targetRps.value <= 0)) {
    alert("Target RPS must be a positive number when 'Run in Parallel' is unchecked.");
    return;
  }

  resetStats();
  isLoading.value = true;
  testStarted.value = true;
  startTime = Date.now();
  secondsElapsed = 0;
  requestsCompletedInLastInterval.value = 0; // Ensure it's reset at start

  // Initial chart data point and RPS
  updateChartDataAndRps();

  // Chart update and RPS calculation interval (every second)
  chartUpdateIntervalId = setInterval(() => {
    secondsElapsed++;
    updateChartDataAndRps();
  }, 1000);

  const clientPromises = [];

  if (runInParallel.value) {
    // "As fast as possible" mode (max speed based on numClients)
    // This was the original 'else' block
    for (let i = 0; i < numClients.value; i++) {
      const runClient = async () => {
        while (
          !stopSignal &&
          (Date.now() - startTime) < testDuration.value * 1000
        ) {
          activeRequests.value++; 
          await makeRequest().finally(() => {
            activeRequests.value--; 
          });
        }
      };
      clientPromises.push(runClient());
    }
  } else {
    // Rate-limited mode (Target RPS specified)
    // This was the original 'if (targetRps.value && targetRps.value > 0)' block
    // Ensure targetRps is valid (already checked at the beginning of startTest)
    const effectiveTargetRps = targetRps.value!; // Not null due to earlier check
    const delayPerRequest = 1000 / effectiveTargetRps;
    
    const runRateLimitedRequests = async () => {
      while (!stopSignal && (Date.now() - startTime) < testDuration.value * 1000) {
        if (activeRequests.value < numClients.value) {
          activeRequests.value++;
          makeRequest().finally(() => {
            activeRequests.value--;
          });
          await new Promise(resolve => setTimeout(resolve, delayPerRequest));
        } else {
          await new Promise(resolve => setTimeout(resolve, Math.min(delayPerRequest / 4, 50)));
        }
      }
    };
    clientPromises.push(runRateLimitedRequests());
  }

  // Test duration timeout
  testInterval = setTimeout(() => {
    stopTestInternal();
  }, testDuration.value * 1000);

  await Promise.all(clientPromises);

  // This part will be reached if all clients finish their loops (e.g. if stopSignal became true for other reasons)
  // or if the test duration timeout already called stopTestInternal.
  // Ensure cleanup happens only once.
  if (isLoading.value) {
    // Check if test is still considered active
    stopTestInternal();
  }
};

const stopTestInternal = () => {
  stopSignal = true;
  isLoading.value = false;
  testFinished.value = true; // Mark test as finished BEFORE updating config stats
  if (testInterval) clearInterval(testInterval);
  if (chartUpdateIntervalId) clearInterval(chartUpdateIntervalId);
  testInterval = null;
  chartUpdateIntervalId = null;

  const finalElapsedTime = (Date.now() - startTime) / 1000;
  if (finalElapsedTime > 0) {
    const globalRps =
      (successfulRequests.value + failedRequests.value) / finalElapsedTime;
    console.log(
      `Test finished. Global average RPS (completed): ${globalRps.toFixed(2)}`
    );
  } else {
    console.log("Test finished.");
  }

  // Update stats for the saved configuration if one was active
  if (currentConfigName.value && savedConfigs.value[currentConfigName.value]) {
    const conf = savedConfigs.value[currentConfigName.value];
    conf.lastTotalRequests = totalRequests.value;
    conf.lastSuccessfulRequests = successfulRequests.value;
    conf.lastFailedRequests = failedRequests.value;
    conf.lastAverageResponseTime = averageResponseTime.value;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(savedConfigs.value));
    console.log(`Stats for configuration "${currentConfigName.value}" updated.`);
  }
  
  if (requestsCompletedInLastInterval.value > 0) {
    // Potentially update chart one last time if needed
  }
};

const stopTest = () => {
  stopTestInternal();
};

const executeSaveConfiguration = () => {
  if (!configNameToSave.value.trim()) {
    alert("Please enter a name for the configuration.");
    return;
  }
  const nameToSave = configNameToSave.value.trim();
  const currentConfigData: TestConfig = {
    apiUrl: apiUrl.value,
    httpMethod: httpMethod.value,
    requestBody: requestBody.value,
    numClients: numClients.value,
    testDuration: testDuration.value,
    runInParallel: runInParallel.value,
    targetRps: targetRps.value,
    // Initialize last run stats as null or undefined if not run yet under this name
    lastTotalRequests: null,
    lastSuccessfulRequests: null,
    lastFailedRequests: null,
    lastAverageResponseTime: null,
  };

  // If saving over an existing config, preserve its last run stats unless this is a new save after a run
  if (savedConfigs.value[nameToSave] && !testFinished.value) { // if overwriting without a fresh run
    currentConfigData.lastTotalRequests = savedConfigs.value[nameToSave].lastTotalRequests;
    currentConfigData.lastSuccessfulRequests = savedConfigs.value[nameToSave].lastSuccessfulRequests;
    currentConfigData.lastFailedRequests = savedConfigs.value[nameToSave].lastFailedRequests;
    currentConfigData.lastAverageResponseTime = savedConfigs.value[nameToSave].lastAverageResponseTime;
  } else if (testFinished.value) { // If test just finished, save its stats
     currentConfigData.lastTotalRequests = totalRequests.value;
     currentConfigData.lastSuccessfulRequests = successfulRequests.value;
     currentConfigData.lastFailedRequests = failedRequests.value;
     currentConfigData.lastAverageResponseTime = averageResponseTime.value;
  }


  savedConfigs.value[nameToSave] = currentConfigData;
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(savedConfigs.value));
  currentConfigName.value = nameToSave; // Set as current config
  showSaveModal.value = false;
  configNameToSave.value = ""; // Reset for next save
  alert(`Configuration "${nameToSave}" saved!`);
};

const loadConfigurationFromHistory = (nameToLoad: string) => {
  const configToLoad = savedConfigs.value[nameToLoad];
  if (configToLoad) {
    apiUrl.value = configToLoad.apiUrl;
    httpMethod.value = configToLoad.httpMethod;
    requestBody.value = configToLoad.requestBody;
    numClients.value = configToLoad.numClients;
    testDuration.value = configToLoad.testDuration;
    runInParallel.value = configToLoad.runInParallel;
    targetRps.value = configToLoad.targetRps;
    currentConfigName.value = nameToLoad; // Set current config name
    
    // Reset stats but keep the loaded config name
    const tempConfigName = currentConfigName.value;
    resetStats(); // This clears most things
    currentConfigName.value = tempConfigName; // Restore it

    showHistoryModal.value = false;
    alert(`Configuration "${nameToLoad}" loaded! Ready to start.`);
  }
};

const deleteConfiguration = (nameToDelete: string) => {
  if (!nameToDelete || !savedConfigs.value[nameToDelete]) return;
  if (confirm(`Are you sure you want to delete configuration "${nameToDelete}"?`)) {
    delete savedConfigs.value[nameToDelete];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(savedConfigs.value));
    alert(`Configuration "${nameToDelete}" deleted.`);
    if (currentConfigName.value === nameToDelete) {
        currentConfigName.value = ""; 
    }
    // No need to manage selectedConfigToLoad as it's removed
  }
};

const openHistoryModal = () => {
  // Potentially refresh from localStorage before showing, though savedConfigs should be reactive
  const storedConfigs = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (storedConfigs) {
    try {
      savedConfigs.value = JSON.parse(storedConfigs);
    } catch (e) {
      console.error("Error parsing saved configurations from localStorage:", e);
    }
  }
  showHistoryModal.value = true;
};


onMounted(() => {
  const storedConfigs = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (storedConfigs) {
    try {
      savedConfigs.value = JSON.parse(storedConfigs);
    } catch (e) {
      console.error("Error parsing saved configurations from localStorage:", e);
      localStorage.removeItem(LOCAL_STORAGE_KEY); 
    }
  }
});

</script>

<style scoped>
/* You can add component-specific styles here if needed */
.stats {
  display: grid;
  /* Adjusted to fit 5 stats items more comfortably on smaller screens if needed */
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}
/* Ensure chart container has a defined height if not using aspect ratio */
/* .h-96 class was added directly to the div in the template */
</style>
