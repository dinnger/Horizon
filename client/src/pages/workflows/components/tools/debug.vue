<template>
  <div class="bg-black/10 flex-1 p-2 rounded-md overflow-auto relative box-border flex gap-2">
    <div>
      <div class="" v-if="!start">
        <CustomButton type="success" size="sm" ghost @click="debug('on')">
          <span class="mdi mdi-play mr-1"></span> Iniciar Debug
        </CustomButton>
      </div>
      <div v-else class="">
        <CustomButton type="error" size="sm" ghost @click="debug('off')">
          <span class="mdi mdi-stop mr-1"></span> Detener Debug
        </CustomButton>
      </div>
    </div>
    <div ref="consoleRef" class="flex-1 h-full overflow-auto">
      <NSplit direction="horizontal" style="height: 100%" :max="1" :min="0" default-size="250px">
        <template #1>
          <div class="flex flex-col h-full">
            <div class="font-bold">
              Ejecuciones:
            </div>
            <div class="overflow-auto">
              <div v-for="list of Array.from(executeList.values())" :key="list.uuid" class="p-1 cursor-pointer"
                :class="{ 'custom-active-button': selectExecute === list.uuid }" @click="selectExecute = list.uuid">
                <span class="mdi mdi-chart-timeline"></span> {{ list.date }}
              </div>
            </div>
          </div>
        </template>
        <template #2>
          <div v-if="executeInfo" class="flex flex-col h-full pl-2 pr-2">
            <div v-if="executeList.get(selectExecute)" class="mb-2">
              <span class="mdi mdi-chart-timeline"></span> {{ executeList.get(selectExecute)?.date }}
              <div class="text-[11px]">{{ executeList.get(selectExecute)?.uuid }}</div>
            </div>

            <div class="overflow-auto">
              <div v-for="(data, key) in executeInfo" :key="key" class=" p-[1px]">
                <div class="flex ">
                  <span class="custom-active-button w-36 text-center">
                    {{ data.origin }}
                  </span>
                  <span class="flex flex-col gap-1 text-sm opacity-80">
                    <span v-for="destiny of data.destiny" :key="destiny" class="custom-active-button w-36 text-center">
                      {{ destiny }}
                    </span>
                  </span>
                  <span class="text-sm opacity-80">
                    {{ data.time.executeTimeString }}ms
                  </span>
                  <span class="text-sm opacity-80">
                    {{ data.time.accumulative }}ms
                  </span>
                  <span class="text-sm opacity-80">
                    Memory: {{ data.memory }}mb
                  </span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </NSplit>
    </div>
  </div>

</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { NSplit } from 'naive-ui';
import { useRoute } from 'vue-router';
import { toast } from 'vue-sonner';
import { useSocket } from '../../../../stores/socket';
import CustomButton from '../../../../shared/components/customButton.vue';

interface HeaderExecute {
  origin: string,
  destiny: string[],
  time: { executeTimeString: string, accumulative: number },
  memory: number
}

const store = useSocket()
const route = useRoute()

const consoleRef = ref<HTMLDivElement>()
const start = ref(false)
const selectExecute = ref<string>('')
const executeList = ref<Map<string, { uuid: string, date: Date }>>(new Map())
const dataList = ref<Map<string, HeaderExecute[]>>(new Map())

const debug = (action: 'on' | 'off') => {
  if (action === 'on') {
    executeList.value.clear()
    dataList.value.clear()
  }
  store.socketEmit('server/workflows/debug', { flow: route.params.workflow_id, action }, (value: { error?: string }) => {
    if (value.error) return toast.error(value.error)
    start.value = action === 'on'
  })
}

const executeInfo = computed(() => {
  if (dataList.value.has(selectExecute.value)) {
    const data = dataList.value.get(selectExecute.value)
    return data
  }
  return null
})

onMounted(() => {

  store.socketOn('tools_debug', (value: any) => {
    if (!executeList.value.has(value.uuid)) executeList.value.set(value.uuid, { uuid: value.uuid, date: value.date })
    if (!dataList.value.has(value.uuid)) dataList.value.set(value.uuid, [])
    const data = dataList.value.get(value.uuid)
    if (data) data.push(value)
    setTimeout(() => {
      if (consoleRef.value) consoleRef.value.scrollTop = consoleRef.value.scrollHeight
    }, 100)
  })
})
onUnmounted(() => {
  store.socketOff('tools_debug')
})
</script>