import { Deployments_Table } from '../../database/entity/global.deployments.entity.js'
import { Status_Table } from '../../database/entity/global.status.entity.js'
import { Users_Table } from '../../database/entity/security.users.entity.js'
import { queueService } from './queue.service.js'

export function globalDeployService() {
	return {
		// global/deploy/save
		save: async ({
			name,
			description,
			plugin,
			plugin_name,
			properties
		}: {
			name: string
			description: string
			plugin: string
			plugin_name: string
			properties: object
		}) => {
			try {
				await Deployments_Table.create({
					name,
					description,
					plugin_name,
					plugin,
					properties,
					created_by: 1
				})
				return { save: 'Despliegue creado exitosamente' }
			} catch (error) {
				let message = 'Error'
				if (error instanceof Error) message = error.toString()
				return { error: message }
			}
		},
		// global/deploy/validName
		validName: async ({ name }: { name: string }) => {
			try {
				const existingDeploy = await Deployments_Table.findOne({
					where: {
						name,
						id_status: 1
					}
				})
				if (existingDeploy) {
					return { error: 'Ya existe una despliegue con el mismo nombre' }
				}
				return { valid: true }
			} catch (error) {
				let message = 'Error'
				if (error instanceof Error) message = error.toString()
				return { error: message }
			}
		},
		// global/deploy/list
		list: async () => {
			try {
				const deploys = await Deployments_Table.findAll({
					include: [
						{
							model: Status_Table,
							required: true
						},
						{
							model: Users_Table,
							required: true
						}
					],
					where: {
						id_status: 1
					},
					order: [['name', 'ASC']]
				})
				return { deploys }
			} catch (error) {
				let message = 'Error'
				if (error instanceof Error) message = error.toString()
				return { error: message }
			}
		},

		// global/deploy/delete
		delete: async ({ id }: { id: number }) => {
			try {
				await Deployments_Table.update(
					{
						id_status: 2
					},
					{ where: { id } }
				)
				return { msg: 'Despliegue eliminado exitosamente' }
			} catch (error) {
				let message = 'Error'
				if (error instanceof Error) message = error.toString()
				return { error: message }
			}
		},
		// global/deploy/queue
		queue: queueService
	}
}
