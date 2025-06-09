<template>

  <div class="w-full">
    <newRole />
    <table class="w-full">
      <thead>
        <tr>
          <th>Nombre</th>
          <th width="80px">Tags</th>
          <th width="80px">Estado</th>
          <th width="150px">Creado por</th>
          <th width="100px">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr class="custom-table" v-for="rol in list">
          <td @click="infoRole(rol)">
            {{ rol.name }}
            <div class="small">
              {{ rol.description || 'No descripción definida' }}
            </div>
          </td>
          <td @click="infoRole(rol)">
            <div class="flex gap-2">
              <span v-for="tag in rol.tags" :key="tag" class="badge badge-sm badge-soft">
                {{ tag }}
              </span>
            </div>
          </td>
          <td @click="infoRole(rol)">
            <span class="badge badge-sm badge-soft "
              :class="[rol.status.name === 'Active' ? 'badge-success' : 'badge-error']">
              {{ rol.status.name }}
            </span>
          </td>
          <td @click="infoRole(rol)">
            {{ rol.user.name }}
          </td>
          <td class="text-center">
            <div class="dropdown dropdown-end">
              <div tabindex="0" role="button" class="btn btn-sm btn-outline btn-primary">...</div>
              <div tabindex="0" class="dropdown-content card card-sm bg-base-100 z-1 w-64 shadow-md">
                <ul class="menu dropdown-content bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
                  <li v-for="option in options" :key="option.key" @click="option_role({ rol, option: option.key })">
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
import type { IRole } from '@shared/interfaces/security.interface.js';
import { onMounted, ref } from 'vue';
import { toast } from 'vue-sonner';
import { useSocket } from '../../../stores/socket';
import newRole from './new.roles.vue';

const socket = useSocket()

const list = ref<IRole[]>([])
const roleSelected = ref<IRole | null>(null)

const options = [
  {
    label: 'Asignación de permisos',
    key: 'assign_permissions'
  },
  {
    label: 'Deshabilitar Rol',
    key: 'disable_role'
  }
]

const getList = () => {
  socket.socketEmit('server/security/role/all', {}, (value: { error?: string, roles?: any }) => {
    if (value.error) return toast.error(value.error)
    list.value = value.roles
  })
}

const infoRole = (rol: IRole) => {
  roleSelected.value = rol
}

const option_role = ({ rol, option }: { rol: IRole, option: string }) => {
  if (option === 'disable_role') disable_role({ rol: rol.id })
}

const disable_role = ({ rol }: { rol: number }) => {
  socket.socketEmit('server/security/role/disable', { role: rol }, (value: { error?: string }) => {
    if (value.error) return toast.error(value.error)
    toast.success('Rol deshabilitado exitosamente')
    getList()
  })
}

onMounted(() => {
  getList()
})
</script>