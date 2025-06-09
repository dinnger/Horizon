<template>
  <div class="border-b border-neutral-600 p-4">
    <CustomField v-model:value="name" type="string" name="Nombre" placeholder="Nombre del Despliegue"
      class="mb-2 w-full" :maxlength="20" />
    <div v-for="item in validName" :key="item.label" class="text-red-500 text-[10px]">
      {{ item.label }}
    </div>
    <CustomField type="textarea" v-model:value="description" name="Descripción" placeholder="Descripción del Despliegue"
      class="mb-2 w-full" :maxlength="200" />
  </div>
</template>

<script setup lang="ts">
import type { IGlobalDeploymentsEntityAttributes } from '@shared/interfaces/entities/global.deployments.interface.js';
import { computed, onMounted, ref, watch } from 'vue';
import CustomField from '../../../../shared/components/customField.vue';

const props = defineProps<{
  modelValue: { name: string, description: string } | null,
  deploySelected: IGlobalDeploymentsEntityAttributes | null
}>()
const emit = defineEmits(['update:modelValue'])

const name = ref(props.modelValue?.name || '')
const description = ref(props.modelValue?.description || '')

const validName = computed(() => {
  const arrValid = {
    minLength: {
      label: "Nombre: Menor de 3 caracteres",
      value: name.value.length >= 3
    },
    specialCharacters: {
      label: "Nombre: Sin caracteres especiales",
      value: !name.value.match(/[!@#$%^&*()_+=\[\]{};':"\\|\`\~,.<>\/?]/g)
    }
  }
  return Object.values(arrValid).filter(f => !f.value)
})

const update = () => {
  emit('update:modelValue', {
    name: name.value,
    description: description.value,
    valid: validName.value.filter(f => !f.value).length === 0
  })
}

watch(() => name.value, (value) => {
  update()
})

watch(() => description.value, (value) => {
  update()
})

onMounted(() => {
  if (props.deploySelected) {
    name.value = props.deploySelected.name
    description.value = props.deploySelected.description
  }
})
</script>