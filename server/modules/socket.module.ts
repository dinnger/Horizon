import type { ISocket } from '@shared/interface/socket.interface.js'
import type http from 'node:http'
import type { Express } from 'express'
import { Server } from 'socket.io'
import { socketSecurity } from './security.module.js'

export let ioSocket: Server
export function Initialize_Socket({ app, server, path, fn }: { app: Express; server: http.Server; path: string; fn: () => any }) {
	ioSocket = new Server(server, {
		maxHttpBufferSize: 1e8,
		path,
		cors: {
			credentials: true,
			origin: '*'
		}
	})
	ioSocket.on('connection', (socket) => {
		// console.log('a user connected', socket.id)
		socketProxy({ app, socket: socket as ISocket, fn })
		socket.on('disconnect', () => {
			// console.log('user disconnected')
		})

		socket.on('join', (room: string) => {
			socket.join(room)
		})

		socket.on('leave', (room: string) => {
			socket.leave(room)
		})
	})
	return ioSocket
}

async function socketProxy({ app, socket, fn }: { app: Express; socket: ISocket; fn: () => object }) {
	socket.onAny(async (event: string, ...args: any[]) => {
		const params = args.length > 0 ? (typeof args[0] === 'object' ? args[0] : {}) : {}
		const callback = args.length === 2 ? args[1] : typeof args[0] === 'function' ? args[0] : null
		const obj = event.split('/')
		if (['join', 'leave'].includes(obj[0])) return

		let tempRegister: { [key: string]: any } = fn()

		const exec = async (index: number) => {
			if (index >= obj.length) {
				if (callback) callback(tempRegister)
				return
			}
			const name = obj[index]
			if (tempRegister[name]) {
				// if (params.session) delete params.session // Eliminando parámetro de sesión para evitar inyección
				tempRegister = await tempRegister[name]({
					app,
					socket,
					// session: socket.session,
					...params
				})
				exec(index + 1)
			} else {
				if (callback) callback({ error: '(Socket) Etiqueta no definida.' })
				console.log('\x1b[44m[server]\x1b[0m [Socket] No existe el registro', event)
			}
		}

		socketSecurity({ event, socket, params, callback, next: () => exec(0) })
	})
}
