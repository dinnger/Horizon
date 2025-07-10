import type { IClassNode } from '@shared/interfaces/class.interface'
import { io, type Socket } from 'socket.io-client'
import type {
	LoginResponse,
	PermissionCheckResponse,
	User,
	Workspace,
	Workflow,
	WorkspaceCreateData,
	WorkspaceUpdateData
} from '../types/socket'
import type { INodeCanvas } from '@canvas/interfaz/node.interface'

class SocketService {
	private socket: Socket | null = null
	private isConnected = false

	connect(userId?: string): Socket {
		if (this.socket?.connected) {
			return this.socket
		}

		const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'

		this.socket = io(serverUrl, {
			auth: userId ? { userId } : {},
			autoConnect: true
		})

		this.socket.on('connect', () => {
			console.log('Connected to server:', this.socket?.id)
			this.isConnected = true
		})

		this.socket.on('disconnect', () => {
			console.log('Disconnected from server')
			this.isConnected = false
		})

		this.socket.on('connect_error', (error) => {
			console.error('Connection error:', error)
			this.isConnected = false
		})

		return this.socket
	}

	disconnect(): void {
		if (this.socket) {
			this.socket.disconnect()
			this.socket = null
			this.isConnected = false
		}
	}

	getSocket(): Socket | null {
		return this.socket
	}

	isSocketConnected(): boolean {
		return this.isConnected && this.socket?.connected === true
	}

