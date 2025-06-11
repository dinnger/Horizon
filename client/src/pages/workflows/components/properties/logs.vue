<template>
  Al iniciar:
  <div class="pl-2 pt-1 pb-1 border-l-2 border-neutral-800 mt-1 flex flex-col mb-2">
    <CustomField v-model:value="start.type" type="options" name="Info" :options="options"
      @update:value="(val) => { if (val === 'none') start.value = '' }" />

    <div class="w-full">
      <CustomField v-model:value="start.value" type="code" lang="json" name="Info" :disabled="start.type === 'none'" />
    </div>
  </div>
  Al ejecutar:
  <div class="pl-2 pt-1 pb-1 border-l-2 border-neutral-800 mt-1 flex flex-col">
    <CustomField v-model:value="exec.type" type="options" name="Info" :options="options"
      @update:value="(val) => { if (val === 'none') exec.value = '' }" />
    <div>
      <CustomField v-model:value="exec.value" type="code" lang="json" name="Info" :disabled="exec.type === 'none'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import CustomField from '../../../../shared/components/customField.vue';

const props = defineProps(['node', 'canvasInstance'])

const start = ref({
  type: 'none',
  value: ''
})
const exec = ref({
  type: 'none',
  value: ''
})
const options = [
  {
    label: 'Sin Logs',
    value: 'none'
  },
  {
    label: 'Info',
    value: 'info'
  },
  {
    label: 'Error',
    value: 'error'
  },
  {
    label: 'Warning',
    value: 'warn'
  },
  {
    label: 'Debug',
    value: 'debug'
  }
]

watch(() => start.value, (value) => {
  if (!props.node.meta) props.node.meta = {}
  if (!props.node.meta.logs) props.node.meta.logs = {}
  if (!props.node.meta.logs.start) props.node.meta.logs.start = {}
  props.node.meta.logs.start = value

}, { deep: true })

watch(() => exec.value, (value) => {
  if (!props.node.meta) props.node.meta = {}
  if (!props.node.meta.logs) props.node.meta.logs = {}
  if (!props.node.meta.logs.exec) props.node.meta.logs.exec = {}
  props.node.meta.logs.exec = value

}, { deep: true })

watch(() => props.node.meta, () => {
  loadMeta()
})

const loadMeta = () => {
  if (!props.node.meta || !props.node.meta.logs) {
    start.value = {
      type: 'none',
      value: ''
    }
    exec.value = {
      type: 'none',
      value: ''
    }
    return
  }
  const value = props.node.meta.logs
  start.value = value.start || {
    type: 'none',
    value: ''
  }
  exec.value = value.exec || {
    type: 'none',
    value: ''
  }
}
onMounted(() => {
  loadMeta()
})



</script>