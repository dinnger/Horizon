import type { INodeClass, INodeClassProperty, INodeClassPropertyType } from '@shared/interface/node.interface.js'

interface IProperties extends INodeClassProperty {
	host: Extract<INodeClassPropertyType, { type: 'string' }>
	port: Extract<INodeClassPropertyType, { type: 'number' }>
	timeout: Extract<INodeClassPropertyType, { type: 'number' }>
	encoding: Extract<INodeClassPropertyType, { type: 'options' }>
	message: Extract<INodeClassPropertyType, { type: 'code' }>
	retries: Extract<INodeClassPropertyType, { type: 'number' }> // Nueva propiedad para reintentos
}

export default class TcpProducer implements INodeClass {
	public client: any
	info = {
		name: 'TCP Producer',
		desc: 'Envía datos a través de una conexión TCP',
		icon: '󰹑',
		group: 'TCP',
		color: '#3498DB',
		connectors: {
			inputs: ['init'],
			outputs: ['response', 'error']
		},
		flags: {
			isSingleton: true
		}
	}
	properties: IProperties = {
		host: {
			name: 'Host:',
			value: 'localhost',
			type: 'string',
			size: 2
		},
		port: {
			name: 'Puerto:',
			value: 9000,
			type: 'number',
			size: 2
		},
		timeout: {
			name: 'Timeout (ms):',
			value: 5000,
			type: 'number',
			description: 'Tiempo máximo de espera para la conexión',
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
			description: 'Codificación de los datos',
			size: 2
		},
		message: {
			name: 'Mensaje:',
			value: JSON.stringify({ data: 'Hello World' }, null, ' '),
			type: 'code',
			lang: 'json',
			size: 4
		},
		retries: {
			name: 'Reintentos:',
			value: 0,
			type: 'number',
			description: 'Número de reintentos antes de fallar. 0 significa indefinido.',
			size: 2
		} // Nueva propiedad para reintentos
	}

	async onExecute({ inputData, outputData, dependency, context }: Parameters<INodeClass['onExecute']>[0]): Promise<void> {
		try {
			const retries = this.properties.retries.value
			let attempts = 0

			const connection = async () => {
				// Utilizamos el módulo net nativo de Node.js
				const host = this.properties.host.value
				const port = this.properties.port.value
				const timeout = this.properties.timeout.value
				const encoding = this.properties.encoding.value

				// Preparamos el mensaje
				let message = this.properties.message.value
				if (typeof message === 'object') {
					message = JSON.stringify(message)
				}

				// Creamos el cliente
				if (!this.client) {
					const net = await dependency.getRequire('node:net')
					this.client = net.createConnection({ host, port }, () => {
						console.log(`Conexión TCP establecida al servidor ${host}:${port}`)
					})

					// Configuramos encoding
					this.client.setEncoding(encoding)

					// Manejamos eventos
					this.client.on('data', (data: Buffer) => {
						console.log(`Datos recibidos del servidor: ${data.toString()}`)
						outputData('response', {
							message: 'Datos enviados correctamente',
							response: data.toString()
						})
						// this.client.end()
					})

					this.client.on('error', (err: Error) => {
						this.client.end()
						retry({ error: `Error en la conexión TCP: ${err.message}` })
					})

					this.client.on('end', () => {
						retry({ error: 'Conexión cerrada' })
					})

					this.client.on('connect', () => {
						console.log('Conexión establecida')
						// Enviamos el mensaje
						this.client.write(message, encoding, () => {
							console.log(`Mensaje enviado: ${message}`)
						})
					})
				} else {
					this.client.write(message, encoding, () => {
						console.log(`Mensaje enviado: ${message}`)
					})
				}
			}

			// ======================================================================
			// RETRY
			// ======================================================================
			const retry = async ({ error }: { error: string }) => {
				attempts++
				if (this.client) this.client.end()
				this.client = null
				if (retries !== 0 && attempts >= retries) {
					outputData('error', { error })
				} else {
					await new Promise((resolve) => setTimeout(resolve, 10000))
					connection()
				}
			}

			connection()
		} catch (error) {
			let message = 'Error'
			if (error instanceof Error) message = error.toString()
			outputData('error', { error: message })
		}
	}
}
