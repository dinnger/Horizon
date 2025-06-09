<template>
  <div class="opacity-60 mt-2">
    <div class="flex flex-col items-center justify-center">
      <div class="text-center text-3xl">
        <slot name="icon">
          <span class="mdi mdi-alert-circle-outline"></span>
        </slot>
      </div>
      <div class="text-center mt-2">
        {{ description }}
      </div>
      <div class="text-center mt-2 text-sm">
        <slot name="extra"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  description: string
}>()
</script>