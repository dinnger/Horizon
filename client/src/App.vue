<template>
  <div :class="main.theme" style="padding:0;margin:0;height:100vh" :data-theme="theme">
    <Toaster :theme="(main.theme as any)" closeButton richColors />
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterView } from 'vue-router'
import { useMain } from './stores/main'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import { Toaster } from 'vue-sonner'

hljs.registerLanguage('javascript', javascript)

const main = useMain()
const theme = ref<string>(main.theme === 'dark' ? 'dark' : 'corporate')

watch(
	() => main.theme,
	() => {
		theme.value = main.theme === 'dark' ? 'dark' : 'corporate'
	}
)
</script>
