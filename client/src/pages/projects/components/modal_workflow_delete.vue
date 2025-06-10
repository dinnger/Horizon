<template>
  <dialog :open="show" class="modal" :class="{ 'modal-open': show }">
    <div class="modal-box">
      <h3 class="font-bold text-lg">Eliminar workflow</h3>
      <p class="py-2">Para eliminar este workflow, escribe el nombre exacto: <b>{{ workflowName }}</b></p>
      <input v-model="inputName" class="input input-bordered w-full" placeholder="Nombre del workflow" />
      <div class="flex justify-end gap-2 mt-4">
        <button class="btn" @click="$emit('close')">Cancelar</button>
        <button class="btn btn-error" :disabled="inputName !== workflowName" @click="confirmDelete">Eliminar</button>
      </div>
    </div>
  </dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
const props = defineProps<{ show: boolean, workflowName: string }>()
const emit = defineEmits(['close', 'confirm'])
const inputName = ref('')

watch(() => props.show, (val) => {
  if (val) inputName.value = ''
})

function confirmDelete() {
  emit('confirm')
}
</script>
