<template>

  <div class="w-full h-full flex-1">
    <!-- <newSecret @update:refreshList="() => getList()" :optionsType="optionsType" :modelSelected="modelSelected"
      @update:clear="() => modelSelected = null" /> -->
    <div class="">
      <table class="w-full" v-if="list.length > 0">
        <thead>
          <tr>
            <th>Nombre</th>
            <th width="80px">Tipo</th>
            <th width="80px">Estado</th>
            <th width="100px">Creado por</th>
            <th width="100px">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr class="custom-table" v-for="item in list">
            <td @click="infoDeploy(item)">
              {{ item.name }}
              <div class="small">
                {{ item.description || 'Sin descripción' }}
              </div>
            </td>
            <td @click="infoDeploy(item)">
              <div class="gap-2 text-center">
                <span class="badge badge-sm badge-soft ">
                  {{ item.type.toLowerCase() }}
                </span>
                <span class="badge badge-sm badge-soft ">
                  {{ item.subType.toLowerCase() }}
                </span>
              </div>
            </td>
            <td @click="infoDeploy(item)">
              <span class="badge badge-sm badge-soft "
                :class="[item.status.name === 'Active' ? 'badge-success' : 'badge-error']">
                {{ item.status.name }}
              </span>
            </td>
            <td @click="infoDeploy(item)">
              {{ item.user.name }}
            </td>
            <td class="text-center">
              <div class="dropdown dropdown-end">
                <div tabindex="0" role="button" class="btn btn-sm btn-outline btn-primary">...</div>
                <div tabindex="0" class="dropdown-content card card-sm bg-base-100 z-1 w-64 shadow-md">
                  <ul class="menu dropdown-content bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
                    <li v-for="option in options" :key="option.key" @click="action(option.key, item)">
                      <a>{{ option.label }}</a>
                    </li>
                  </ul>
                </div>
              </div>

            </td>
          </tr>
        </tbody>
      </table>
      <CustomEmpty v-if="list.length === 0" class="mt-10" description="Sin datos">
      </CustomEmpty>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { toast } from 'vue-sonner';
import { useSocket } from '../../../../stores/socket';
import newSecret from './new.secret.vue';
import CustomEmpty from '../../../../shared/components/customEmpty.vue';

const socket = useSocket()

const list = ref<any[]>([])
const modelSelected = ref<any | null>(null)

const optionsType = [
  {
    icon: 'mdi-database',
    label: 'Database',
    value: 'DATABASE',
    subOptions: [
      {
        label: 'Mysql',
        value: 'MYSQL'
      },
      {
        label: 'Postgres',
        value: 'POSTGRES'
      },
      {
        label: 'SQLite',
        value: 'SQLITE'
      },
      {
        label: 'MariaDB',
        value: 'MARIADB'
      },
      {
        label: 'MSSQL',
        value: 'MSSQL'
      },
      {
        label: 'Oracle',
        value: 'ORACLE'
      }
    ]
  },
  {
    icon: 'mdi-code-braces',
    label: 'Variables',
    value: 'VARIABLES'
  }
]

const options = [
  {
    label: 'Eliminar',
    key: 'delete'
  },

]

const infoDeploy = (item: any) => {
  modelSelected.value = item
}

const action = (option: string, item: any) => {
  if (option === 'delete') deleteModel(item)
}

const getList = () => {
  socket.socketEmit('server/security/secret/list', {}, (value: any) => {
    if (value.error) return toast.error(value.error)
    list.value = value
  })


}

const deleteModel = (item: any) => {
  socket.socketEmit('server/security/secret/delete', { id: item.id }, (value: { error?: string }) => {
    if (value.error) return toast.error(value.error)
    toast.success('Despliegue eliminado exitosamente')
    getList()
  })
}

onMounted(() => {
  getList()
})
</script>