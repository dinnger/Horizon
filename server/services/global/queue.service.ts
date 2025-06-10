import type { IWorkflow } from '@shared/interface/workflow.interface.js'
import type { Includeable } from 'sequelize'
import type { Express } from 'express'
import type { ISocket } from '@shared/interface/socket.interface.js'
import { Deployments_Table } from '../../database/entity/global.deployments.entity.js'
import { DeploymentsQueue_Table } from '../../database/entity/global.deploymentsQueue.entity.js'
import { Status_Table } from '../../database/entity/global.status.entity.js'
import { ProjectsTable } from '../../database/entity/projects.projects.entity.js'
import { Users_Table } from '../../database/entity/security.users.entity.js'
import { WorkflowsFlowTable } from '../../database/entity/workflows.flows.entity.js'
import { WorkflowsHistoryTable } from '../../database/entity/workflows.history.entity.js'
import { queueProcess } from './queue.process.service.js'
import { queueDeploy } from './queue.deploy.service.js'
import { workflowsService } from '../workflows.service.js'

export function queueService() {
	return {
		// global/deploy/queue/new
		new: async ({ socket, app, uid, properties }: { socket: ISocket; app: Express; uid: string; properties: IWorkflow['properties'] }) => {
			try {
				const workflow = await WorkflowsFlowTable.findOne({
					include: [
						{
							model: Deployments_Table,
							required: false,
							where: {
								id_status: 1
							}
						}
					],
					where: {
						uid
					}
				})
				if (!workflow) return { error: 'No se encontró el despliegue' }
				if (!workflow.id_deploy) {
					return { error: 'No se encontró el despliegue' }
				}
				if (!workflow.deployment) {
					return { error: 'No se encontró el despliegue' }
				}

				await workflowsService().save({ app, uid, properties })

				const workflowTable = await WorkflowsFlowTable.findOne({
					where: {
						uid
					}
				})

				const deploy = await DeploymentsQueue_Table.create({
					id_deployment: workflow.id_deploy,
					id_flow: workflow.id,
					flow: workflow.flow,
					description: '',
					id_status: 1,
					created_by: socket.session.id
				})

				return { msg: 'Despliegue en cola' }
			} catch (error) {
				let message = 'Error'
				if (error instanceof Error) message = error.toString()
				return { error: message }
			}
		},
		// global/deploy/queue/list
		list: async ({ status }: { status?: number[] } = {}) => {
			const order: any = [['id', 'ASC']]
			try {
				const include: Includeable[] = [
					{
						attributes: ['uid', 'name', 'description', 'id_status'],
						model: WorkflowsFlowTable,
						required: true,
						include: [
							{
								attributes: ['name', 'description'],
								model: ProjectsTable,
								required: true
							}
						]
					},
					{
						attributes: ['id', 'name', 'description', 'plugin', 'id_status'],
						model: Deployments_Table,
						required: true
					},
					{
						model: Status_Table,
						required: true
					},
					{
						model: Users_Table,
						required: true
					}
				]
				const deploys = await DeploymentsQueue_Table.findAll({
					include,
					where: {
						id_status: status
					},
					order
				})
				return { deploys }
			} catch (error) {
				let message = 'Error'
				if (error instanceof Error) message = error.toString()
				return { error: message }
			}
		}, // global/deploy/queue/dashboard
		dashboard: async ({ status }: { status?: number[] } = {}) => {
			try {
				const defaultStatus = status || [1, 3, 4, 6, 7] // pending, processing, error, queued, success

				// Obtener estadísticas de despliegues
				const deployStats = await DeploymentsQueue_Table.findAll({
					include: [
						{
							model: Status_Table,
							required: true
						}
					],
					where: {
						id_status: defaultStatus
					}
				})

				// Calcular estadísticas
				const stats = {
					total: deployStats.length,
					successful: deployStats.filter((d) => d.id_status === 7).length, // status 7 = success
					failed: deployStats.filter((d) => d.id_status === 4).length, // status 4 = error
					pending: deployStats.filter((d) => [1, 3, 6].includes(d.id_status)).length // pending, processing, queued
				}

				// Obtener despliegues recientes (últimos 10)
				const recentDeploys = await DeploymentsQueue_Table.findAll({
					include: [
						{
							attributes: ['uid', 'name', 'description'],
							model: WorkflowsFlowTable,
							required: true,
							include: [
								{
									attributes: ['name'],
									model: ProjectsTable,
									required: true
								}
							]
						},
						{
							model: Status_Table,
							required: true
						}
					],
					where: {
						id_status: defaultStatus
					},
					order: [['id', 'DESC']],
					limit: 10
				})

				return {
					stats,
					deploys: recentDeploys
				}
			} catch (error) {
				let message = 'Error'
				if (error instanceof Error) message = error.toString()
				return { error: message }
			}
		},
		// global/deploy/queue/init
		init: async () => {
			const list = await queueService().list({ status: [1] })
			const ids = list?.deploys?.map((f) => f.id) || []
			if (ids.length > 0) {
				await DeploymentsQueue_Table.update(
					{
						id_status: 6
					},
					{ where: { id: ids } }
				)
			}

			// Iniciar proceso de despliegue
			await queueProcess()

			// Desplegar
			await queueDeploy()
		}
	}
}
