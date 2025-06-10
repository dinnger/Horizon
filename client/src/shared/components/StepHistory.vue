<template>
  <div class="w-60 overflow-auto border-r border-neutral-600/40 pr-2">
    <div
      v-if="selectStep && selectStep.description"
      class="border-l-green-700 border-l-3 pl-2 py-2 mb-2 bg-black/10 rounded-md text-[13px]"
    >
      <span class="mdi mdi-information-outline text-green-700"></span>
      {{ selectStep.description }}
    </div>
    <div
      v-for="(step, key) in stepHistory"
      :key="key"
      class="border-l-green-700 border-l-3 pl-2 py-2 mb-2 bg-black/10 rounded-md"
    >
      <div class="flex-1 text-ellipsis overflow-hidden text-nowrap text-[11px]">
        {{ step.data.label }}
      </div>
      <div v-if="step.data.type === 'buttons'">
        <template v-for="(button, key) of step.data.element" :key="key">
          <span class="mdi" :class="button.icon"></span>
          {{ button.label }}
        </template>
      </div>
      <div v-else>
        <div v-for="(field, key) of step.data.element" :key="key">
          <div class="text-[11px] opacity-80 mt-2">
            {{ field.name }}
          </div>
          {{ field.value }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from "vue";
import type { IStepType } from "../interfaces/customNew.interface.js";

defineProps<{
  stepHistory: { key: string; data: IStepType }[];
  selectStep: any;
}>();
</script>
