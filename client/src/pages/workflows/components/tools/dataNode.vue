<template>
  <div ref="consoleRef" class="bg-black/10 flex-1 p-2 rounded-md overflow-auto">
    <div class="search-container">
      <input type="text" v-model="searchTerm" placeholder="Buscar en JSON..." @input="handleSearch" class="search-input"/>
    </div>
    <JsonNode 
      v-if="jsonData !== null" 
      :node-data="jsonData"
      path="root"
      :expanded-state="currentExpandedState"
      :search-term="debouncedSearchTerm"
      @toggle-expand="handleToggleExpand"
      @copy-node="handleCopyNode"
    />
    <div v-else>
      <p>Esperando datos...</p>
    </div>
    <button v-if="consoleData" @click="copyAllJson" class="copy-all-button">Copiar Todo el JSON</button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue'
import JsonNode from './JsonNode.vue'
import { useSocket } from '../../../../stores/socket'
const store = useSocket()

const consoleData = ref<string>('')
const jsonData = ref<any>(null)
const consoleRef = ref<HTMLDivElement>()
const baseExpandedState = ref<Record<string, boolean>>({}) // Estado base de expansión manual
const searchInducedExpandedState = ref<Record<string, boolean>>({}) // Estado de expansión por búsqueda
const searchTerm = ref<string>('')
const debouncedSearchTerm = ref<string>('')
let debounceTimer: number | undefined

// Combina los estados de expansión manual y los inducidos por la búsqueda
const currentExpandedState = computed(() => {
	if (debouncedSearchTerm.value.trim() !== '') {
		return searchInducedExpandedState.value
	}
	return baseExpandedState.value
})

const parseJsonData = (data: string | object): any => {
	if (typeof data === 'object') {
		return data
	}
	try {
		return JSON.parse(data)
	} catch (e) {
		return { value: data }
	}
}

// Renamed and modified from findPaths
// Returns true if a match is found in obj or its descendants.
// Populates 'pathsCollector' with all paths that should be expanded.
const findPathsAndMarkParents = (
	obj: any,
	term: string,
	currentPath: string,
	pathsCollector: Record<string, boolean>
): boolean => {
	if (term.trim() === '') return false
	const lowerTerm = term.toLowerCase()
	let foundSomethingAtThisLevelOrBelow = false

	if (Array.isArray(obj)) {
		obj.forEach((item, index) => {
			const itemPath = `${currentPath}[${index}]`
			if (findPathsAndMarkParents(item, term, itemPath, pathsCollector)) {
				foundSomethingAtThisLevelOrBelow = true
			}
		})
	} else if (typeof obj === 'object' && obj !== null) {
		for (const key in Object.keys(obj)) {
			const value = obj[key]
			const valuePath = `${currentPath}.${key}` // Path to the child's value

			let keyMatches = false
			if (key.toLowerCase().includes(lowerTerm)) {
				keyMatches = true
			}

			// Pass pathsCollector down for children to populate
			if (
				findPathsAndMarkParents(value, term, valuePath, pathsCollector) ||
				keyMatches
			) {
				foundSomethingAtThisLevelOrBelow = true
			}
		}
	} else {
		// Primitive value
		if (String(obj).toLowerCase().includes(lowerTerm)) {
			foundSomethingAtThisLevelOrBelow = true
		}
	}

	if (foundSomethingAtThisLevelOrBelow) {
		pathsCollector[currentPath] = true // Mark current path for expansion
		return true
	}
	return false
}

const updateSearchExpandedState = () => {
	if (!jsonData.value || debouncedSearchTerm.value.trim() === '') {
		searchInducedExpandedState.value = {}
		return
	}
	const newExpandedPaths: Record<string, boolean> = {}
	// Initial call for the root object, its path is "root"
	findPathsAndMarkParents(
		jsonData.value,
		debouncedSearchTerm.value,
		'root',
		newExpandedPaths
	)
	searchInducedExpandedState.value = newExpandedPaths
}

const handleSearch = () => {
	clearTimeout(debounceTimer)
	debounceTimer = window.setTimeout(() => {
		debouncedSearchTerm.value = searchTerm.value
		updateSearchExpandedState()
	}, 300)
}

onMounted(() => {
	store.socketOn('dataNode', (value: any) => {
		const rawValue =
			typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)
		consoleData.value = rawValue
		jsonData.value = parseJsonData(value)
		// Cuando llegan nuevos datos, si hay un término de búsqueda, re-aplicar la búsqueda
		if (debouncedSearchTerm.value.trim() !== '') {
			updateSearchExpandedState()
		}
	})
})

watch(
	jsonData,
	(newVal, oldVal) => {
		if (debouncedSearchTerm.value.trim() === '') {
			// Lógica simple para mantener el estado de expansión si la estructura raíz no cambia drásticamente.
			if (
				newVal &&
				oldVal &&
				typeof newVal === 'object' &&
				typeof oldVal === 'object'
			) {
				const newKeys = Object.keys(newVal)
				const oldKeys = Object.keys(oldVal)
				if (JSON.stringify(newKeys.sort()) !== JSON.stringify(oldKeys.sort())) {
					// baseExpandedState.value = {}; // Opcional
				} else {
					const newBaseExpandedState: Record<string, boolean> = {}
					for (const path in baseExpandedState.value) {
						if (baseExpandedState.value[path]) {
							newBaseExpandedState[path] = true
						}
					}
					baseExpandedState.value = newBaseExpandedState
				}
			} else {
				// baseExpandedState.value = {}; // Si la estructura cambia mucho o no son objetos
			}
		} else {
			// Si hay un término de búsqueda activo, la expansión la maneja `updateSearchExpandedState`
			// y `currentExpandedState` se basa en `searchInducedExpandedState`.
			// Podríamos querer resetear `baseExpandedState` aquí o dejarlo como está para cuando se borre la búsqueda.
		}
	},
	{ deep: false }
)

const handleToggleExpand = (path: string) => {
	if (debouncedSearchTerm.value.trim() !== '') {
		// Si estamos en modo búsqueda, el toggle podría necesitar una lógica especial
		// o simplemente no permitir el toggle manual y que solo la búsqueda controle la expansión.
		// Por ahora, permitimos que el toggle manual afecte searchInducedExpandedState.
		searchInducedExpandedState.value[path] =
			!searchInducedExpandedState.value[path]
	} else {
		baseExpandedState.value[path] = !baseExpandedState.value[path]
	}
}

const handleCopyNode = async (valueToCopy: any) => {
	try {
		const textToCopy =
			typeof valueToCopy === 'object'
				? JSON.stringify(valueToCopy, null, 2)
				: String(valueToCopy)
		await navigator.clipboard.writeText(textToCopy)
		alert('Copiado al portapapeles!')
	} catch (err) {
		console.error('Error al copiar:', err)
		alert('Error al copiar.')
	}
}

const copyAllJson = async () => {
	if (consoleData.value) {
		try {
			await navigator.clipboard.writeText(consoleData.value)
			alert('JSON completo copiado al portapapeles!')
		} catch (err) {
			console.error('Error al copiar todo el JSON:', err)
			alert('Error al copiar todo el JSON.')
		}
	}
}
</script>

<style scoped>
.search-container {
  margin-bottom: 10px;
}
.search-input {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.copy-all-button {
  margin-top: 10px;
  padding: 5px 10px;
  cursor: pointer;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  display: block; 
}
.copy-all-button:hover {
  background-color: #0056b3;
}
</style>
