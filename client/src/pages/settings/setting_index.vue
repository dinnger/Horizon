<template>
  <div class="flex flex-col h-full">
    <h2 class="text-xl mb-2">
      Configuración
    </h2>
    <div class="flex flex-col md:flex-row h-full overflow-auto dark:bg-black/30 bg-neutral-200 rounded-md ">
      <div class="bg-black/5 dark:bg-white/4 p-2 rounded-md">
        <div class="flex md:flex-col flex-wrap overflow-auto  p-1">
          <CustomButton v-for="option in options" :key="option.key" ghost :active="activeRouter(option)"
            @click="$router.push(`/settings/${option.key}`)">
            <span class="mdi" :class="option.icon"></span>
            <div>{{ option.label }}</div>
          </CustomButton>
        </div>
      </div>
      <div class="flex-1  overflow-auto p-2">
        <div v-if="route.name === 'settings'">
          <CustomEmpty description="Seleccione una opción" class="mt-24">
          </CustomEmpty>
        </div>
        <div v-else class=" overflow-auto flex-1 h-full">
          <router-view></router-view>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import CustomButton from '../../shared/components/customButton.vue'
import CustomEmpty from '../../shared/components/customEmpty.vue'

const route = useRoute()

const options = [
	{
		label: 'Empresa',
		key: 'company',
		icon: 'mdi-domain',
		description: 'Gestiona la empresa'
	},
	{
		label: 'Usuarios',
		key: 'users',
		icon: 'mdi-account-multiple',
		description: 'Gestiona los usuarios de la aplicación'
	},
	{
		label: 'Roles y Permisos',
		key: 'roles',
		icon: 'mdi-home-lock-open',
		description: 'Gestiona los roles y permisos de la aplicación'
	},
	{
		label: 'Despliegues',
		key: 'deploys',
		icon: 'mdi-package-variant',
		description: 'Gestiona los despliegues de la aplicación'
	},
	{
		label: 'Plugins',
		key: 'plugins',
		icon: 'mdi-puzzle',
		description: 'Gestiona los plugins de la aplicación'
	},
	{
		label: 'Seguridad',
		key: 'security',
		icon: 'mdi-shield-lock-outline',
		description: 'Gestiona la seguridad de la aplicación'
	},
	{
		label: 'Configuración',
		key: 'config',
		icon: 'mdi-cog',
		description: 'Gestiona la configuración de la aplicación'
	}
]

const activeRouter = (item: any) => {
	return !!(route.name?.toString() || '').includes(item.key)
}
</script>