import type { ISocket } from '@shared/interface/socket.interface.js'
import { encrypt } from '../modules/security.module.js'
import { v4 as uuidv4 } from 'uuid'

export const clientsCredentialsList: Map<string, any> = new Map()

export function clientService({ socket }: { socket: ISocket }) {
	return {
		openUrl: (data: {
			uri: string
			uid?: string
			headers: object
			queryParams: object
			meta: any
		}) => {
			return new Promise((resolve) => {
				function callback(value: any) {
					clientsCredentialsList.delete(uid)
					resolve(value)
				}

				const uid = uuidv4().toString()
				clientsCredentialsList.set(uid, callback)
				data.uid = uid
				socket.emit(
					'external',
					{
						type: 'openUrl',
						data: { token: encrypt(JSON.stringify(data)) }
					},
					(value: any) => callback(value)
				)
			})
		}
	}
}
