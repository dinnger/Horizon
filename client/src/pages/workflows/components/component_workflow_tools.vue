<template>
  <div class="absolute bottom-0 left-0   p-2 flex justify-between gap-4">
    <span class="absolute bottom-11 left-2 text-sm">
      zoom : {{ (zoom * 100).toFixed(0) }}% | x : {{ canvas_relative_pos.x.toFixed(0) }} | y : {{
        canvas_relative_pos.y.toFixed(0) }}
    </span>
    <div class="join">
      <CustomButton soft size="sm" @click="zoomIn">
        <span class="mdi mdi-plus"></span>
      </CustomButton>
      <CustomButton soft size="sm" @click="zoomCenter">
        <span class="mdi mdi-arrow-expand-all"></span>
      </CustomButton>
      <CustomButton soft size="sm" @click="zoomOut">
        <span class="mdi mdi-minus"></span>
      </CustomButton>
    </div>
    <div class="join">
      <CustomButton soft size="sm" @click="local_select_type = 'cursor'" :active="local_select_type === 'cursor'">
        <span class="mdi mdi-cursor-default"></span>
      </CustomButton>
      <CustomButton soft size="sm" @click="local_select_type = 'move'" :active="local_select_type === 'move'">
        <span class="mdi mdi-hand-back-left"></span>
      </CustomButton>
    </div>

  </div>
</template>

<script setup lang="ts">
import type { IWorkflow } from '@shared/interface/workflow.interface.js';
import type { Canvas } from '../utils/canvas';
import { ref, watch } from 'vue';
import CustomButton from '../../../shared/components/customButton.vue';

const props = defineProps<{
  workflow: IWorkflow
  canvasInstance: Canvas,
  select_type: 'cursor' | 'move'
}>()
const emits = defineEmits<(e: 'select_type', value: 'cursor' | 'move') => void>()

const zoom = ref<number>(1)
const local_select_type = ref<'cursor' | 'move'>('cursor')
const canvas_relative_pos = ref<{ x: number; y: number }>({ x: 0, y: 0 })


watch(() => props.canvasInstance.canvasRelativePos, (value) => {
  canvas_relative_pos.value = value
})

watch(() => props.canvasInstance.canvasFactor, (value) => {
  zoom.value = value
})

watch(() => local_select_type.value, (value) => {
  local_select_type.value = value
  emits('select_type', value)
})

watch(() => props.select_type, (value) => {
  local_select_type.value = value
})

const zoomIn = () => {
  if (!props.canvasInstance) return
  props.canvasInstance.actionZoomIn()
}
const zoomCenter = () => {
  if (!props.canvasInstance) return
  zoom.value = 1
  props.canvasInstance.actionZoomCenter()
}
const zoomOut = () => {
  if (!props.canvasInstance) return
  props.canvasInstance.actionZoomOut
}
</script>