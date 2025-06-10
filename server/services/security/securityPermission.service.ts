import type { ISocket } from '@shared/interface/socket.interface.js'
import { Users_Table } from '../../database/entity/security.users.entity.js'
import { Status_Table } from '../../database/entity/global.status.entity.js'
import { Permission_Table } from '../../database/entity/security.permission.entity.js'

export function securityPermissionService() {
	return {
		// security/permission/new
		new: async ({
			slug,
			name,
			description,
			socket
		}: {
			slug: string
			name: string
			description: string
			socket: ISocket
		}) => {
			try {
				await Permission_Table.create({
					slug,
					name,
					description,
					id_status: 1,
					created_by: socket.session.id
				})
				return { msg: 'Permiso creado exitosamente' }
			} catch (error) {
				let message = 'Error'
				if (error instanceof Error) message = error.toString()
				return { error: message }
			}
		},
		// security/permission/all
		all: async ({ socket }: { socket: ISocket }) => {
			try {
				const roles = await Permission_Table.findAll({
					attributes: ['id', 'slug', 'name', 'description'],
					include: [
						{
							model: Users_Table,
							required: true
						},
						{
							model: Status_Table,
							required: true
						}
					],
					where: {
						id_status: 1
					},
					order: [['name', 'ASC']]
				})
				return { roles }
			} catch (error) {
				let message = 'Error'
				if (error instanceof Error) message = error.toString()
				return { error: message }
			}
		}
	}
}
