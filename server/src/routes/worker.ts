/**
 * Worker Routes
 */

import type { SocketData } from './index'

export const setupWorkerRoutes = {
	// List all active workers - requires admin permission
	'worker:environment': async ({ socket, data, callback }: SocketData) => {
		try {
			const envs = process.env
			callback({ success: true, envs })
		} catch (error) {
			console.error('Error listando workers:', error)
			callback({ success: false, message: 'Error al cargar workers' })
		}
	}
}
