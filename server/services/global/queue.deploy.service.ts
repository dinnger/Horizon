import type { IDeploy } from '@shared/interface/deploy.interface.js'
import { getDeploysClass } from '@shared/maps/deploy.maps.js'
import { queueService } from './queue.service.js'
import { DeploymentsQueue_Table } from '../../database/entity/global.deploymentsQueue.entity.js'
import fs from 'node:fs'
import { Deployments_Table } from '../../database/entity/global.deployments.entity.js'

export async function queueDeploy() {
	const list = await queueService().list({ status: [3] })
	const deployClass = getDeploysClass()
	for (const item of list?.deploys || []) {
		try {
			const deploy = deployClass[item.deployment.plugin]
			if (!deploy) {
				return await DeploymentsQueue_Table.update(
					{
						description: `No existe el plugin [${item.deployment.plugin}]`,
						id_status: 4
					},
					{ where: { id: item.id } }
				)
			}

			// Extraer propiedades
			const deployProperties: { properties: Record<string, any> } | null = await Deployments_Table.findOne({
				attributes: ['properties'],
				where: {
					id: item.id_deployment
				}
			})

			const classInfo: IDeploy = new (deploy.class as any)()

			if (deployProperties) {
				for (const key of Object.keys(classInfo.properties)) {
					if (deployProperties.properties?.[key] !== undefined) {
						classInfo.properties[key].value = deployProperties.properties[key]
					}
				}
			}

			await classInfo.onExecute({
				context: {
					path: item.meta.path,
					flow: item.workflow.uid
				}
			})
			fs.rmSync(item.meta.path, { recursive: true })
			return await DeploymentsQueue_Table.update(
				{
					description: 'Despliegue exitoso',
					id_status: 7
				},
				{ where: { id: item.id } }
			)
		} catch (error) {
			let message = 'Error'
			if (error instanceof Error) message = error.toString()
			try {
				fs.rmSync(item.meta.path, { recursive: true })
			} catch (error) {}
			await DeploymentsQueue_Table.update(
				{
					description: message,
					id_status: 4
				},
				{ where: { id: item.id } }
			)
			throw error
		}
	}
}
