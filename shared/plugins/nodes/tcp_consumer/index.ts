import type { INodeClass, INodeClassProperty, INodeClassPropertyType } from '@shared/interface/node.interface.js'

interface IProperties extends INodeClassProperty {
	host: Extract<INodeClassPropertyType, { type: 'string' }>
	port: Extract<INodeClassPropertyType, { type: 'number' }>
	encoding: Extract<INodeClassPropertyType, { type: 'options' }>
	response: Extract<INodeClassPropertyType, { type: 'code' }>
}

export default class implements INodeClass {
	private server: any
	private connections: any[] = []
	public meta: { [key: string]: any } = {}

	info = {
		name: 'TCP Consumer',
		desc: 'Recibe datos a través de una conexión TCP',
		icon: '󰥿',
		group: 'TCP',
		color: '#27AE60',
		connectors: {
			inputs: ['init', 'stop'],
			outputs: ['connection', 'data', 'closed', 'error']
		},
		flags: {
			isSingleton: true
		}
	}
	properties: IProperties = {
		host: {
			name: 'Host:',
			value: '0.0.0.0',
			type: 'string',
			description: 'Dirección IP donde escuchará el servidor (0.0.0.0 para todas las interfaces)',
			size: 2
		},
		port: {
			name: 'Puerto:',
			value: 9000,
			type: 'number',
			size: 2
		},
		encoding: {
			name: 'Encoding:',
			value: 'utf8',
			type: 'options',
			options: [
				{
					label: 'UTF-8',
					value: 'utf8'
				},
				{
					label: 'ASCII',
					value: 'ascii'
				},
				{
					label: 'Binario',
					value: 'binary'
				}
			],
			description: 'Codificación de los datos recibidos',
			size: 2
		},
		response: {
			name: 'Respuesta:',
			value: JSON.stringify({ status: 'OK' }, null, ' '),
			type: 'code',
			lang: 'json',
			description: 'Datos a enviar como respuesta al cliente (opcional)',
			size: 4
		}
	}

	async onExecute({ inputData, outputData, dependency, context }: Parameters<INodeClass['onExecute']>[0]): Promise<void> {
		try {
			const net = await import('node:net')

			// Detener servidor si se recibe la señal de stop
			if (inputData.connectorName === 'stop') {
				this.onDestroy()
				outputData('closed', { message: 'Servidor TCP detenido' })
				return
			}

			const host = this.properties.host.value
			const port = this.properties.port.value
			const encoding = this.properties.encoding.value

			// Crear servidor TCP
			this.server = net.createServer()

			// Manejar conexiones entrantes
			this.server.on('connection', (socket: any) => {
				console.log(`Nueva conexión desde ${socket.remoteAddress}:${socket.remotePort}`)

				// Agregar la conexión a la lista para poder cerrarla después
				this.connections.push(socket)

				// Configurar encoding
				socket.setEncoding(encoding)

				// Emitir evento de nueva conexión
				outputData('connection', {
					client: `${socket.remoteAddress}:${socket.remotePort}`,
					timestamp: new Date().toISOString()
				})

				// Manejar recepción de datos
				socket.on('data', (data: Buffer) => {
					console.log(`Datos recibidos: ${data.toString()}`)

					// Emitir evento de datos recibidos
					let parsedData = data.toString()
					try {
						parsedData = JSON.parse(parsedData)
					} catch (e) {
						// Si no es JSON, mantener como string
					}

					outputData('data', {
						client: `${socket.remoteAddress}:${socket.remotePort}`,
						data: parsedData,
						timestamp: new Date().toISOString()
					})

					// Enviar respuesta si está configurada
					if (this.properties.response.value) {
						let response = this.properties.response.value
						if (typeof response === 'object') {
							response = JSON.stringify(response)
						}
						socket.write(response)
					}
				})

				// Manejar cierre de conexión
				socket.on('end', () => {
					console.log(`Conexión cerrada desde ${socket.remoteAddress}:${socket.remotePort}`)
					// Eliminar la conexión de la lista
					this.connections = this.connections.filter((conn) => conn !== socket)
					outputData('closed', {
						client: `${socket.remoteAddress}:${socket.remotePort}`,
						timestamp: new Date().toISOString()
					})
				})

				// Manejar errores
				socket.on('error', (err: Error) => {
					console.log(`Error en la conexión: ${err.message}`)
					outputData('error', {
						client: `${socket.remoteAddress}:${socket.remotePort}`,
						error: err.message
					})
				})
			})

			// Manejar errores del servidor
			this.server.on('error', (err: Error) => {
				console.log(`Error en el servidor TCP: ${err.message}`)
				outputData('error', { error: err.message })
			})

			// Iniciar el servidor
			this.server.listen(port, host, () => {
				console.log(`Servidor TCP escuchando en ${host}:${port}`)
				outputData('connection', {
					message: `Servidor TCP iniciado en ${host}:${port}`,
					timestamp: new Date().toISOString()
				})
			})
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
