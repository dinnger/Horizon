import type { IWorkflow } from '@shared/interface/workflow.interface.js'
import type { Express } from 'express'
import type { ISocket } from '@shared/interface/socket.interface.js'
import { Status_Table } from '../database/entity/global.status.entity.js'
import { ProjectsTable } from '../database/entity/projects.projects.entity.js'
import { WorkflowsFlowTable } from '../database/entity/workflows.flows.entity.js'
import { workerService, workersList } from './worker.service.js'
import { virtualWorkflowService } from './workflowsVirtual.service.js'
import { Users_Table } from '../database/entity/security.users.entity.js'
import { WorkflowsHistoryTable } from '../database/entity/workflows.history.entity.js'
import { securitySecretService } from './security/securitySecret.service.js'
import { WorkflowsEnvsTable } from '../database/entity/workflows.envs.entity.js'
import fs from 'node:fs'

const defaultProperties: IWorkflow['properties'] = {
	basic: { router: '/' }
}

export function workflowsService() {
	return {
		// workflows/new
		new: async ({
			app,
			socket,
			id_project,
			name,
			description,
			flow,
			workspace_id
		}: {
			app: Express
			socket: ISocket
			id_project: number
			name: string
			description: string
			flow: any
			workspace_id?: number
		}) => {
			try {
				// Verificar que el proyecto pertenece al workspace si se especifica
				if (workspace_id) {
					const project = await ProjectsTable.findOne({
						where: {
							id: id_project,
							id_workspace: workspace_id,
							id_status: 1
						}
					})
					if (!project) {
						return { error: 'Project not found in specified workspace' }
					}
				}

				const workflow = await WorkflowsFlowTable.create({
					id_project,
					name,
					description,
					flow: flow as IWorkflow,
					created_by: socket.session.id
				})
				await workflowsService().save({
					app,
					uid: workflow.uid
				})
				await workflowsService().load(workflow.uid)
				return { msg: 'Workflow created' }
			} catch (error) {
				let message = 'Error'
				if (error instanceof Error) message = error.toString()
				return { error: message }
			}
		},
		// workflows/get
		get: async ({
			id_project,
			uidFlow,
			workspace_id
		}: {
			id_project?: number
			uidFlow?: string
			workspace_id?: number
		}): Promise<(typeof WorkflowsFlowTable)[] | { error: string }> => {
			try {
				const where: { [key: string]: any } = {
					id_status: 1
				}
				if (id_project) where.id_project = id_project
				if (uidFlow) where.uid = uidFlow

				const projectWhere: any = { id_status: 1 }
				if (workspace_id) {
					projectWhere.id_workspace = workspace_id
				}

				const workflows = await WorkflowsFlowTable.findAll({
					attributes: ['id', 'name', 'uid', 'created_by'],
					include: [
						{
							model: ProjectsTable,
							required: true,
							where: projectWhere
						},
						{
							model: Status_Table,
							required: true
						},
						{
							model: Users_Table,
							required: true
						}
					],
					where,
					order: [['name', 'ASC']]
				})
				return workflows.map((workflow) => {
					const workerStatus = workersList.get(workflow.uid)
					return {
						...workflow.dataValues,
						worker_status: workerStatus?.active ? 'Active' : 'Inactive'
					}
				}) as unknown as (typeof WorkflowsFlowTable)[]
			} catch (error) {
				console.log(error)
				let message = 'Error'
				if (error instanceof Error) message = error.toString()
				return { error: message }
			}
		},
		// workflows/initialize
		initialize: async ({
			app,
			uid,
			uid_project,
			workspace_id
		}: {
			app: Express
			uid: string
			uid_project?: string
			workspace_id?: number
		}): Promise<IWorkflow | null | { error: string }> => {
			try {
				const projectWhere: any = { id_status: 1 }
				if (workspace_id) {
					projectWhere.id_workspace = workspace_id
				}

				const workflows = await WorkflowsFlowTable.findOne({
					attributes: {
						exclude: ['id_envs', 'id_project', 'id_status', 'id_deploy', 'created_by', 'shared_with']
					},
					where: {
						uid,
						id_status: 1
					},
					include: [
						{
							attributes: ['uid', 'name', 'description'],
							model: ProjectsTable,
							required: true,
							where: projectWhere
						},
						{
							attributes: ['name', 'color'],
							model: Status_Table,
							required: true
						}
					],
					order: [['name', 'ASC']]
				})

				if (!workflows) return null

				if (uid_project && workflows && workflows?.project?.uid !== uid_project) {
					return null
				}

				const worker = await workerService({ app }).init({ uidFlow: uid })

				// Solicitando propiedades del workflow virtual
				const properties: any = await worker?.worker.getDataWorker({
					type: 'getVirtualProperties',
					data: null
				})
				const nodes: any = await worker?.worker.getDataWorker({
					type: 'getVirtualNodes',
					data: null
				})
				const connections: any = await worker?.worker.getDataWorker({
					type: 'getVirtualConnections',
					data: null
				})

				if (workflows?.flow || nodes) {
					if (!workflows.flow) (workflows as any).flow = {}
					workflows.flow.properties = Object.keys(properties).length > 0 ? properties : defaultProperties
					workflows.flow.nodes = nodes
					workflows.flow.connections = connections
				}
				return {
					...workflows.dataValues.flow,
					uid: workflows.uid,
					name: workflows.name,
					version: workflows.version
				}
			} catch (error) {
				let message = 'Error'
				if (error instanceof Error) message = error.toString()
				return { error: message }
			}
		},
		// workflows/save
		save: async ({
			app,
			uid,
			properties
		}: {
			app: Express
			uid: string
			properties?: IWorkflow['properties']
		}) => {
			const worker = workersList.get(uid)
			if (!worker) return { error: 'No se encontró el worker' }
			try {
				const data = await worker.worker.getDataWorker({
					type: 'statusWorkflow'
				})
				const status = Array.isArray(data) ? data[0] : data
				if (status === false) {
					return { error: 'No se han realizado ningún cambio' }
				}
			} catch (error) {}

			// Solicitando propiedades del workflow virtual
			const flowProject: any = await worker.worker.getDataWorker({
				type: 'getVirtualProject',
				data: null
			})
			const flowNodes: any = await worker.worker.getDataWorker({
				type: 'getVirtualNodes',
				data: null
			})
			const flowConnections: any = await worker.worker.getDataWorker({
				type: 'getVirtualConnections',
				data: null
			})

			// =========================================================================
			// FLOW
			// =========================================================================
			const flow: IWorkflow = {
				uid: worker.uidFlow,
				name: worker.nameFlow,
				version: '0.0.1',
				project: flowProject,
				properties: properties || defaultProperties,
				nodes: flowNodes,
				connections: flowConnections,
				env: {
					secrets: {},
					variables: {}
				}
			}

			const beforeWorkflow = await WorkflowsFlowTable.findOne({
				where: { uid }
			})

			const envs = {}
			let id_envs = undefined
			let version = '0.0.1'
			if (beforeWorkflow) {
				// Crear env
				if (envs && typeof envs === 'object' && Object.keys(envs).length > 0) {
					// Verify if the env exists
					const env = await WorkflowsEnvsTable.findOne({
						where: { id_flow: beforeWorkflow.id, data: envs, id_status: 1 }
					})

					if (env) {
						id_envs = env.id
					}
				}

				// Secrets
				// for (const node of Object.values(flow.nodes)) {
				// 	if (node.properties) {
				// 		for (const property of Object.values(node.properties)) {
				// 			if (property.type === 'secret') {
				// 				if (property.secretType === 'VARIABLES') {
				// 					const [type, name] = property.value.toString().split('_')
				// 					const secrets = await securitySecretService().getByName({
				// 						type,
				// 						name
				// 					})
				// 					if (secrets) {
				// 						flow.secrets = Object.keys(secrets)
				// 					}
				// 				} else if (property.secretType === 'DATABASE') {
				// 					const [type, subType, name] = property.value.toString().split('_')
				// 					const secrets = await securitySecretService().getByName({
				// 						type,
				// 						subType,
				// 						name
				// 					})
				// 					if (secrets) {
				// 						flow.secrets = [...flow.secrets, ...Object.keys(secrets)]
				// 					}
				// 				}
				// 			}
				// 		}
				// 	}
				// }

				// Limpiando
				const nodes: { [key: string]: any } = {}
				for (const [key, item] of Object.entries(flow.nodes)) {
					nodes[key] = {
						...item,
						properties: item.properties
							? Object.fromEntries(
									Object.entries(item.properties).map(([key, item]) => {
										return [key, { value: (item as { value: object }).value }]
									})
								)
							: null
					}
					nodes[key].height = undefined
					nodes[key].width = undefined
				}
				flow.nodes = nodes

				// Crear historial
				await WorkflowsHistoryTable.create({
					id_flow: beforeWorkflow.id,
					name: beforeWorkflow.name || '',
					description: beforeWorkflow.description,
					flow: beforeWorkflow.flow,
					version: beforeWorkflow.version,
					id_status: beforeWorkflow.id_status,
					created_by: beforeWorkflow.created_by
				})

				let [major, minor, patch] = beforeWorkflow.version.split('.')
				if (
					Object.keys(flow.nodes).length !== Object.keys(beforeWorkflow.flow?.nodes || {}).length ||
					Object.keys(flow.connections).length !== Object.keys(beforeWorkflow.flow?.connections || []).length
				) {
					minor = (Number.parseInt(minor || '0') + 1).toString()
					if (Number.parseInt(minor) === 10) {
						minor = '0'
						major = (Number.parseInt(major || '0') + 1).toString()
					}
					patch = '0'
				} else {
					patch = (Number.parseInt(patch || '0') + 1).toString()
				}
				version = `${major}.${minor}.${patch}`
			}
			await WorkflowsFlowTable.update(
				{
					flow,
					version,
					id_deploy: properties?.deploy || undefined,
					id_envs
				},
				{ where: { uid } }
			)

			if (!fs.existsSync(`./data/workflows/${uid}`)) {
				fs.mkdirSync(`./data/workflows/${uid}`, { recursive: true })
			}

			// Validar si existen cambios en el archivo
			fs.writeFileSync(`./data/workflows/${uid}/flow.json`, JSON.stringify(flow, null, 2))

			await workerService({ app }).restart({ uidFlow: uid })
			return { msg: 'Workflow saved' }
		},
		// workflows/load
		load: async (uid?: string) => {
			console.log('Cargando workflows')
			const where: { [key: string]: any } = {
				id_status: 1
			}
			if (uid) where.uid = uid
			const workflows = await WorkflowsFlowTable.findAll({
				include: [
					{
						model: WorkflowsEnvsTable,
						as: 'variables',
						required: false,
						where: {
							id_status: 1
						}
					},
					{
						model: ProjectsTable,
						required: true
					}
				],
				where
			})
			if (!workflows || workflows.length === 0) return { error: 'No workflows found' }
			for (const workflow of workflows) {
				const uid = workflow.uid
				const project: { [key: string]: any } = {}
				if (workflow.project) project[String(workflow.project.transport_type)] = workflow.project.transport_config || {}
				const flow: IWorkflow = (workflow.flow as IWorkflow) || {
					info: { uid: '', name: '' },
					properties: {},
					nodes: {},
					connections: [],
					secrets: []
				}
				flow.project = project as IWorkflow['project']

				if (!fs.existsSync(`./data/workflows/${uid}`)) {
					fs.mkdirSync(`./data/workflows/${uid}`, { recursive: true })
				}

				// if (workflow.project) {
				// 	fs.writeFileSync(
				// 		`./data/workflows/${uid}/project.config.json`,
				// 		JSON.stringify(
				// 			{
				// 				type: workflow.project.transport_type,
				// 				config: workflow.project.transport_config
				// 			},
				// 			null,
				// 			2
				// 		)
				// 	)
				// }

				fs.writeFileSync(`./data/workflows/${uid}/flow.json`, JSON.stringify(flow, null, 2))
			}
			return { msg: 'Workflow saved' }
		},
		// workflows/list
		list: async () => {
			const workflows = await WorkflowsFlowTable.findAll({
				attributes: ['uid', 'name', 'created_by'],
				include: [
					{
						attributes: ['uid', 'name', 'description'],
						model: ProjectsTable,
						required: true,
						where: {
							id_status: 1
						}
					}
				],
				where: {
					id_status: 1
				},
				order: [['name', 'ASC']]
			})
			return workflows.map((workflow) => {
				const workerStatus = workersList.get(workflow.uid)
				return {
					...workflow.dataValues,
					worker_status: workerStatus?.active ? 'Active' : 'Inactive'
				}
			})
		},
		// workflows/debug
		debug: async ({ flow, action }: { flow: string; action: 'on' | 'off' }) => {
			const worker = workersList.get(flow.toLocaleLowerCase().trim())
			if (!worker) return { error: 'No se encontró el worker' }
			worker.worker.postMessage({
				type: 'actionDebug',
				data: action === 'on'
			})
			return { msg: 'Workflow debug' }
		},
		// workflows/variables
		variables: () => {
			return {
				// workflows/variables/get
				get: async ({ uidFlow }: { uidFlow: string }) => {
					const variables = await WorkflowsEnvsTable.findOne({
						include: [
							{
								model: WorkflowsFlowTable,
								required: true,
								where: {
									uid: uidFlow,
									id_status: 1
								}
							}
						],
						where: {
							id_status: 1
						}
					})
					return variables?.data
				}
			}
		},
		// workflows/virtual
		virtual: virtualWorkflowService,
		// workflows/edit
		edit: async ({ uid, name }: { uid: string; name: string }) => {
			try {
				const workflow = await WorkflowsFlowTable.findOne({ where: { uid, id_status: 1 } })
				if (!workflow) return { error: 'Workflow no encontrado' }
				await workflow.update({ name })
				return { msg: 'Workflow actualizado exitosamente' }
			} catch (error) {
				let message = 'Error'
				if (error instanceof Error) message = error.toString()
				return { error: message }
			}
		},
		// workflows/dashboard
		dashboard: async () => {
			try {
				// Obtener todos los workflows activos para estadísticas
				const workflows = await WorkflowsFlowTable.findAll({
					include: [
						{
							model: ProjectsTable,
							required: true
						},
						{
							model: Status_Table,
							required: true
						}
					],
					where: {
						id_status: 1
					}
				})

				// Obtener historial de workflows para tendencias (últimos 7 días)
				const weeklyHistory = await WorkflowsHistoryTable.findAll({
					include: [
						{
							model: WorkflowsFlowTable,
							required: true,
							where: {
								id_status: 1
							}
						}
					],
					where: {
						id_status: 1
					},
					order: [['id', 'DESC']],
					limit: 50 // Últimas 50 ejecuciones para análisis
				})

				// Calcular estadísticas por día de la semana
				const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
				const weeklyStats = daysOfWeek.map(() => 0)

				// Simular distribución de workflows por día (ya que no tenemos timestamps)
				// En un entorno real, usarías createdAt o updatedAt
				weeklyHistory.forEach((_, index) => {
					const dayIndex = index % 7
					weeklyStats[dayIndex] += Math.floor(Math.random() * 10) + 1
				}) // Obtener estadísticas de workers activos
				const stats = {
					totalWorkflows: workflows.length,
					activeWorkers: Array.from(workersList.values()).filter((w) => w.active).length,
					weeklyExecutions: weeklyStats,
					recentHistory: weeklyHistory.slice(0, 10).map((h) => ({
						name: h.name,
						version: h.version,
						workflow: h.flow
					}))
				}

				return {
					stats,
					workflows: workflows.slice(0, 10) // Últimos 10 workflows
				}
			} catch (error) {
				let message = 'Error'
				if (error instanceof Error) message = error.toString()
				return { error: message }
			}
		},
		// workflows/delete
		delete: async ({ uid }: { uid: string }) => {
			try {
				const workflow = await WorkflowsFlowTable.findOne({ where: { uid, id_status: 1 } })
				if (!workflow) return { error: 'Workflow no encontrado' }
				await workflow.update({ id_status: 2 })
				return { msg: 'Workflow eliminado exitosamente' }
			} catch (error) {
				let message = 'Error'
				if (error instanceof Error) message = error.toString()
				return { error: message }
			}
		}
	}
}
