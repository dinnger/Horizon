<template>
  <div>
    <CustomNew
      ref="customNew"
      :title="'Nuevo Despliegue'"
      :buttonTitle="'Crear Despliegue'"
      :steps="steps"
    />
    <dialog id="my_modal_1" class="modal" :class="{ 'modal-open': showNew }">
      <div class="modal-box w-11/12 max-w-4xl">
        <h3 class="text-lg font-bold">Nuevo Despliegue</h3>
        <div class="border-b border-neutral-600/40 mb-2 mt-2"></div>
        <div class="flex flex-col gap-2 ">
          <div class="flex-1">
            <NewListDeploy ref="newListDeploy" v-model="typeDeploySelected" :deploySelected="deploySelected" />
          </div>
          <div class="tabs tabs-border" v-if="typeDeploySelected">
            <label class="tab">
              <input type="radio" name="my_tabs_4" :checked="true" />
              <span class="mdi mdi-information-outline text-lg mr-2"></span> Información
            </label>
            <div class="tab-content p-2 bg-neutral-950/10 ">
              <NewInfoDeploy v-model="infoDeploy" :deploySelected="deploySelected" />
            </div>
            <label class="tab">
              <input type="radio" name="my_tabs_4" />
              <span class="mdi mdi-cog-outline text-lg mr-2"></span> Propiedades
            </label>
            <div class="tab-content p-2 bg-neutral-950/10 ">
              <NewPropertiesDeploy :typeDeploySelected="typeDeploySelected" :deploySelected="deploySelected" />
            </div>
            <label class="tab">
              <input type="radio" name="my_tabs_4" />
              <span class="mdi mdi-security text-lg mr-2"></span> Seguridad
            </label>
            <div class="tab-content p-2 bg-neutral-950/10 ">
              <NewSecurityDeploy :typeDeploySelected="typeDeploySelected" :deploySelected="deploySelected" />
            </div>
          </div>

          <div class="flex justify-end mt-4">
            <CustomButton v-if="!deploySelected" type="success" :disabled="!infoDeploy?.valid"
              @click="saveDeploy(false)">
              Crear Despliegue
            </CustomButton>
            <CustomButton v-else type="success" :disabled="!infoDeploy?.valid" @click="saveDeploy(true)">
              Guardar Cambios
            </CustomButton>
          </div>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="closeModal">close</button>
      </form>
    </dialog>
  
  </div>
</template>

<script setup lang="ts">
import type { IGlobalDeploymentsEntityAttributes } from '@shared/interfaces/entities/global.deployments.interface.js'
import { ref, watch } from 'vue'
import { useSocket } from '../../../../stores/socket'
import { toast } from 'vue-sonner'
import NewInfoDeploy from './newInfo.deploy.vue'
import CustomButton from '../../../../shared/components/customButton.vue'
import CustomNew from '../../../../shared/components/customNew.vue'
import type { IClientStepContent } from '@shared/interfaces/client.interface'
// import NewPropertiesDeploy from './newProperties.deploy.vue';

interface IDeploy {
	name: string
	info: { title: string; desc: string; icon: string }
	properties: { [key: string]: any }
}

const socket = useSocket()
const props = defineProps<{
	deploySelected: IGlobalDeploymentsEntityAttributes | null
}>()
const emit = defineEmits(['update:refreshList', 'update:clear'])

const showNew = ref(false)
const typeDeploySelected = ref<IDeploy | null>(null)
const infoDeploy = ref<{ name: string; description: string; valid: boolean } | null>(null)
const steps = ref<IClientStepContent>({
	info: {
		type: 'buttons',
		label: 'Información de la Despliegue',
		description: 'Información de la Despliegue',
		fieldDatabase: 'info',
		element: {
			name: {
				label: 'Nombre',
				icon: '󰈹'
			}
		}
	}
})

// const loadDeploys = () => {
// 	return new Promise((resolve) => {
// 		socket.socketEmit('server/plugins/deploys/get', {}, (value: { error?: string; deploys?: IDeploy[] }) => {
// 			if (value.error) return toast.error(value.error)
// 			return resolve(value.deploys || [])
// 		})
// 	})
// }

// const newDeploy = () => {
// 	emit('update:clear')
// 	infoDeploy.value = null
// 	showNew.value = true
// }

const closeModal = () => {
	emit('update:clear')
	typeDeploySelected.value = null
	showNew.value = false
}

const saveDeploy = (isEdit = false) => {
	if (!typeDeploySelected.value) return
	const data: IGlobalDeploymentsEntityAttributes = {
		name: infoDeploy.value?.name || '',
		description: infoDeploy.value?.description || '',
		plugin: typeDeploySelected.value.name,
		plugin_name: typeDeploySelected.value.info.title,
		properties: typeDeploySelected.value.properties
	}
	if (isEdit) data.id = props.deploySelected?.id
	console.log(data)
	socket.socketEmit(`server/global/deploy/${isEdit ? 'edit' : 'new'}`, data, (value: { error?: string }) => {
		if (value.error) return toast.error(value.error)
		toast.success('Despliegue creado exitosamente')
		showNew.value = false
		infoDeploy.value = null
		emit('update:refreshList')
	})
}

watch(
	() => props.deploySelected,
	(value) => {
		if (value) {
			showNew.value = true
		}
	}
)
</script>