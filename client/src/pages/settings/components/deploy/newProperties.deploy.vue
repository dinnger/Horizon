<template>
  <div class="flex-1 p-4 border-b border-neutral-600 ">
    <CustomEmpty v-if="!properties || Object.keys(properties).length === 0"
      description="No se han definido propiedades para este despliegue">
      <template #icon>
        <span class="mdi mdi-information-outline"></span>
      </template>
    </CustomEmpty>
    <div v-else>
      <Fields :value="properties" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IGlobalDeploymentsEntityAttributes } from '@entities/global.deployments.interface.js';
import { onMounted, ref } from 'vue';
import CustomEmpty from '../../../../shared/components/customEmpty.vue';


const props = defineProps<{
  typeDeploySelected: any,
  deploySelected: IGlobalDeploymentsEntityAttributes | null
}>()

const properties = ref({})


onMounted(() => {
  properties.value = props.typeDeploySelected.properties
  if (!props.typeDeploySelected.properties || Object.keys(props.typeDeploySelected.properties).length === 0) return null
  if (props.deploySelected) {
    for (const key of Object.keys(props.typeDeploySelected.properties)) {
      properties.value[key] = props.deploySelected.properties[key]
    }
  }
})
</script>