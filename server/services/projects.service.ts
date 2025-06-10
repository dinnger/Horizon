import type { IProjectsProjectsEntity } from '@entities/projects.interface.js'
import type { ISocket } from '@shared/interface/socket.interface.js'
import { ProjectsTable } from '../database/entity/projects.projects.entity.js'
import { Status_Table } from '../database/entity/global.status.entity.js'
import { Users_Table } from '../database/entity/security.users.entity.js'
import { WorkflowsFlowTable } from '../database/entity/workflows.flows.entity.js'
import amqp from 'amqplib'

export function projectsService() {
	return {
		// projects/new
		new: async ({
			socket,
			name,
			description,
			transport_type = 'empty',
			transport_pattern = undefined,
			transport_config = undefined
		}: {
			socket: ISocket
			name: string
			description: string
			transport_type?: string
			transport_pattern?: string
			transport_config?: object | undefined
		}) => {
			try {
				await ProjectsTable.create({
					name,
					description,
					id_workspace: socket.session.workspace,
					created_by: socket.session.id,
					transport_type,
					transport_pattern,
					transport_config
				})
				return { msg: 'Project created' }
			} catch (error) {
				let message = 'Error'
				if (error instanceof Error) message = error.toString()
				return { error: message }
			}
		},
		// projects/get_projects
		get_projects: async () => {
			try {
				return await ProjectsTable.findAll({
					include: [
						{
							model: Status_Table,
							required: true
						},
						{
							model: WorkflowsFlowTable,
							required: false
						},
						{
							model: Users_Table
						}
					],
					where: {
						id_status: 1
					},
					order: [['name', 'ASC']]
				})
			} catch (error) {
				let message = 'Error'
				if (error instanceof Error) message = error.toString()
				return { error: message }
			}
		},
		// projects/get_project_by_uid
		get_project_by_uid: async ({ uid }: { uid: string }): Promise<IProjectsProjectsEntity | null | { error: string }> => {
			try {
				const projects = await ProjectsTable.findOne({
					where: {
						uid
					},
					include: [
						{
							model: Status_Table,
							required: true
						},
						{
							model: Users_Table
						}
					],
					order: [['name', 'ASC']]
				})
				return projects
			} catch (error) {
				let message = 'Error'
				if (error instanceof Error) message = error.toString()
				return { error: message }
			}
		},
		// projects/delete
		delete: async ({ uid }: { uid: string }) => {
			try {
				const project = await ProjectsTable.findOne({ where: { uid, id_status: 1 } })
				if (!project) return { error: 'Project not found' }
				await project.update({ id_status: 2 })
				return { msg: 'Project deleted' }
			} catch (error) {
				let message = 'Error'
				if (error instanceof Error) message = error.toString()
				return { error: message }
			}
		},
		// projects/test
		test() {
			return {
				// projects/test/rabbitMQ
				rabbitMQ: async ({ url }: { url: string }) => {
					try {
						const conn = await amqp.connect(url)
						conn.close()
						return { msg: 'Conexión establecida' }
					} catch (error) {
						let message = 'Error'
						if (error instanceof Error) message = error.toString()
						return { error: message }
					}
				}
			}
		},
		// projects/variables
		variables: () => {
			return {
				// workflows/variables/get
				get: async ({ uidFlow }: { uidFlow: string }) => {
					const variables = await ProjectsTable.findOne({
						attributes: ['transport_type', 'transport_pattern', 'transport_config'],
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
					return {
						type: variables?.transport_type,
						pattern: variables?.transport_pattern,
						config: variables?.transport_config
					}
				}
			}
		}
	}
}
