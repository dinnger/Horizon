<template>
  <div v-if="isVisible" class="fixed inset-0 z-50 flex items-center justify-center" @click.self="closeDialog">
    <!-- Overlay -->
    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

    <!-- Dialog -->
    <div class="relative bg-base-100 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] mx-4 flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-base-300">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded flex items-center justify-center text-white material-icons text-2xl"
            :style="{ backgroundColor: nodeData?.info.color || '#6b7280' }">
            {{ nodeData?.info.icon || '?' }}
          </div>
          <div>
            <h2 class="text-xl font-bold">{{ nodeData?.info.name || 'Propiedades del Nodo' }}</h2>
            <p class="text-sm opacity-70">{{ nodeData?.info.desc || 'Configura las propiedades de este nodo' }}</p>
          </div>
        </div>
        <button @click="closeDialog" class="btn btn-ghost btn-circle">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-hidden flex">
        <!-- Sidebar -->
        <div class="w-64 bg-base-200 border-r border-base-300 overflow-y-auto">
          <div class="p-4">
            <h3 class="font-semibold mb-3">Secciones</h3>
            <div class="space-y-1">
              <button v-for="section in sections" :key="section.key" @click="activeSection = section.key"
                class="w-full text-left px-3 py-2 rounded text-sm transition-colors"
                :class="activeSection === section.key ? 'bg-primary text-primary-content' : 'hover:bg-base-300'">
                {{ section.label }}
                <span class="text-xs opacity-60 block">{{ section.count }} propiedades</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Main content -->
        <div class="flex-1 overflow-y-auto p-6">
          <div v-if="activeSection === 'properties'" class="space-y-4">
            <h3 class="text-lg font-semibold mb-4">Propiedades</h3>
            <div v-for="(property, key) in properties" :key="key" class="form-control">
              <label class="label">
                <span class="label-text font-medium">{{ property.name || key }}</span>
                <span v-if="property.required" class="text-error">*</span>
              </label>
              <br>

              <!-- String input -->
              <input v-if="property.type === 'string'" v-model="editableProperties[key].value" type="text"
                :placeholder="property.placeholder" :disabled="property.disabled" class="input input-bordered w-full"
                :class="{ 'input-error': property.required && !property.value }" />

              <!-- Number input -->
              <input v-else-if="property.type === 'number'" v-model.number="editableProperties[key].value" type="number"
                :min="property.min" :max="property.max" :step="property.step" :disabled="property.disabled"
                class="input input-bordered w-full" :class="{ 'input-error': property.required && !property.value }" />

              <!-- Boolean switch -->
              <div v-else-if="property.type === 'switch'" class="form-control">
                <label class="label cursor-pointer justify-start space-x-3">
                  <input v-model="editableProperties[key].value" type="checkbox" class="toggle toggle-primary"
                    :disabled="property.disabled" />
                  <span class="label-text">{{ property.value ? 'Activado' : 'Desactivado' }}</span>
                </label>
              </div>

              <!-- Options dropdown -->
              <select v-else-if="property.type === 'options'" v-model="editableProperties[key].value"
                class="select select-bordered w-full" :disabled="property.disabled"
                :class="{ 'select-error': property.required && !property.value }">
                <option value="" disabled>Selecciona una opción</option>
                <option v-for="option in property.options" :key="option.value" :value="option.value"
                  :disabled="option.disabled">
                  {{ option.label }}
                </option>
              </select>

              <!-- Textarea for long text -->
              <textarea v-else-if="property.type === 'textarea'" :value="String(editableProperties[key].value || '')"
                @input="editableProperties[key].value = ($event.target as HTMLTextAreaElement).value"
                :disabled="property.disabled" :rows="property.rows || 3" class="textarea textarea-bordered w-full"
                :class="{ 'textarea-error': property.required && !property.value }"></textarea>

              <!-- Code Editor -->
              <div v-else-if="property.type === 'code'" class="space-y-2">
                <textarea v-model="codeStringValues[key]" @blur="validateCode(String(key))"
                  :disabled="property.disabled" rows="4" class="textarea textarea-bordered font-mono text-sm w-full"
                  :class="{ 'textarea-error': codeErrors[key] }"
                  :placeholder="getCodePlaceholder(property.lang)"></textarea>
                <div v-if="codeErrors[key]" class="text-error text-xs">
                  Error: {{ codeErrors[key] }}
                </div>
              </div>

              <!-- Password input -->
              <input v-else-if="property.type === 'password'" v-model="editableProperties[key].value" type="password"
                :disabled="property.disabled" class="input input-bordered"
                :class="{ 'input-error': property.required && !property.value }" />

              <!-- Default fallback -->
              <div v-else class="alert alert-warning">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clip-rule="evenodd" />
                </svg>
                <span>Tipo de propiedad no soportado: {{ property.type }}</span>
              </div>

              <!-- Description -->
              <div v-if="property.description" class="label">
                <span class="label-text-alt opacity-60">{{ property.description }}</span>
              </div>
            </div>
          </div>

          <div v-else-if="activeSection === 'credentials'" class="space-y-4">
            <h3 class="text-lg font-semibold mb-4">Credenciales</h3>
            <div v-if="Object.keys(editableCredentials).length === 0" class="text-center py-8 opacity-60">
              Este nodo no requiere credenciales
            </div>
            <div v-else v-for="(credential, key) in editableCredentials" :key="key" class="form-control">
              <label class="label">
                <span class="label-text font-medium">{{ credential.name || key }}</span>
                <span v-if="credential.required" class="text-error">*</span>
              </label>

              <input v-if="credential.type === 'password'" v-model="editableCredentials[key].value" type="password"
                :disabled="credential.disabled" class="input input-bordered"
                :class="{ 'input-error': credential.required && !credential.value }" />

              <input v-else v-model="editableCredentials[key].value" type="text" :disabled="credential.disabled"
                class="input input-bordered" :class="{ 'input-error': credential.required && !credential.value }" />

              <div v-if="credential.description" class="label">
                <span class="label-text-alt opacity-60">{{ credential.description }}</span>
              </div>
            </div>
          </div>

          <div v-else-if="activeSection === 'meta'" class="space-y-4">
            <h3 class="text-lg font-semibold mb-4">Metadatos</h3>
            <div class="space-y-4">
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium">ID del Nodo</span>
                </label>
                <input v-model="editableMeta.id" type="text" class="input input-bordered" disabled />
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium">Tipo</span>
                </label>
                <input v-model="editableMeta.type" type="text" class="input input-bordered" disabled />
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium">Posición X</span>
                </label>
                <input v-model.number="editableMeta.design.x" type="number" class="input input-bordered" />
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium">Posición Y</span>
                </label>
                <input v-model.number="editableMeta.design.y" type="number" class="input input-bordered" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between p-6 border-t border-base-300">
        <div class="text-sm opacity-60">
          Los cambios no se aplicarán hasta guardar
        </div>
        <div class="flex space-x-3">
          <button @click="closeDialog" class="btn btn-ghost">
            Cancelar
          </button>
          <button @click="resetChanges" class="btn btn-outline">
            Restablecer
          </button>
          <button @click="saveChanges" class="btn btn-primary" :disabled="!hasChanges">
            <svg v-if="isSaving" class="animate-spin -ml-1 mr-3 h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor"
                d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
              </path>
            </svg>
            {{ isSaving ? 'Guardando...' : 'Guardar Cambios' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import type { INodeCanvas } from '@canvas/interfaz/node.interface'
import type { INodePropertiesType } from '@canvas/interfaz/node.properties.interface'
import { useNodesLibraryStore } from '@/stores'

interface Props {
  isVisible: boolean
  nodeData: INodeCanvas | null
}

interface Emits {
  close: []
  save: [nodeData: INodeCanvas]
}

const nodesLibraryStore = useNodesLibraryStore()

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const activeSection = ref('properties')
const isSaving = ref(false)
const jsonStringValues = reactive<Record<string, string>>({})
const jsonErrors = reactive<Record<string, string>>({})
const codeStringValues = reactive<Record<string, string>>({})
const codeErrors = reactive<Record<string, string>>({})

// Estados editables - se inicializan cuando se abre el diálogo
const editableProperties = ref<INodePropertiesType>({})
const editableCredentials = ref<INodePropertiesType>({})
const editableMeta = ref({
  id: '',
  type: '',
  design: { x: 0, y: 0 }
})

// Estados originales para comparar cambios
const originalProperties = ref<INodePropertiesType>({})
const tempProperties = ref<INodePropertiesType>({})
const originalCredentials = ref<INodePropertiesType>({})
const originalMeta = ref({
  id: '',
  type: '',
  design: { x: 0, y: 0 }
})

const sections = computed(() => [
  {
    key: 'properties',
    label: 'Propiedades',
    count: Object.keys(editableProperties.value).length
  },
  {
    key: 'credentials',
    label: 'Credenciales',
    count: Object.keys(editableCredentials.value).length
  },
  {
    key: 'meta',
    label: 'Metadatos',
    count: 4 // ID, tipo, x, y
  }
])

const properties = computed(() => {
  const entries = Object.entries(editableProperties.value)
    .filter(([_, prop]) => prop.show !== false)
  return Object.fromEntries(entries)
})

const hasChanges = computed(() => {
  return JSON.stringify(editableProperties.value) !== JSON.stringify(originalProperties.value) ||
    JSON.stringify(editableCredentials.value) !== JSON.stringify(originalCredentials.value) ||
    JSON.stringify(editableMeta.value) !== JSON.stringify(originalMeta.value)
})

// Inicializar datos cuando se abre el diálogo
watch(() => props.isVisible, (newValue) => {
  if (newValue && props.nodeData) {
    initializeEditableData()
    activeSection.value = 'properties'
  }
})

watch(() => editableProperties.value, (value) => {
  nodesLibraryStore.propertiesChanged(value)
    .then((val: any) => {
      console.log(val)
    })
  // for (const key of Object.keys(value)) {
  //   if (tempProperties.value[key].value !== value[key].value) {
  //     console.log(key, tempProperties.value[key].value, '->', value[key].value)
  //     tempProperties.value[key].value = JSON.parse(JSON.stringify(value[key].value))
  //   }
  // }
}, {
  deep: true
})

const initializeEditableData = () => {
  if (!props.nodeData) return

  // Clonar propiedades
  editableProperties.value = JSON.parse(JSON.stringify(props.nodeData.properties || {}))
  originalProperties.value = JSON.parse(JSON.stringify(props.nodeData.properties || {}))
  tempProperties.value = JSON.parse(JSON.stringify(props.nodeData.properties || {}))

  // Inicializar propiedades en el store
  nodesLibraryStore.propertiesInitialized(props.nodeData)

  // Clonar credenciales
  editableCredentials.value = JSON.parse(JSON.stringify(props.nodeData.credentials || {}))
  originalCredentials.value = JSON.parse(JSON.stringify(props.nodeData.credentials || {}))

  // Clonar metadatos
  editableMeta.value = {
    id: props.nodeData.id || '',
    type: props.nodeData.type || '',
    design: { ...props.nodeData.design }
  }
  originalMeta.value = JSON.parse(JSON.stringify(editableMeta.value))

  // Inicializar valores especiales como strings
  for (const key of Object.keys(editableProperties.value)) {
    const prop = editableProperties.value[key]
    if (prop && typeof prop === 'object') {
      if (prop.type === 'code') {
        if (typeof prop.value === 'object') {
          codeStringValues[key] = JSON.stringify(prop.value, null, 2)
        } else {
          codeStringValues[key] = String(prop.value || '')
        }
      }
    }
  }
}

const validateJson = (key: string) => {
  try {
    const parsed = JSON.parse(jsonStringValues[key] || '{}')
    editableProperties.value[key].value = parsed
    delete jsonErrors[key]
  } catch (error) {
    jsonErrors[key] = (error as Error).message
  }
}

const validateCode = (key: string) => {
  try {
    const value = codeStringValues[key] || ''
    const property = editableProperties.value[key]

    if (property && property.type === 'code') {
      if (property.lang === 'json') {
        JSON.parse(value || '{}') // Validar JSON
      }
      property.value = value
      delete codeErrors[key]
    }
  } catch (error) {
    codeErrors[key] = (error as Error).message
  }
}

const getCodePlaceholder = (lang: 'sql' | 'json' | 'js' | 'string') => {
  const placeholders = {
    sql: 'SELECT * FROM table_name;',
    json: '{ "key": "value" }',
    js: 'console.log("Hello World");',
    string: 'Ingresa tu código aquí...'
  }
  return placeholders[lang] || placeholders.string
}

const resetChanges = () => {
  if (!props.nodeData) return
  nodesLibraryStore.getNodeInfo(props.nodeData.type).then((node) => {
    editableProperties.value = JSON.parse(JSON.stringify(node?.properties || {}))
  })
}

const closeDialog = () => {
  emit('close')
}

const saveChanges = async () => {
  if (!props.nodeData || !hasChanges.value) return

  // Validar JSON y código antes de guardar
  for (const key of Object.keys(jsonStringValues)) {
    if (jsonErrors[key]) {
      alert(`Error en JSON de ${key}: ${jsonErrors[key]}`)
      return
    }
  }

  for (const key of Object.keys(codeStringValues)) {
    if (codeErrors[key]) {
      alert(`Error en código de ${key}: ${codeErrors[key]}`)
      return
    }
  }

  isSaving.value = true

  try {
    // Crear nodo actualizado
    const updatedNode: INodeCanvas = {
      ...props.nodeData,
      properties: { ...editableProperties.value },
      credentials: { ...editableCredentials.value },
      id: editableMeta.value.id,
      type: editableMeta.value.type,
      design: { ...editableMeta.value.design }
    }

    // Emitir evento de guardado
    emit('save', updatedNode)

    // Actualizar estados originales
    originalProperties.value = JSON.parse(JSON.stringify(editableProperties.value))
    originalCredentials.value = JSON.parse(JSON.stringify(editableCredentials.value))
    originalMeta.value = JSON.parse(JSON.stringify(editableMeta.value))

    // Cerrar diálogo
    closeDialog()
  } catch (error) {
    console.error('Error al guardar cambios:', error)
    alert('Error al guardar los cambios. Por favor, inténtalo de nuevo.')
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
.form-control {
  margin-bottom: 1rem;
}

.textarea {
  resize: vertical;
}

.font-mono {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}
</style>
