import { ref } from 'vue'
import { defineStore } from 'pinia'
import { io, type Socket } from 'socket.io-client'
import { useSession } from './session'
import type { SubscriberType } from '@shared/interfaces/class.interface';

function socketExternal({
	type,
	data
}: { type: string; data: any; token: string }) {
	return new Promise((resolve) => {
		if (type === 'openUrl') {
			const { token } = data
			const url = new URL(
				`${process.env.SERVER_URL}/api/credential/open?token=${token}` || ''
			)
			const windowFeatures = 'left=100,top=100,width=320,height=320'
			const newWindow = window.open(url, '_blank', windowFeatures)
			if (newWindow) {
				newWindow.onload = () => {
					resolve('hola mundo')
				}
			} else {
				resolve('Error de ventana')
			}
		}
	})
}

export const useSocket = defineStore('socket', () => {
	// Socket
	const socket = ref<Socket>()
	const socket_connect = ref(false)
	socket.value = io(process.env.SERVER_URL, { path: '/ws' })
	socket.value.on('connect', () => {
		const session = useSession()
		socket_connect.value = true
		if (socket.value) {
			// session
			socket.value.emit('server/security/session', { token: session.token })
			// external
			socket.value.on(
				'external',
				async (
					{ type, data }: { type: string; data: object },
					callback: any
				) => {
					if (!callback) return
					const resp = await socketExternal({
						type,
						data,
						token: session.token
					})
					console.log(resp)
					callback(resp)
				}
			)
		}
		console.log('Connected to server')
	})
	socket.value.on('disconnect', () => {
		socket_connect.value = false
		console.log('Disconnected from server')
	})
	function socketEmit(
		event: string,
		data: object,

		callback?: (value: any) => void
	) {
		if (socket_connect.value && socket.value) {
			socket.value.emit(event, data, callback)
		}
	}
	function socketOn(event: SubscriberType, callback: (value: string) => void) {
		if (socket_connect.value && socket.value) {
			socketOff(event)
			socket.value.on(event, callback)
		}
	}
	function socketOff(event: string) {
		if (socket_connect.value && socket.value) {
			socket.value.off(event)
		}
	}
	function socketJoin(room: string) {
		if (socket_connect.value && socket.value) {
			socket.value.emit('join', room)
		}
	}
	function socketLeave(room: string) {
		if (socket_connect.value && socket.value) {
			socket.value.emit('leave', room)
		}
	}

	return {
		socket_connect,
		socketEmit,
		socketOn,
		socketOff,
		socketJoin,
		socketLeave
	}
})
