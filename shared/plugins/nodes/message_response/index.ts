import type { INodeClass, INodeClassProperty, INodeClassPropertyType } from '@shared/interface/node.interface.js'

interface IProperties extends INodeClassProperty {
	response: Extract<INodeClassPropertyType, { type: 'code' }>
}

export default class implements INodeClass {
	private server: any
	private connections: any[] = []
	public meta: { [key: string]: any } = {}

	info = {
		name: 'Message Response',
		desc: 'Response to messages',
		icon: '󱧍',
		group: 'Project',
		color: '#3498DB',
		connectors: {
			inputs: ['response', 'rollback'],
			outputs: []
		},
		flags: {
			isSingleton: true
		}
	}
	properties: IProperties = {
		response: {
			name: 'Respuesta:',
			value: JSON.stringify({ status: 'OK' }, null, ' '),
			type: 'code',
			lang: 'json',
			description: 'Datos a enviar como respuesta al cliente (opcional)',
			size: 4
		}
	}

	async onExecute({ execute, outputData }: Parameters<INodeClass['onExecute']>[0]) {
		try {
			const node = execute.getNodeByType('project/connection/message')
			if (!node || !node.meta) {
				return outputData('error', { error: 'No se encontró el nodo' })
			}
			if (this.properties.response.value) {
				let response: any = this.properties.response.value
				if (typeof response === 'object') {
					const { uid, name } = node.meta
					response = JSON.stringify({ type: 'response', name, uid, response })
				}
				node.meta.socket.response(response)
				outputData('response', JSON.parse(String(response)))
			}
		} catch (error) {
			let message = 'Error'
			if (error instanceof Error) message = error.toString()
			outputData('error', { error: message })
		}
	}

	// Método para detener el servidor y cerrar todas las conexiones
	onDestroy(): void {
		if (this.server) {
			// Cerrar todas las conexiones abiertas
			for (const socket of this.connections) {
				socket.destroy()
			}
			this.connections = []

			// Cerrar el servidor
			this.server.close()
			this.server = null
		}
	}
}
