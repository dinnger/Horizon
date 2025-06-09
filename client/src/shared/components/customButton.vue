<template>
  <button :class="[{
    'btn  flex justify-start': true,
    'btn-primary': type === 'primary' || active,
    'btn-secondary': type === 'secondary',
    'btn-success': type === 'success',
    'btn-info': type === 'info',
    'btn-warning': type === 'warning',
    'btn-error': type === 'error',
    'btn-sm': size === 'sm',
    'btn-lg': size === 'lg',
    'btn-outline': outline,
    'btn-soft': soft,
    'btn-ghost': ghost && !active,
    ...className
  }]" :disabled="disabled" @click="$emit('click')">
    <div class="text-ellipsis overflow-hidden text-nowrap flex gap-2 items-center">
      <slot></slot>
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  permission?: string
  class?: string[]
  disabled?: boolean
  ghost?: boolean
  loading?: boolean
  soft?: boolean
  outline?: boolean
  active?: boolean
  size?: 'sm' | 'lg' | 'xl'
  type?: 'default' | 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error'
}>()
defineEmits(['click'])

const className = computed(() => {
  return props.class ? props.class : []
})
</script>