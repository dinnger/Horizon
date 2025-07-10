<template>
  <div class="p-8 bg-base-100 min-h-screen">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold text-primary">Proyectos</h1>
          <p class="text-base-content/70 mt-2">Gestiona todos tus proyectos desde aquí</p>
        </div>
        <button @click="showCreateModal = true" class="btn btn-primary">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Proyecto
        </button>
      </div>

      <!-- Projects Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div v-for="project in projectsWithWorkflows" :key="project.id" @click="goToProject(project.id)"
          class="card bg-base-200 shadow-xl backdrop-blur-sm border border-base-300 hover:shadow-2xl transition-all duration-300 cursor-pointer hover:scale-105">
          <div class="card-body">
            <div class="flex justify-between items-start mb-4">
              <h2 class="card-title text-lg">{{ project.name }}</h2>
              <div class="dropdown dropdown-end" @click.stop.prevent>
                <div tabindex="0" role="button" class="btn btn-ghost btn-sm" @click.stop>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zM12 13a1 1 0 110-2 1 1 0 010 2zM12 20a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </div>
                <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                  <li><a @click.stop.prevent="editProject(project)">Editar</a></li>
                  <li><a @click.stop.prevent="deleteProject(project.id)" class="text-error">Eliminar</a></li>
                </ul>
              </div>
            </div>

            <p class="text-sm opacity-70 mb-2">{{ project.description }}</p>

            <div v-if="project.transportType && project.transportType !== 'none'"
              class="text-xs text-base-content/60 mb-4">
              <div class="flex items-center space-x-2">
                <span class="font-medium">Transporte:</span>
                <span>{{ getTransportLabel(project.transportType) }}</span>
              </div>
              <div v-if="getConnectionInfo(project)" class="mt-1 font-mono text-xs">
                {{ getConnectionInfo(project) }}
              </div>
            </div>

            <div class="flex justify-between items-center text-sm">
              <div class="flex items-center space-x-2">
                <span class="badge badge-primary badge-sm">{{ project.workflows.length }} workflows</span>
                <span :class="['badge badge-sm', project.status === 'active' ? 'badge-success' : 'badge-warning']">
                  {{ project.status }}
                </span>
                <span v-if="project.transportType && project.transportType !== 'none'"
                  class="badge badge-info badge-sm">
                  {{ getTransportLabel(project.transportType) }}
                </span>
              </div>
              <span class="opacity-50">{{ formatDate(project.createdAt) }}</span>
            </div>
          </div>
        </div>

        <div v-if="projectsWithWorkflows.length === 0 && !projectsStore.showEmptyState"
          class="flex justify-center col-span-full ">
          <span class="loading loading-spinner mr-2"></span> Cargando proyectos...
        </div>

        <!-- Empty State -->
        <div v-if="projectsWithWorkflows.length === 0 && projectsStore.showEmptyState"
          class="col-span-full flex flex-col items-center justify-center py-16 text-center">
          <div class="w-24 h-24 bg-base-300 rounded-full flex items-center justify-center mb-4">
            <svg class="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-2">No tienes proyectos aún</h3>
          <p class="text-base-content/70 mb-4">Crea tu primer proyecto para comenzar</p>
          <button @click="showCreateModal = true" class="btn btn-primary">
            Crear Proyecto
          </button>
        </div>
      </div>

      <!-- Create Project Modal -->
      <div v-if="showCreateModal" class="modal modal-open">
        <div class="modal-box max-w-4xl">
          <h3 class="font-bold text-lg mb-4">Crear Nuevo Proyecto</h3>
          <form @submit.prevent="createProject">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Información básica -->
              <div class="space-y-4">
                <h4 class="font-semibold text-base-content">Información Básica</h4>

                <div class="form-control">
                  <label class="label">
                    <span class="label-text">Nombre del Proyecto</span>
                  </label>
                  <input v-model="newProject.name" type="text" placeholder="Mi proyecto increíble"
                    class="input input-bordered w-full" required />
                </div>

                <div class="form-control">
                  <label class="label">
                    <span class="label-text">Descripción</span>
                  </label>
                  <textarea v-model="newProject.description" class="textarea textarea-bordered h-24"
                    placeholder="Describe tu proyecto..."></textarea>
                </div>
              </div>

              <!-- Configuración de Transporte -->
              <div class="space-y-4">
                <h4 class="font-semibold text-base-content">Configuración de Transporte</h4>

                <div class="form-control">
                  <label class="label">
                    <span class="label-text">Tipo de Transporte</span>
                  </label>
                  <select v-model="newProject.transportType" class="select select-bordered w-full">
                    <option value="none">Sin transporte</option>
                    <option value="tcp">TCP</option>
                    <option value="rabbitmq">RabbitMQ</option>
                    <option value="kafka">Apache Kafka</option>
                    <option value="nats">NATS</option>
                    <option value="http">HTTP/REST</option>
                    <option value="websocket">WebSocket</option>
                    <option value="mqtt">MQTT</option>
                  </select>
                </div>

                <!-- Configuración específica por tipo de transporte -->
                <div v-if="newProject.transportType && newProject.transportType !== 'none'" class="space-y-3">
                  <h5 class="text-sm font-medium text-base-content/80">Configuración Específica</h5>

                  <!-- TCP -->
                  <div v-if="newProject.transportType === 'tcp'" class="space-y-3">
                    <div class="grid grid-cols-2 gap-2">
                      <div class="form-control">
                        <input v-model="newProject.transportConfig.host" type="text" placeholder="Host (ej: localhost)"
                          class="input input-bordered input-sm" />
                      </div>
                      <div class="form-control">
                        <input v-model.number="newProject.transportConfig.port" type="number"
                          placeholder="Puerto (ej: 8080)" class="input input-bordered input-sm" />
                      </div>
                    </div>
                  </div>

                  <!-- RabbitMQ -->
                  <div v-if="newProject.transportType === 'rabbitmq'" class="space-y-3">
                    <input v-model="newProject.transportConfig.amqpUrl" type="text"
                      placeholder="AMQP URL (ej: amqp://localhost:5672)" class="input input-bordered input-sm w-full" />
                    <div class="grid grid-cols-2 gap-2">
                      <input v-model="newProject.transportConfig.exchange" type="text" placeholder="Exchange"
                        class="input input-bordered input-sm" />
                      <input v-model="newProject.transportConfig.queue" type="text" placeholder="Queue"
                        class="input input-bordered input-sm" />
                    </div>
                    <input v-model="newProject.transportConfig.routingKey" type="text" placeholder="Routing Key"
                      class="input input-bordered input-sm w-full" />
                  </div>

                  <!-- Kafka -->
                  <div v-if="newProject.transportType === 'kafka'" class="space-y-3">
                    <input v-model="newProject.transportConfig.brokers" type="text"
                      placeholder="Brokers (ej: localhost:9092)" class="input input-bordered input-sm w-full" />
                    <div class="grid grid-cols-2 gap-2">
                      <input v-model="newProject.transportConfig.clientId" type="text" placeholder="Client ID"
                        class="input input-bordered input-sm" />
                      <input v-model="newProject.transportConfig.groupId" type="text" placeholder="Group ID"
                        class="input input-bordered input-sm" />
                    </div>
                    <input v-model="newProject.transportConfig.topic" type="text" placeholder="Topic"
                      class="input input-bordered input-sm w-full" />
                  </div>

                  <!-- NATS -->
                  <div v-if="newProject.transportType === 'nats'" class="space-y-3">
                    <input v-model="newProject.transportConfig.natsUrl" type="text"
                      placeholder="NATS URL (ej: nats://localhost:4222)" class="input input-bordered input-sm w-full" />
                    <input v-model="newProject.transportConfig.subject" type="text" placeholder="Subject"
                      class="input input-bordered input-sm w-full" />
                  </div>

                  <!-- HTTP -->
                  <div v-if="newProject.transportType === 'http'" class="space-y-3">
                    <input v-model="newProject.transportConfig.baseUrl" type="text"
                      placeholder="Base URL (ej: https://api.example.com)"
                      class="input input-bordered input-sm w-full" />
                    <input v-model.number="newProject.transportConfig.timeout" type="number" placeholder="Timeout (ms)"
                      class="input input-bordered input-sm w-full" />
                  </div>

                  <!-- WebSocket -->
                  <div v-if="newProject.transportType === 'websocket'" class="space-y-3">
                    <input v-model="newProject.transportConfig.wsUrl" type="text"
                      placeholder="WebSocket URL (ej: ws://localhost:8080)"
                      class="input input-bordered input-sm w-full" />
                  </div>

                  <!-- Configuración común -->
                  <div class="collapse collapse-arrow bg-base-200">
                    <input type="checkbox" />
                    <div class="collapse-title text-sm font-medium">
                      Configuración Avanzada
                    </div>
                    <div class="collapse-content space-y-3">
                      <div class="grid grid-cols-2 gap-2">
                        <input v-model="newProject.transportConfig.username" type="text" placeholder="Usuario"
                          class="input input-bordered input-sm" />
                        <input v-model="newProject.transportConfig.password" type="password" placeholder="Contraseña"
                          class="input input-bordered input-sm" />
                      </div>
                      <div class="grid grid-cols-2 gap-2">
                        <input v-model.number="newProject.transportConfig.retries" type="number"
                          placeholder="Reintentos" class="input input-bordered input-sm" />
                        <input v-model.number="newProject.transportConfig.retryDelay" type="number"
                          placeholder="Retraso (ms)" class="input input-bordered input-sm" />
                      </div>
                      <div class="form-control">
                        <label class="label cursor-pointer">
                          <span class="label-text">Usar SSL/TLS</span>
                          <input v-model="newProject.transportConfig.ssl" type="checkbox" class="checkbox" />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-action mt-6">
              <button type="button" @click="showCreateModal = false" class="btn">
                Cancelar
              </button>
              <button type="submit" class="btn btn-primary">
                Crear Proyecto
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Edit Project Modal -->
      <div v-if="showEditModal" class="modal modal-open">
        <div class="modal-box max-w-4xl">
          <h3 class="font-bold text-lg mb-4">Editar Proyecto</h3>
          <form @submit.prevent="updateProject">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Información básica -->
              <div class="space-y-4">
                <h4 class="font-semibold text-base-content">Información Básica</h4>

                <div class="form-control">
                  <label class="label">
                    <span class="label-text">Nombre del Proyecto</span>
                  </label>
                  <input v-model="editProjectForm.name" type="text" placeholder="Mi proyecto increíble"
                    class="input input-bordered w-full" required />
                </div>

                <div class="form-control">
                  <label class="label">
                    <span class="label-text">Descripción</span>
                  </label>
                  <textarea v-model="editProjectForm.description" class="textarea textarea-bordered h-24"
                    placeholder="Describe tu proyecto..."></textarea>
                </div>
              </div>

              <!-- Configuración de Transporte -->
              <div class="space-y-4">
                <h4 class="font-semibold text-base-content">Configuración de Transporte</h4>

                <div class="form-control">
                  <label class="label">
                    <span class="label-text">Tipo de Transporte</span>
                  </label>
                  <select v-model="editProjectForm.transportType" class="select select-bordered w-full">
                    <option value="none">Sin transporte</option>
                    <option value="tcp">TCP</option>
                    <option value="rabbitmq">RabbitMQ</option>
                    <option value="kafka">Apache Kafka</option>
                    <option value="nats">NATS</option>
                    <option value="http">HTTP/REST</option>
                    <option value="websocket">WebSocket</option>
                    <option value="mqtt">MQTT</option>
                  </select>
                </div>

                <!-- Configuración específica por tipo de transporte -->
                <div v-if="editProjectForm.transportType && editProjectForm.transportType !== 'none'" class="space-y-3">
                  <h5 class="text-sm font-medium text-base-content/80">Configuración Específica</h5>

                  <!-- TCP -->
                  <div v-if="editProjectForm.transportType === 'tcp'" class="space-y-3">
                    <div class="grid grid-cols-2 gap-2">
                      <div class="form-control">
                        <input v-model="editProjectForm.transportConfig.host" type="text"
                          placeholder="Host (ej: localhost)" class="input input-bordered input-sm" />
                      </div>
                      <div class="form-control">
                        <input v-model.number="editProjectForm.transportConfig.port" type="number"
                          placeholder="Puerto (ej: 8080)" class="input input-bordered input-sm" />
                      </div>
                    </div>
                  </div>

                  <!-- RabbitMQ -->
                  <div v-if="editProjectForm.transportType === 'rabbitmq'" class="space-y-3">
                    <input v-model="editProjectForm.transportConfig.amqpUrl" type="text"
                      placeholder="AMQP URL (ej: amqp://localhost:5672)" class="input input-bordered input-sm w-full" />
                    <div class="grid grid-cols-2 gap-2">
                      <input v-model="editProjectForm.transportConfig.exchange" type="text" placeholder="Exchange"
                        class="input input-bordered input-sm" />
                      <input v-model="editProjectForm.transportConfig.queue" type="text" placeholder="Queue"
                        class="input input-bordered input-sm" />
                    </div>
                    <input v-model="editProjectForm.transportConfig.routingKey" type="text" placeholder="Routing Key"
                      class="input input-bordered input-sm w-full" />
                  </div>

                  <!-- Kafka -->
                  <div v-if="editProjectForm.transportType === 'kafka'" class="space-y-3">
                    <input v-model="editProjectForm.transportConfig.brokers" type="text"
                      placeholder="Brokers (ej: localhost:9092)" class="input input-bordered input-sm w-full" />
                    <div class="grid grid-cols-2 gap-2">
                      <input v-model="editProjectForm.transportConfig.clientId" type="text" placeholder="Client ID"
                        class="input input-bordered input-sm" />
                      <input v-model="editProjectForm.transportConfig.groupId" type="text" placeholder="Group ID"
                        class="input input-bordered input-sm" />
                    </div>
                    <input v-model="editProjectForm.transportConfig.topic" type="text" placeholder="Topic"
                      class="input input-bordered input-sm w-full" />
                  </div>

                  <!-- NATS -->
                  <div v-if="editProjectForm.transportType === 'nats'" class="space-y-3">
                    <input v-model="editProjectForm.transportConfig.natsUrl" type="text"
                      placeholder="NATS URL (ej: nats://localhost:4222)" class="input input-bordered input-sm w-full" />
                    <input v-model="editProjectForm.transportConfig.subject" type="text" placeholder="Subject"
                      class="input input-bordered input-sm w-full" />
                  </div>

                  <!-- HTTP -->
                  <div v-if="editProjectForm.transportType === 'http'" class="space-y-3">
                    <input v-model="editProjectForm.transportConfig.baseUrl" type="text"
                      placeholder="Base URL (ej: https://api.example.com)"
                      class="input input-bordered input-sm w-full" />
                    <input v-model.number="editProjectForm.transportConfig.timeout" type="number"
                      placeholder="Timeout (ms)" class="input input-bordered input-sm w-full" />
                  </div>

                  <!-- WebSocket -->
                  <div v-if="editProjectForm.transportType === 'websocket'" class="space-y-3">
                    <input v-model="editProjectForm.transportConfig.wsUrl" type="text"
                      placeholder="WebSocket URL (ej: ws://localhost:8080)"
                      class="input input-bordered input-sm w-full" />
                  </div>

                  <!-- Configuración común -->
                  <div class="collapse collapse-arrow bg-base-200">
                    <input type="checkbox" />
                    <div class="collapse-title text-sm font-medium">
                      Configuración Avanzada
                    </div>
                    <div class="collapse-content space-y-3">
                      <div class="grid grid-cols-2 gap-2">
                        <input v-model="editProjectForm.transportConfig.username" type="text" placeholder="Usuario"
                          class="input input-bordered input-sm" />
                        <input v-model="editProjectForm.transportConfig.password" type="password"
                          placeholder="Contraseña" class="input input-bordered input-sm" />
                      </div>
                      <div class="grid grid-cols-2 gap-2">
                        <input v-model.number="editProjectForm.transportConfig.retries" type="number"
                          placeholder="Reintentos" class="input input-bordered input-sm" />
                        <input v-model.number="editProjectForm.transportConfig.retryDelay" type="number"
                          placeholder="Retraso (ms)" class="input input-bordered input-sm" />
                      </div>
                      <div class="form-control">
                        <label class="label cursor-pointer">
                          <span class="label-text">Usar SSL/TLS</span>
                          <input v-model="editProjectForm.transportConfig.ssl" type="checkbox" class="checkbox" />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-action mt-6">
              <button type="button" @click="showEditModal = false" class="btn">
                Cancelar
              </button>
              <button type="submit" class="btn btn-primary">
                Actualizar Proyecto
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectWorkflows } from '@/composables/useProjectWorkflows'
import type { Project, ProjectTransportConfig } from '@/stores'

