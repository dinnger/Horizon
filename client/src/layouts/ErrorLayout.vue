<template>
  <div class="min-h-screen bg-gradient-to-br from-error/10 via-base-100 to-warning/10 flex flex-col"
    :data-theme="settingsStore.currentTheme">
    <!-- Header -->
    <header class="p-6">
      <div class="container mx-auto">
        <div class="flex items-center justify-between">
          <router-link to="/" class="flex items-center space-x-2">
            <div class="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z" />
              </svg>
            </div>
            <span class="text-xl font-bold text-base-content">Horizon</span>
          </router-link>

          <!-- Theme Switcher -->
          <div class="dropdown dropdown-end">
            <div tabindex="0" role="button" class="btn btn-ghost btn-sm">
              <component :is="themeIcon" class="w-5 h-5" />
            </div>
            <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
              <li v-for="theme in themes" :key="theme.value">
                <a @click="setTheme(theme.value)" :class="{ 'active': settingsStore.currentTheme === theme.value }">
                  <component :is="theme.icon" class="w-4 h-4" />
                  {{ theme.label }}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 flex items-center justify-center p-6">
      <div class="text-center max-w-2xl mx-auto">
        <router-view />

        <!-- Botones de navegación por defecto -->
        <div class="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <button @click="goBack" class="btn btn-outline">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver Atrás
          </button>
          <router-link to="/" class="btn btn-primary">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Ir al Inicio
          </router-link>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="p-6">
      <div class="text-center text-sm text-base-content/60">
        © 2025 Horizon Project Management. Todos los derechos reservados.
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import IconSun from '../components/icons/IconSun.vue'
import IconMoon from '../components/icons/IconMoon.vue'
import IconPalette from '../components/icons/IconPalette.vue'
import { useSettingsStore } from '@/stores'

const settingsStore = useSettingsStore()

const router = useRouter()

const themes = [
  { value: 'crystal', label: 'Crystal Light', icon: IconSun },
  { value: 'crystal-dark', label: 'Crystal Dark', icon: IconMoon },
  { value: 'light', label: 'Light', icon: IconSun },
  { value: 'dark', label: 'Dark', icon: IconMoon },
  { value: 'cyberpunk', label: 'Cyberpunk', icon: IconPalette },
  { value: 'synthwave', label: 'Synthwave', icon: IconPalette },
  { value: 'luxury', label: 'Luxury', icon: IconPalette },
  { value: 'dracula', label: 'Dracula', icon: IconPalette }
]

const themeIcon = computed(() => {
  if (settingsStore.currentTheme.includes('dark')) return IconMoon
  if (settingsStore.currentTheme === 'light' || settingsStore.currentTheme === 'crystal') return IconSun
  return IconPalette
})

const setTheme = (theme: string) => {
  settingsStore.setTheme(theme)
}

const goBack = () => {
  router.back()
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme') || 'crystal'
  setTheme(savedTheme)
})
</script>
