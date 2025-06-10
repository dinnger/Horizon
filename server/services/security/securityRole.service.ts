import type { ISocket } from '@shared/interface/socket.interface.js'
import { Roles_Table } from '../../database/entity/security.roles.entity.js'
import { verifyTokenUser } from '../../modules/security.module.js'
import { Users_Table } from '../../database/entity/security.users.entity.js'
import { Status_Table } from '../../database/entity/global.status.entity.js'

export function securityRoleService() {
	return {
		// security/role/new
		new: async ({
			name,
			description,
			tags,
			socket
		}: {
			name: string
			description: string
			tags: string[]
			socket: ISocket
		}) => {
			try {
				await Roles_Table.create({
					name,
					description,
					tags,
					id_status: 1,
					created_by: socket.session.id
				})
				return { msg: 'Role creado exitosamente' }
			} catch (error) {
				let message = 'Error'
				if (error instanceof Error) message = error.toString()
				return { error: message }
			}
		},
		// security/role/all
		all: async ({ socket }: { socket: ISocket }) => {
			try {
				const roles = await Roles_Table.findAll({
					attributes: ['id', 'name', 'description', 'tags'],
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