const router = useRouter()
const { projectsStore, workflowsStore, getProjectsWithWorkflows, deleteProjectAndWorkflows } = useProjectWorkflows()
const showCreateModal = ref(false)
const showEditModal = ref(false)
const editingProject = ref<Project | null>(null)

const newProject = reactive<{
  name: string
  description: string
  transportType?: 'none' | 'tcp' | 'rabbitmq' | 'kafka' | 'nats' | 'http' | 'websocket' | 'mqtt'
  transportConfig: ProjectTransportConfig
}>({
  name: '',
  description: '',
  transportType: 'none',
  transportConfig: {}
})

const editProjectForm = reactive<{
  name: string
  description: string
  transportType?: 'none' | 'tcp' | 'rabbitmq' | 'kafka' | 'nats' | 'http' | 'websocket' | 'mqtt'
  transportConfig: ProjectTransportConfig
}>({
  name: '',
  description: '',
  transportType: 'none',
  transportConfig: {}
})

// Obtener proyectos con información de workflows
const projectsWithWorkflows = getProjectsWithWorkflows

onMounted(() => {
  projectsStore.initializeData()
})

const goToProject = (projectId: string) => {
  router.push(`/projects/${projectId}`)
}

const createProject = () => {
  projectsStore.createProject({
    name: newProject.name,
    description: newProject.description,
    status: 'active',
    transportType: newProject.transportType,
    transportConfig: newProject.transportConfig
  })

  // Reset form
  newProject.name = ''
  newProject.description = ''
  newProject.transportType = 'none'
  newProject.transportConfig = {}
  showCreateModal.value = false
}