	// Auth methods
	login(email: string, password: string): Promise<LoginResponse> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit('auth:login', { email, password }, (response: LoginResponse) => {
				if (response.success) {
					resolve(response)
				} else {
					reject(new Error(response.message || 'Login failed'))
				}
			})
		})
	}

	checkPermission(userId: string, module: string, action: string): Promise<boolean> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit('auth:check-permission', { userId, module, action }, (response: PermissionCheckResponse) => {
				if (response.success) {
					resolve(response.hasPermission)
				} else {
					reject(new Error('Permission check failed'))
				}
			})
		})
	}

	getCurrentUser(): Promise<User> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit('auth:me', (response: { success: boolean; user?: User; message?: string }) => {
				if (response.success && response.user) {
					resolve(response.user)
				} else {
					reject(new Error(response.message || 'Failed to get user info'))
				}
			})
		})
	}

	// Workspace methods
	getWorkspaces(): Promise<Workspace[]> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit('workspaces:list', {}, (response: { success: boolean; workspaces?: Workspace[] }) => {
				if (response.success && response.workspaces) {
					resolve(response.workspaces)
				} else {
					reject(new Error('Failed to get workspaces'))
				}
			})
		})
	}

	createWorkspace(workspaceData: WorkspaceCreateData): Promise<Workspace> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit(
				'workspaces:create',
				workspaceData,
				(response: {
					success: boolean
					workspace?: Workspace
					message?: string
				}) => {
					if (response.success && response.workspace) {
						resolve(response.workspace)
					} else {
						reject(new Error(response.message || 'Failed to create workspace'))
					}
				}
			)
		})
	}

	updateWorkspace(id: string, updates: Partial<WorkspaceUpdateData>): Promise<Workspace> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit(
				'workspaces:update',
				{ id, ...updates },
				(response: {
					success: boolean
					workspace?: Workspace
					message?: string
				}) => {
					if (response.success && response.workspace) {
						resolve(response.workspace)
					} else {
						reject(new Error(response.message || 'Failed to update workspace'))
					}
				}
			)
		})
	}

	deleteWorkspace(id: string): Promise<void> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit('workspaces:delete', { id }, (response: any) => {
				if (response.success) {
					resolve()
				} else {
					reject(new Error(response.message || 'Failed to delete workspace'))
				}
			})
		})
	}

	// Project methods
	getProjects(workspaceId: string): Promise<any[]> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit('projects:list', { workspaceId }, (response: any) => {
				if (response.success) {
					resolve(response.projects)
				} else {
					reject(new Error(response.message || 'Failed to get projects'))
				}
			})
		})
	}

	getProjectById(workspaceId: string, projectId: string): Promise<any> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit('projects:get', { workspaceId, projectId }, (response: any) => {
				console.log('response', response)
				if (response.success && response.project) {
					resolve(response.project)
				} else {
					reject(new Error(response.message || 'Failed to get project'))
				}
			})
		})
	}

	createProject(projectData: any): Promise<any> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit('projects:create', projectData, (response: any) => {
				if (response.success) {
					resolve(response.project)
				} else {
					reject(new Error(response.message || 'Failed to create project'))
				}
			})
		})
	}

	updateProject(projectId: string, updates: any): Promise<any> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}
			this.socket.emit('projects:update', { id: projectId, ...updates }, (response: any) => {
				if (response.success && response.project) {
					resolve(response.project)
				} else {
					reject(new Error(response.message || 'Failed to update project'))
				}
			})
		})
	}

	deleteProject(projectId: string): Promise<void> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit('projects:delete', { id: projectId }, (response: any) => {
				if (response.success) {
					resolve()
				} else {
					reject(new Error(response.message || 'Failed to delete project'))
				}
			})
		})
	}

	// Workflow methods
	getWorkflows(workspaceId: string, projectId: string): Promise<any[]> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit('workflows:list', { workspaceId, projectId }, (response: any) => {
				if (response.success) {
					resolve(response.workflows)
				} else {
					reject(new Error(response.message || 'Failed to get workflows'))
				}
			})
		})
	}

	getWorkflowsById(workspaceId: string, id: string): Promise<any> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit('workflows:get', { workspaceId, id }, (response: any) => {
				if (response.success) {
					resolve(response.workflow)
				} else {
					reject(new Error(response.message || 'Failed to get workflow'))
				}
			})
		})
	}

	createWorkflow(workflowData: any): Promise<any> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit('workflows:create', workflowData, (response: any) => {
				if (response.success) {
					resolve(response.workflow)
				} else {
					reject(new Error(response.message || 'Failed to create workflow'))
				}
			})
		})
	}

	updateWorkflow(workflowId: string, updates: any): Promise<Workflow> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit(
				'workflows:update',
				{ id: workflowId, ...updates },
				(response: {
					success: boolean
					workflow?: Workflow
					message?: string
				}) => {
					if (response.success && response.workflow) {
						resolve(response.workflow)
					} else {
						reject(new Error(response.message || 'Failed to update workflow'))
					}
				}
			)
		})
	}

	deleteWorkflow(workflowId: string): Promise<void> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit('workflows:delete', { id: workflowId }, (response: any) => {
				if (response.success) {
					resolve()
				} else {
					reject(new Error(response.message || 'Failed to delete workflow'))
				}
			})
		})
	}

	executeWorkflow(workflowId: string, trigger = 'manual', version?: string): Promise<any> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			const payload = { workflowId, trigger, ...(version && { version }) }
			this.socket.emit('workflows:execute', payload, (response: any) => {
				if (response.success) {
					resolve(response)
				} else {
					reject(new Error(response.message || 'Failed to execute workflow'))
				}
			})
		})
	}

	getWorkflowVersions(workspaceId: string, workflowId: string): Promise<any> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit('workflows:getVersions', { workspaceId, workflowId }, (response: any) => {
				if (response.success) {
					resolve(response)
				} else {
					reject(new Error(response.message || 'Failed to get workflow versions'))
				}
			})
		})
	}

	// Settings methods
	getUserSettings(): Promise<any> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit('settings:get', {}, (response: any) => {
				if (response.success) {
					resolve(response.settings)
				} else {
					reject(new Error(response.message || 'Failed to get settings'))
				}
			})
		})
	}

	updateUserSettings(settings: any): Promise<any> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit('settings:update', settings, (response: any) => {
				if (response.success) {
					resolve(response.settings)
				} else {
					reject(new Error(response.message || 'Failed to update settings'))
				}
			})
		})
	}

	// Node methods
	getNodes(): Promise<Record<string, IClassNode>> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit('nodes:list', {}, (response: any) => {
				if (response.success && response.nodes) {
					resolve(response.nodes)
				} else {
					reject(new Error(response.message || 'Failed to get nodes'))
				}
			})
		})
	}

	getNodeByType(type: string): Promise<INodeCanvas> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit('nodes:get', { type }, (response: any) => {
				if (response.success && response.node) {
					resolve(response.node)
				} else {
					reject(new Error(response.message || 'Failed to get node'))
				}
			})
		})
	}

	getNodesByGroup(group?: string): Promise<Record<string, IClassNode>> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit('nodes:list-by-group', { group }, (response: any) => {
				if (response.success && response.nodes) {
					resolve(response.nodes)
				} else {
					reject(new Error(response.message || 'Failed to get nodes by group'))
				}
			})
		})
	}

	getNodeGroups(): Promise<string[]> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit('nodes:groups', {}, (response: any) => {
				if (response.success && response.groups) {
					resolve(response.groups)
				} else {
					reject(new Error(response.message || 'Failed to get node groups'))
				}
			})
		})
	}

	searchNodes(query: string): Promise<Record<string, IClassNode>> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit('nodes:search', { query }, (response: any) => {
				if (response.success && response.nodes) {
					resolve(response.nodes)
				} else {
					reject(new Error(response.message || 'Failed to search nodes'))
				}
			})
		})
	}

	getNodeInfo(type: string): Promise<IClassNode> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit('nodes:info', { type }, (response: any) => {
				if (response.success && response.node) {
					resolve(response.node)
				} else {
					reject(new Error(response.message || 'Failed to get node info'))
				}
			})
		})
	}

	getNodeStats(): Promise<any> {
		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error('Socket not connected'))
				return
			}

			this.socket.emit('nodes:stats', {}, (response: any) => {
				if (response.success && response.stats) {
					resolve(response.stats)
				} else {
					reject(new Error(response.message || 'Failed to get node stats'))
				}
			})
		})
	}

	// Event listeners
	onWorkspaceCreated(callback: (workspace: any) => void): void {
		this.socket?.on('workspaces:created', callback)
	}

	onWorkspaceUpdated(callback: (workspace: any) => void): void {
		this.socket?.on('workspaces:updated', callback)
	}

	onWorkspaceDeleted(callback: (data: { id: string }) => void): void {
		this.socket?.on('workspaces:deleted', callback)
	}

	onProjectCreated(callback: (project: any) => void): void {
		this.socket?.on('projects:created', callback)
	}

	onWorkflowExecutionCompleted(callback: (data: any) => void): void {
		this.socket?.on('workflows:execution-completed', callback)
	}

	// Remove all listeners
	removeAllListeners(): void {
		this.socket?.removeAllListeners()
	}
}

export const socketService = new SocketService()
export default socketService
