import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSession = defineStore('session', () => {
	const session = localStorage.getItem('session')
	const user = ref<{ id: string; name: string; alias: string } | null>(null)
	const workspace = ref<{ id: number; name: string; description: string; is_default: boolean } | null>(null)
	const token = session ? JSON.parse(session).token : null
	const activeSession = ref(!!token)

	function setSession(token: string) {
		localStorage.setItem('session', JSON.stringify({ token }))
		activeSession.value = true
	}

	function setUser({ id, name, alias }: { id: string; name: string; alias: string }) {
		user.value = { id, name, alias }
	}

	function setWorkspace({ id, name, description, is_default }: { id: number; name: string; description: string; is_default: boolean }) {
		workspace.value = { id, name, description, is_default }
	}

	function removeSession() {
		localStorage.removeItem('session')
		user.value = null
		workspace.value = null
		activeSession.value = false
	}

	return { token, activeSession, user, workspace, setSession, setUser, setWorkspace, removeSession }
})