const editProject = (project: Project) => {
  editingProject.value = project
  editProjectForm.name = project.name
  editProjectForm.description = project.description
  editProjectForm.transportType = project.transportType || 'none'
  editProjectForm.transportConfig = project.transportConfig ? { ...project.transportConfig } : {}
  showEditModal.value = true
}

const updateProject = () => {
  if (!editingProject.value) return

  projectsStore.updateProject(editingProject.value.id, {
    name: editProjectForm.name,
    description: editProjectForm.description,
    transportType: editProjectForm.transportType,
    transportConfig: editProjectForm.transportConfig
  })

  // Reset form
  editProjectForm.name = ''
  editProjectForm.description = ''
  editProjectForm.transportType = 'none'
  editProjectForm.transportConfig = {}
  editingProject.value = null
  showEditModal.value = false
}

const deleteProject = async (projectId: string) => {
  if (confirm('¿Estás seguro de que quieres eliminar este proyecto y todos sus workflows?')) {
    await deleteProjectAndWorkflows(projectId)
  }
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

const getTransportLabel = (transportType: string) => {
  const labels: Record<string, string> = {
    none: 'Sin transporte',
    tcp: 'TCP',
    rabbitmq: 'RabbitMQ',
    kafka: 'Kafka',
    nats: 'NATS',
    http: 'HTTP',
    websocket: 'WebSocket',
    mqtt: 'MQTT'
  }
  return labels[transportType] || transportType.toUpperCase()
}

const getConnectionInfo = (project: any) => {
  if (!project.transportConfig || project.transportType === 'none') return null

  const config = project.transportConfig

  switch (project.transportType) {
    case 'tcp':
      return config.host && config.port ? `${config.host}:${config.port}` : null
    case 'rabbitmq':
      return config.amqpUrl || (config.exchange && config.queue ? `${config.exchange}/${config.queue}` : null)
    case 'kafka':
      return config.brokers || (config.topic ? `Topic: ${config.topic}` : null)
    case 'nats':
      return config.natsUrl || (config.subject ? `Subject: ${config.subject}` : null)
    case 'http':
      return config.baseUrl
    case 'websocket':
      return config.wsUrl
    default:
      return null
  }
}
</script>
