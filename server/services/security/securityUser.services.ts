import type { ISocket } from '@shared/interface/socket.interface.js'
import { Users_Table } from '../../database/entity/security.users.entity.js'
import { verifyTokenUser } from '../../modules/security.module.js'
import bcrypt from 'bcrypt'

export function securityUserService() {
	return {
		// security/user/change_password
		change_password: async ({
			socket,
			oldPassword,
			newPassword
		}: {
			socket: ISocket
			oldPassword: string
			newPassword: string
		}) => {
			try {
				const { user } = await verifyTokenUser({ token: socket.token })
				if (!user) return { error: 'No se encontró el usuario' }
				if (!bcrypt.compareSync(oldPassword, user.password)) return { error: 'La contraseña actual no es correcta' }
				const saltRounds = 10
				const hash = bcrypt.hashSync(newPassword, saltRounds)
				await Users_Table.update({ password: hash }, { where: { id: user.id } })
				return { msg: 'Contraseña actualizada exitosamente' }
			} catch (error) {
				let message = 'Error'
				if (error instanceof Error) message = error.toString()
				return { error: message }
			}
		}
	}
}
