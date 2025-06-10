<template>
  <div class="flex-1" v-if="selectStep">
    {{ selectStep.label }}
    <div
      v-if="selectStep.type === 'buttons'"
      class="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2"
    >
      <CustomButton
        v-for="(button, key) of selectStep.element"
        :key="key"
        :active="buttonSelect === String(key)"
        @click="$emit('selectButton', key)"
      >
        <span class="mdi" :class="button.icon"></span>
        {{ button.label }}
      </CustomButton>
    </div>
    <div v-if="selectStep.type === 'fields'" class="mb-4">
      <CustomFields v-model:value="selectStep.element" />
    </div>
  </div>
</template>

<script setup lang="ts">
import CustomButton from "./customButton.vue";
import CustomFields from "./customFields.vue";
import { defineProps, defineEmits } from "vue";

defineProps<{
  selectStep: any;
  buttonSelect: string | null;
}>();

defineEmits(["selectButton"]);
</script>
