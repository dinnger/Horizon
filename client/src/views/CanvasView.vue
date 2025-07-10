<template>
  <div>
    <div v-if="!isLoading && !isError" class="h-screen bg-base-100 overflow-hidden">
      <!-- Canvas Header -->
      <div class="bg-base-200 border-b border-base-300 h-[55px] p-2 flex items-center justify-between relative">
        <div class="flex items-center space-x-4">
          <button @click="$router.go(-1)" class="btn btn-ghost btn-circle btn-sm">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 class="text-xl font-bold">{{ projectName }}</h1>
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <!-- Panel de historial  -->
          <VersionControlPanel />

          <button class="btn btn-success btn-sm" @click="canvasStore.save()" :disabled="!canvasStore.changes">
            <span class="mdi mdi-content-save"></span>
            Guardar
          </button>

          <button class="btn btn-primary btn-sm" @click="canvasStore.save()">
            <span class="mdi mdi-upload"></span>
            Publicar
          </button>
        </div>

        <div
          class="absolute top-[38px] right-1/2 translate-6/12  flex gap-2 p-2 bg-black/20 backdrop-blur-sm rounded-md">
          <div class="dropdown dropdown-end">
            <label tabindex="0" class="btn btn-sm btn-soft btn-primary">
              <span class="mdi mdi-play"></span>
              {{ isExecuting ? 'Ejecutando...' : 'Ejecutar' }}
              <span class="mdi mdi-chevron-down ml-1"></span>
            </label>
            <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
              <li><a @click="handleExecuteWorkflow()">Ejecutar Última Versión</a></li>
              <li><a @click="handleExecuteWithVersionSelection">Ejecutar Versión Específica...</a></li>
            </ul>
          </div>
          <h2 class="text-[10px]">Version: {{ canvasStore.version.value }}</h2>
        </div>
      </div>



      <div class="flex h-[calc(100vh-73px)]">
        <canvas ref="contentCanvas"></canvas>
        <div class="absolute bottom-0 right-0 flex flex-col gap-2 p-2 text-[11px] text-right">
          Pos: {{ canvasPos }}
          <br>
          zoom: {{ canvasZoom }} X
        </div>
      </div>

      <!-- Panel de librería de nodos -->
      <NodesLibraryPanel @node-selected="handleNodeSelection" @close="onPanelClose" />

      <!-- Diálogo de propiedades del nodo -->
      <NodePropertiesDialog :is-visible="showNodePropertiesDialog" :node-data="selectedNodeForEdit"
        @close="closeNodePropertiesDialog" @save="handleNodePropertiesSave" />

      <!-- Menú contextual del nodo -->
      <NodeContextMenu :is-visible="showContextMenu" :selected-nodes="selectedNodesForContext" @close="closeContextMenu"
        @delete="handleNodesDelete" @duplicate="handleNodeDuplicate" @rename="handleNodeRename" />

      <!-- Menú contextual de conexión -->
      <ConnectionContextMenu :is-visible="showConnectionContextMenu" :connection-info="selectedConnectionForContext"
        @close="closeConnectionContextMenu" @delete="handleConnectionDelete" />

      <!-- Modal de selección de versiones -->
      <div v-if="showVersionSelector" class="modal modal-open">
        <div class="modal-box">
          <h3 class="font-bold text-lg mb-4">Seleccionar Versión para Ejecutar</h3>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Versiones Disponibles:</span>
            </label>
            <div class="max-h-60 overflow-y-auto">
              <div v-for="version in availableVersions" :key="version.version"
                class="flex items-center p-2 hover:bg-base-200 rounded cursor-pointer"
                @click="selectedVersion = version.version">
                <input type="radio" :value="version.version" v-model="selectedVersion" class="radio radio-primary mr-3">
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-sm">{{ version.version }}</span>
                    <span v-if="version.isCurrent" class="badge badge-primary badge-xs">Actual</span>
                    <span class="badge badge-outline badge-xs">{{ version.changeType }}</span>
                  </div>
                  <p class="text-xs text-base-content/60">{{ version.changeDescription }}</p>
                  <p class="text-xs text-base-content/40">{{ new Date(version.createdAt).toLocaleString() }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-action">
            <button class="btn btn-primary" @click="executeSelectedVersion" :disabled="!selectedVersion">
              <span class="mdi mdi-play"></span>
              Ejecutar Versión
            </button>
            <button class="btn" @click="closeVersionSelector">Cancelar</button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="isError" class="text-center py-8">
      <div class="w-24 h-24 bg-base-300 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <h3 class="text-lg font-semibold mb-2">Hubo un error al cargar el flujo</h3>
      <p class="text-base-content/70 mb-4">Verifique si el flujo existe y si tiene permisos de lectura</p>
      <router-link to="/projects" class="btn btn-primary">
        Volver a proyectos
      </router-link>

    </div>
  </div>
</template>

<script setup lang="ts">
import type { INodeCanvas, INodeCanvasAdd } from '@canvas/interfaz/node.interface'
import type { Point } from '@canvas/canvasConnector'
import { ref, onMounted, watch } from 'vue'
import { Canvas } from '@canvas/canvas.ts'
import { useRouter } from 'vue-router'
import { useSettingsStore, useNodesLibraryStore, useCanvas } from '@/stores'
import NodesLibraryPanel from '@/components/NodesLibraryPanel.vue'
import NodePropertiesDialog from '@/components/NodePropertiesDialog.vue'
import NodeContextMenu from '@/components/NodeContextMenu.vue'
import ConnectionContextMenu from '@/components/ConnectionContextMenu.vue'
import VersionControlPanel from '@/components/VersionControlPanel.vue'

const settingsStore = useSettingsStore()
const nodesStore = useNodesLibraryStore()
const canvasStore = useCanvas()
const router = useRouter()

const contentCanvas = ref<HTMLCanvasElement>()
const canvasPos = ref('0x, 0y')
const canvasZoom = ref(1)
const nodeOrigin = ref<INodeCanvasAdd | null>(null)
const projectName = ref('Web Application')
const nextNodePosition = ref({ x: 100, y: 100 })
const currentMousePosition = ref({ x: 0, y: 0 })
const isExecuting = ref(false)
const isLoading = ref(true)
const isError = ref(false)

// Estados para el selector de versiones
const showVersionSelector = ref(false)
const availableVersions = ref<any[]>([])
const selectedVersion = ref<string | null>(null)

// Estados para el diálogo de propiedades del nodo
const showNodePropertiesDialog = ref(false)
const selectedNodeForEdit = ref<INodeCanvas | null>(null)

// Estados para el menú contextual
const showContextMenu = ref(false)
const selectedNodesForContext = ref<INodeCanvas[]>([])

// Estados para el menú contextual de conexión
const showConnectionContextMenu = ref(false)
const selectedConnectionForContext = ref<{
  id: string
  nodeOrigin: INodeCanvas
  nodeDestiny: INodeCanvas
  input: string
  output: string
} | null>(null)

let canvasInstance: Canvas | null = null

// Función para manejar la selección de un nodo desde el panel
const handleNodeSelection = (selectedNode: INodeCanvas) => {
  if (!canvasInstance || !nodeOrigin.value) return

  // Usar la posición del mouse si está disponible, sino usar la posición por defecto
  const positionX = currentMousePosition.value.x || nextNodePosition.value.x
  const positionY = currentMousePosition.value.y || nextNodePosition.value.y

  // Crear una copia del nodo con nueva posición
  const nodeToAdd: INodeCanvas = {
    ...JSON.parse(JSON.stringify(selectedNode)),
    design: {
      x: positionX,
      y: positionY
    }
  }

  // Añadir el nodo
  console.log('nodeOrigin', nodeOrigin.value)
  const connectorOriginName = typeof nodeOrigin.value.connection === 'string' ? nodeOrigin.value.connection : nodeOrigin.value.connection.name || ''
  const nodeId = canvasInstance.actionAddNode({
    origin: {
      idNode: nodeOrigin.value.node.id as string,
      connectorOriginName
    },
    node: nodeToAdd
  })
  console.log(`Nodo ${selectedNode.info.name} añadido con ID: ${nodeId}`)
}

// Función para manejar el cierre del panel
const onPanelClose = () => {
  // Aquí puedes agregar lógica adicional cuando se cierre el panel
  console.log('Panel de nodos cerrado')
}

// Funciones para el diálogo de propiedades del nodo
const closeNodePropertiesDialog = () => {
  showNodePropertiesDialog.value = false
  selectedNodeForEdit.value = null
}

const handleNodePropertiesSave = (updatedNode: INodeCanvas) => {
  if (!canvasInstance || !updatedNode.id) return
  canvasInstance.actionUpdateNodeProperties({ id: updatedNode.id, properties: updatedNode.properties })
}

// Funciones para el menú contextual
const closeContextMenu = () => {
  showContextMenu.value = false
  selectedNodesForContext.value = []
}

const handleNodesDelete = (nodes: INodeCanvas[]) => {
  if (!canvasInstance || nodes.length === 0) return

  // Confirmar eliminación si hay múltiples nodos
  const confirmMessage = nodes.length === 1
    ? `¿Estás seguro de que quieres eliminar el nodo "${nodes[0].info.name}"?`
    : `¿Estás seguro de que quieres eliminar ${nodes.length} nodos?`

  if (confirm(confirmMessage)) {
    const nodeIds = nodes.map(n => n.id).filter((id): id is string => id !== undefined)
    canvasInstance.actionDeleteNodes({ ids: nodeIds })
    console.log('Nodos eliminados:', nodes.map(n => n.info.name))

    // Marcar cambios en el store
    // canvasStore.markChanges()
  }
}

const handleNodeDuplicate = (node: INodeCanvas) => {
  if (!canvasInstance) return

  // Crear una copia del nodo con nueva posición (offset para evitar superposición)
  const duplicatedNode: INodeCanvas = {
    ...JSON.parse(JSON.stringify(node)),
    id: undefined, // Se generará un nuevo ID
    info: {
      ...node.info,
      name: `${node.info.name} (Copia)`
    },
    design: {
      x: node.design.x + 50,
      y: node.design.y + 50
    }
  }

  // Añadir el nodo duplicado
  const nodeId = canvasInstance.actionAddNode({
    node: duplicatedNode
  })

  console.log(`Nodo ${node.info.name} duplicado con ID: ${nodeId}`)
}

const handleNodeRename = (node: INodeCanvas, newName: string) => {
  if (!canvasInstance || !node.id) return

  // Actualizar el nombre usando el método del canvas
  canvasInstance.actionUpdateNodeName({ id: node.id, newName })
  console.log(`Nombre cambiado de "${node.info.name}" a "${newName}"`)

  // Marcar cambios en el store
  // canvasStore.markChanges()
}

// Funciones para el menú contextual de conexión
const closeConnectionContextMenu = () => {
  showConnectionContextMenu.value = false
  selectedConnectionForContext.value = null
}

const handleConnectionDelete = (connectionId: string) => {
  if (!canvasInstance) return

  // Confirmar eliminación de la conexión
  const confirmMessage = '¿Estás seguro de que quieres eliminar esta conexión?'

  if (confirm(confirmMessage)) {
    canvasInstance.actionDeleteConnectionById({ id: connectionId })
    console.log('Conexión eliminada:', connectionId)

    // Marcar cambios en el store
    // canvasStore.markChanges()
  }
}

// Función para manejar la ejecución del workflow
const handleExecuteWorkflow = async (version?: string) => {
  if (isExecuting.value) return

  isExecuting.value = true

  try {
    const result = await canvasStore.execute(version)

    if (result?.success) {
      console.log('Workflow ejecutado exitosamente')
      if (result.message) {
        alert(result.message)
      }
    } else {
      console.error('Error ejecutando workflow:', result?.message)
      alert(`Error ejecutando workflow: ${result?.message || 'Error desconocido'}`)
    }
  } catch (error) {
    console.error('Error inesperado ejecutando workflow:', error)
    alert('Error inesperado ejecutando workflow')
  } finally {
    isExecuting.value = false
  }
}

// Función para mostrar el selector de versiones
const handleExecuteWithVersionSelection = async () => {
  try {
    const versionsResult = await canvasStore.getVersions()

    if (versionsResult?.success) {
      availableVersions.value = versionsResult.versions
      showVersionSelector.value = true
    } else {
      alert(`Error obteniendo versiones: ${versionsResult?.message || 'Error desconocido'}`)
    }
  } catch (error) {
    console.error('Error obteniendo versiones:', error)
    alert('Error obteniendo versiones del workflow')
  }
}

// Función para cerrar el selector de versiones
const closeVersionSelector = () => {
  showVersionSelector.value = false
  selectedVersion.value = null
}

// Función para ejecutar la versión seleccionada
const executeSelectedVersion = async () => {
  if (!selectedVersion.value) {
    alert('Por favor selecciona una versión')
    return
  }

  closeVersionSelector()
  await handleExecuteWorkflow(selectedVersion.value)
}

onMounted(async () => {
  try {
    await canvasStore.loadWorkflow({ flow: router.currentRoute.value.params.id as string })
    isLoading.value = false

    watch(() => contentCanvas.value, value => {
      if (!value) return
      canvasInstance = new Canvas({
        canvas: value,
        theme: settingsStore.currentTheme
      })

      canvasStore.initCanvas({ canvasInstance })

      canvasInstance.subscriber("mouse_move", (e) => {
        canvasPos.value = `${e.x}x, ${e.y}y`
        currentMousePosition.value = { x: e.x, y: e.y }
      })
      canvasInstance.subscriber("zoom", (e) => {
        canvasZoom.value = e.zoom
      })
      canvasInstance.subscriber("node_added", (e: INodeCanvasAdd) => {
        console.log('Nodo añadido:', e)
        nodeOrigin.value = e
        nodesStore.showNodePanel()
      })
      canvasInstance.subscriber("node_dbclick", (e: INodeCanvas[]) => {
        console.log('Doble clic en nodo:', e)
        if (e.length > 1 || e.length === 0) {
          alert('No se puede añadir más de un nodo a la vez')
          return
        }
        selectedNodeForEdit.value = e[0]
        showNodePropertiesDialog.value = true
      })
      canvasInstance.subscriber("node_context", (e: { canvasTranslate: Point, selected: INodeCanvas[] }) => {
        console.log('Nodo contextual:', e)
        // Guardar los nodos seleccionados para el menú contextual
        selectedNodesForContext.value = e.selected
        // Mostrar el menú contextual centrado
        showContextMenu.value = true
      })
      canvasInstance.subscriber("node_connection_context", (e: {
        id: string,
        nodeOrigin: INodeCanvas,
        nodeDestiny: INodeCanvas,
        input: string,
        output: string
      }) => {
        console.log('Nodo conexión contextual:', e)

        // Guardar la información de la conexión para el menú contextual
        selectedConnectionForContext.value = e

        // Mostrar el menú contextual de conexión centrado
        showConnectionContextMenu.value = true
      })
    })


  } catch (error) {
    isLoading.value = false
    isError.value = true
    console.error('Error cargando flujo:', error)
  }





})
</script>

<style scoped>
.canvas-container {
  background-color: var(--fallback-b1, oklch(var(--b1)));
}
</style>
