<template>

  <div class="w-full ">
    <CustomNew ref="customNew" :title="'Nuevo Despliegue'" :buttonTitle="'Crear Despliegue'" :steps="steps" />
    <table class="table w-full">
      <thead>
        <tr>
          <th>Nombre</th>
          <th width="80px">Plugin</th>
          <th width="80px">Estado</th>
          <th width="100px">Creado por</th>
          <th width="100px">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="deploy in list">
          <td @click="infoDeploy(deploy)">
            {{ deploy.name }}
            <div class="text-[12px] text-base-content/30">
              {{ deploy.description || 'No descripción definida' }}
            </div>
          </td>
          <td @click="infoDeploy(deploy)">
            <div class="flex gap-2">
              {{ deploy.plugin }}
            </div>
          </td>
          <td @click="infoDeploy(deploy)">
            <span class="badge badge-sm badge-soft "
              :class="[deploy?.status?.name === 'Active' ? 'badge-success' : 'badge-error']">
              {{ deploy?.status?.name }}
            </span>
          </td>
          <td @click="infoDeploy(deploy)">
            {{ deploy?.user?.name }}
          </td>
          <td class="text-center">
            <div class="dropdown dropdown-end">
              <div tabindex="0" role="button" class="btn btn-sm btn-outline btn-primary">...</div>
              <div tabindex="0" class="dropdown-content card card-sm bg-base-100 z-1 w-64 shadow-md">
                <ul class="menu dropdown-content bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
                  <li v-for="option in options" :key="option.key" @click="action(option.key, deploy)">
                    <a>{{ option.label }}</a>
                  </li>
                </ul>
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { IClientActionResponse, IClientStepButtons, IClientStepContent } from '@shared/interfaces/client.interface'
import type { IGlobalDeploymentsEntity } from '@entities/global.deployments.interface.js'
import { onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { useSocket } from '../../../../stores/socket'
import CustomNew from '../../../../shared/components/customNew.vue'

const socket = useSocket()

const list = ref<any[]>([])
const deploySelected = ref<IGlobalDeploymentsEntity | null>(null)
const steps = ref<IClientStepContent>({
  deploy: {
    type: 'buttons',
    label: 'Listado de Despliegues',
    description: 'Seleccione un despliegue para ver más información',
    fieldDatabase: 'info',
    element: {
      name: {
        label: 'Nombre',
        icon: '󰈹'
      }
    }
  },
  info: {
    type: 'fields',
    label: 'Información de la Despliegue',
    fieldDatabase: 'info',
    element: {
      name: {
        name: 'Nombre:',
        type: 'string',
        value: '',
        required: true,
        onValidation: {
          pattern: '^[a-zA-Z0-9_]{3,}$',
          hint: ['Debe de ser de 3 a 20 caracteres', 'Solo letras, números y guiones bajos']
        },
        onTransform: (v) => v.toUpperCase()
      },
      description: {
        name: 'Descripción:',
        type: 'string',
        value: ''
      }
    },
    onActions: {
      label: 'Siguiente',
      onActions: ({ steps }: { steps: IClientStepContent }) => {
        return validName({ name: String(steps.info.element.name) || '' })
      }
    }
  },
  properties: {
    type: 'fields',
    label: 'Propiedades',
    fieldDatabase: 'properties',
    element: {},
    onActions: [{
      label: 'Crear Despliegue',
      onActions: async ({ steps }) => {
        return await saveDeploy({ steps })
      }
    }]
  }
})

const options = [
  {
    label: 'Eliminar',
    key: 'delete'
  }
]

const loadDeploys = (): Promise<IClientStepButtons> => {
  return new Promise((resolve) => {
    socket.socketEmit('server/plugins/deploys/get', {}, (value: { error?: string; deploys?: any }) => {
      if (!value || value.error) {
        toast.error(value?.error || 'Error no definido')
        return resolve({})
      }
      const deploysObj: IClientStepButtons = {}
      for (const deploy of value.deploys) {
        deploysObj[deploy.type] = {
          label: deploy.info.title,
          icon: deploy.info.icon,
          description: deploy.info.desc,
          onActions: () => {
            steps.value.properties.element = deploy.properties
            return 'info'
          }
        }
      }
      return resolve(deploysObj)
    })
  })
}

const getList = () => {
  socket.socketEmit('server/global/deploy/list', {}, (value: { error?: string; deploys?: any }) => {
    if (value.error) return toast.error(value.error)
    list.value = value.deploys
  })
}

const validName = ({ name }: { name: string; }): Promise<IClientActionResponse> => {
  return new Promise((resolve) => {
    socket.socketEmit('server/global/deploy/validName', { name }, (response: any) => {
      if (!response || response.error) return resolve({ alert: response?.error || 'Error no definido', type: 'error' })
      return resolve('properties')
    })
  })
}

const saveDeploy = ({ steps }: { steps: IClientStepContent }): Promise<IClientActionResponse> => {
  return new Promise((resolve) => {
    const data = {
      name: steps.info.element.name,
      description: steps.info.element.description,
      plugin: steps.deploy,
      properties: steps.properties?.element
    }
    socket.socketEmit('server/global/deploy/save', data, (response: any) => {
      if (!response || response.error) return resolve({ alert: response?.error || 'Error no definido', type: 'error' })
      getList()
      resolve(response)
    })
  })
}

const infoDeploy = (deploy: IGlobalDeploymentsEntity) => {
  deploySelected.value = deploy
}

const action = (option: string, deploy: IGlobalDeploymentsEntity) => {
  if (option === 'delete') deleteDeploy(deploy)
}

const deleteDeploy = (deploy: IGlobalDeploymentsEntity) => {
  socket.socketEmit('server/global/deploy/delete', { id: deploy.id }, (value: { error?: string }) => {
    if (value.error) return toast.error(value.error)
    toast.success('Despliegue eliminado exitosamente')
    getList()
  })
}

onMounted(async () => {
  getList()
  steps.value.deploy.element = await loadDeploys()
})
</script>