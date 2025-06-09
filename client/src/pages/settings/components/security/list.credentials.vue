<template>
  <div>
    <div class="flex justify-end">
      <CustomNew v-if="steps" ref="customNew" :title="'Nueva Credencial'" :buttonTitle="'Crear Credencial'"
        :steps="steps" />
    </div>
    <div v-if="list.length > 0">
      <table class="table w-full">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Tipo</th>
            <th class="w-20">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(credential, index) in list" :key="index">
            <td>{{ credential.name }}</td>
            <td>{{ credential.type }}</td>
            <td class="flex gap-2">
              <button class="btn btn-sm btn-primary" @click="viewCredential(credential.id)">
                Ver
              </button>
              <button class="btn btn-sm btn-secondary" @click="editCredential(credential.id)">
                Editar
              </button>
              <button class="btn btn-sm btn-error" @click="deleteCredential(credential.id)">
                Eliminar
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Modal para ver los detalles de la credencial -->
      <dialog id="credential_details_modal" class="modal" :class="{ 'modal-open': showCredentialDetails }">
        <div class="modal-box">
          <h3 class="text-lg font-bold">Detalles de la Credencial</h3>
          <div class="border-b border-neutral-600/40 mb-4 mt-2"></div>

          <div v-if="selectedCredential">
            <div class="grid grid-cols-2 gap-4">
              <div class="font-bold">Nombre:</div>
              <div>{{ selectedCredential.name }}</div>

              <div class="font-bold">Tipo:</div>
              <div>{{ selectedCredential.type }}</div>

              <div class="font-bold">Propiedades:</div>
              <div class="whitespace-pre-wrap">
                {{ JSON.stringify(selectedCredential.properties, null, 2) }}
              </div>
            </div>
          </div>

          <div class="flex justify-end mt-4">
            <button class="btn btn-primary" @click="showCredentialDetails = false">
              Cerrar
            </button>
          </div>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button @click="showCredentialDetails = false">close</button>
        </form>
      </dialog>
    </div>
    <CustomEmpty v-else description="Sin credenciales disponibles" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useSocket } from '../../../../stores/socket'
import CustomEmpty from '../../../../shared/components/customEmpty.vue'
import CustomNew from '../../../../shared/components/customNew.vue'
import { listCredentialsSteps } from './list.credentials'
import type { IClientStepButtons, IClientStepContent, IClientStepType } from '@shared/interfaces/client.interface'

const socket = useSocket()

const listCredentials = ref<{ key: string; label: string; icon: string; description: string }[]>([])
const list = ref<any[]>([])
const newCredential = ref<any>(null)
const selectedCredential = ref<any>(null)
const showCredentialDetails = ref(false)
const editCredentialData = ref<any>(null)
const steps = ref<any | null>(null)

const getProperties = (value: any): Promise<any> => {
  return new Promise((resolve) => {
    socket.socketEmit('server/security/credentials/getProperties', { name: value }, (value: any) => {
      if (value.error) return resolve({})
      resolve(value)
    })
  })
}

const getCredentialsActions = async (value: any): Promise<any> => {
  return new Promise((resolve) => {
    socket.socketEmit(
      'server/security/credentials/getActions',
      { name: value },
      (resp: { name: string; label: string }[] | string[] | { error: string }) => {
        if (!resp || (!Array.isArray(resp) && (resp as { error?: string }).error)) return resolve([])
        const data = Array.isArray(resp)
          ? resp.map((element: any) => {
            return {
              label: element.label || element[1] || element[0],
              onActions: ({ steps }: { steps: IClientStepContent }) => {
                const name = steps.info.type === 'fields' ? String(steps.info.element.name) || '' : ''
                return save({ name, type: value, action: element.name || element[0], data: steps })
              }
            }
          })
          : []
        resolve(data)
      }
    )
  })
}

const validName = ({ name, type }: { name: string; type: string }) => {
  return new Promise((resolve) => {
    socket.socketEmit('server/security/credentials/validName', { name, type }, (response: any) => {
      console.log(response)
      if (!response || response.error) return resolve({ alert: response?.error || 'Error no definido', type: 'error' })
      return resolve('properties')
    })
  })
}

const save = ({ name, type, action, data }: { name: string; type: string; action: string; data: IClientStepContent }) => {
  return new Promise((resolve) => {
    socket.socketEmit('server/security/credentials/save', { name, type, action, data }, (response: any) => {
      if (!response || response.error) return resolve({ alert: response?.error || 'Error no definido', type: 'error' })
      loadCredentialsList()
      return resolve(response)
    })
  })
}

const viewCredential = (id: number) => {
  socket.socketEmit('server/security/credentials/getById', { id }, (response: any) => {
    if (response.error) {
      console.error(response.error)
      return
    }

    selectedCredential.value = response.credential
    showCredentialDetails.value = true
  })
}

const editCredential = (id: number) => {
  socket.socketEmit('server/security/credentials/getById', { id }, (response: any) => {
    if (response.error) {
      console.error(response.error)
      return
    }

    const credential = response.credential

    // Buscar el tipo de credencial correspondiente
    const credentialType = listCredentials.value.find((c) => c.key === credential.credentialType)

    // Preparar los datos para edición
    editCredentialData.value = {
      id: credential.id,
      step1: {
        key: credential.credentialType,
        label: credentialType?.label || credential.type,
        icon: credentialType?.icon || 'mdi-key'
      },
      step2: [
        {
          label: 'Propiedades',
          properties: credential.properties
        }
      ]
    }

    // Abrir modal para edición
    setTimeout(() => {
      if (newCredential.value && typeof newCredential.value.openForEdit === 'function') {
        newCredential.value.openForEdit(editCredentialData.value)
      }
    }, 100)
  })
}

const deleteCredential = (id: number) => {
  if (!confirm('¿Está seguro de eliminar esta credencial?')) return

  socket.socketEmit('server/security/credentials/delete', { id }, (response: any) => {
    if (response.error) {
      console.error(response.error)
      return
    }

    // Recargar la lista de credenciales
    loadCredentialsList()
  })
}

const loadCredentialsList = () => {
  socket.socketEmit('server/security/credentials/getAll', {}, (response: any) => {
    if (response.error) return console.log(response.error)
    list.value = response.credentials || []
  })
}

const loadCredentials = async (): Promise<IClientStepButtons> => {
  return new Promise((resolve) => {
    const list: IClientStepButtons = {}
    socket.socketEmit('server/security/credentials/list', {}, (value: any) => {
      if (value.error) return resolve(list)
      for (const key of Object.keys(value)) {
        list[key] = {
          icon: value[key].info.icon || '',
          label: value[key].info.title || key,
          description: value[key].info.desc || '',
          onActions: async ({ step }) => {
            if (step.type === 'fields') return ''
            steps.value.properties.element = await getProperties(step.value)
            steps.value.properties.onActions = await getCredentialsActions(step.value)
            return 'info'
          }
        }
      }
      return resolve(list)
    })
  })
}

onMounted(async () => {
  steps.value = listCredentialsSteps({
    listCrendentials: await loadCredentials()
  })
  steps.value.info.onActions = {
    onActions: ({ step, steps }: { step: IClientStepType; steps: IClientStepContent }) => {
      return validName({ name: String(step.element.name) || '', type: String(steps.credentials) })
    }
  }
  // Cargar la lista de credenciales guardadas
  loadCredentialsList()
})
</script>
