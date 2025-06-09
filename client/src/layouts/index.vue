<template>
  <div class=" content h-full  flex-row bg-[var(--bg)] p-2 ">
    <div class=" bg-black/10 dark:bg-white/5 rounded-xl overflow-hidden h-full w-full flex">
      <div class="flex flex-col justify-between bg-black/10 dark:bg-white/5">
        <component_menu />
        <component_theme />
      </div>
      <div class="flex-1  h-full overflow-auto p-3 ">
        <router-view v-if="store.socket_connect" />
        <CustomEmpty v-else class="mt-24" description="No se encontró conexión con el servidor">
          <template #icon>
            <span class="mdi mdi-lan-disconnect"></span>
          </template>
          <template #extra>
            <span class="mdi mdi-spin mdi-loading"></span> Esperando conexión
          </template>
        </CustomEmpty>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import component_menu from './components/component_menu.vue';
import component_theme from './components/component_theme.vue';
import { useSocket } from '../stores/socket';
import CustomEmpty from '../shared/components/customEmpty.vue';
const store = useSocket()
</script>
