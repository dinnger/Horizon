import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useMain = defineStore('main', () => {
	// Theme
	const theme = ref<string>(
		localStorage.getItem('theme') ||  'light'
	)
	const menu_minimize = ref(localStorage.getItem('menu_minimize') === 'true')
	function change_theme({ newTheme }: { newTheme: string }) {
		localStorage.setItem('theme', newTheme)
		theme.value = newTheme
	}
	function change_minimize_menu(value: boolean) {
		localStorage.setItem('menu_minimize', value.toString())
		menu_minimize.value = value
	}

	return {
		theme,
		change_theme,
		menu_minimize,
		change_minimize_menu
	}
})
