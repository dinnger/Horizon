<template>

  <div class="drawer drawer-end">
    <input id="my-drawer-4" type="checkbox" class="drawer-toggle" />
    <div class="drawer-content">
      <!-- Page content here -->
      <label for="my-drawer-4" class="drawer-button btn btn-primary">Open drawer</label>
    </div>
    <div class="drawer-side" v-if="infoRole">
      <label for="my-drawer-4" aria-label="close sidebar" class="drawer-overlay"></label>
      Rol:
      <CustomField v-model:value="infoRole.name" name="rol" type="string" placeholder="Nombre del rol" class="mb-2"
        :disabled="!infoRole.isEdit" />
      Descripción:
      <CustomField v-model:value="infoRole.description" name="description" type="textarea"
        placeholder="Descripción del rol" class="mb-2" :disabled="!infoRole.isEdit" />
      Tags:
      {{ infoRole.tags }}
      <!-- <NDynamicTags v-model:value="infoRole.tags" placeholder="Tags" size="small" class="mb-2"
        :disabled="!infoRole.isEdit" /> -->
    </div>
  </div>


</template>

<script setup lang="ts">
import type { IRole } from '@shared/interfaces/security.interface.js';
import { ref, watch } from 'vue';
import CustomField from '../../../shared/components/customField.vue';

interface IRoleEdit extends IRole {
  isEdit: boolean
}

const props = defineProps<{
  role: IRole | null
}>()
const emit = defineEmits(['update:role'])

const infoRole = ref<IRoleEdit | null>(null)
const showRole = ref(false)

watch(() => props.role, (value) => {
  if (value) {
    infoRole.value = { ...value, isEdit: false }
    showRole.value = true
  }
})

watch(() => showRole.value, (value) => {
  if (!value) {
    emit('update:role', null)
  }
})




</script>