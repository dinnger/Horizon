<template>

  <div class="w-full">
    <NewPermission />
    <table class="w-full">
      <thead>
        <tr>
          <th>Slug</th>
          <th>Nombre</th>
          <th width="80px">Estado</th>
          <th width="150px">Creado por</th>
          <th width="100px">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr class="custom-table" v-for="permission in list">
          <td @click="infoRole(permission)">
            {{ permission.slug }}
          </td>
          <td @click="infoRole(permission)">
            {{ permission.name }}
            <div class="small">
              {{ permission.description || 'No descripción definida' }}
            </div>
          </td>
          <td @click="infoRole(permission)">
            <span class="badge badge-sm badge-soft "
              :class="[permission?.status?.name === 'Active' ? 'badge-success' : 'badge-error']">
              {{ permission?.status?.name }}
            </span>

          </td>
          <td @click="infoRole(permission)">
            {{ permission.user.name }}
          </td>
          <td class="text-center">
            <div class="dropdown dropdown-end">
              <div tabindex="0" role="button" class="btn btn-sm btn-outline btn-primary">...</div>
              <div tabindex="0" class="dropdown-content card card-sm bg-base-100 z-1 w-64 shadow-md">
                <ul class="menu dropdown-content bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
                  <li v-for="option in options" :key="option.key"
                    @click="option_role({ rol: permission, option: option.key })">
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
import { onMounted, ref } from 'vue';
import { toast } from 'vue-sonner';
import { useSocket } from '../../../stores/socket';
import NewPermission from './new.permission.vue';
import type { ISecurityPermissionEntity } from '@shared/interfaces/entities/security.interface.js';

const socket = useSocket()
const list = ref<ISecurityPermissionEntity[]>([])
const roleSelected = ref<ISecurityPermissionEntity | null>(null)

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
  socket.socketEmit('server/security/permission/all', {}, (value: { error?: string, roles?: any }) => {
    if (value.error) return toast.error(value.error)
    list.value = value.roles
  })
}

const infoRole = (rol: ISecurityPermissionEntity) => {
  roleSelected.value = rol
}

const option_role = ({ rol, option }: { rol: ISecurityPermissionEntity, option: string }) => {
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