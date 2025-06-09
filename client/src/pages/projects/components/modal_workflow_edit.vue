<template>
  <dialog :open="show" class="modal" :class="{ 'modal-open': show }">
    <div class="modal-box">
      {{ show }}
      <h3 class="font-bold text-lg">Editar nombre del workflow</h3>
      <input v-model="inputName" class="input input-bordered w-full" placeholder="Nuevo nombre" />
      <div class="flex justify-end gap-2 mt-4">
        <button class="btn" @click="$emit('close')">Cancelar</button>
        <button class="btn btn-primary" :disabled="!inputName.trim()" @click="confirmEdit">Guardar</button>
      </div>
    </div>
  </dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
const props = defineProps<{ show: boolean, currentName: string }>()
const emit = defineEmits(['close', 'confirm'])
const inputName = ref('')

watch(() => props.show, (val) => {
  if (val) inputName.value = props.currentName
})

function confirmEdit() {
  emit('confirm', inputName.value)
}
</script>
