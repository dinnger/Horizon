<template>
  <div>
    <div v-if="validationResult" :class="resultClass" class="p-3 rounded mb-3">
      {{ validationResult.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const validationResult = ref<null | { success: boolean; message: string }>(null);
const resultClass = computed(() => {
  if (!validationResult.value) return '';
  return validationResult.value.success ? 'bg-success text-success-content' : 'bg-error text-error-content';
});

// Método público para establecer el resultado de la validación
const setValidationResult = (result: { success: boolean; message: string }) => {
  validationResult.value = result;
  // Limpiar el mensaje después de 5 segundos
  setTimeout(() => {
    validationResult.value = null;
  }, 5000);
};

// Exponer métodos al componente padre
defineExpose({
  setValidationResult
});
</script>