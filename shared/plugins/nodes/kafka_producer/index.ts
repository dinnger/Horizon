import type { INodeClass, INodeClassProperty, INodeClassPropertyType } from '@shared/interface/node.interface.js'

interface IProperties extends INodeClassProperty {
	value: Extract<INodeClassPropertyType, { type: 'code' }>
	topic: Extract<INodeClassPropertyType, { type: 'string' }>
	config: Extract<INodeClassPropertyType, { type: 'code' }>
	brokers: Extract<INodeClassPropertyType, { type: 'list' }>
}

export default class implements INodeClass {
	dependencies = ['kafkajs']
	info = {
		name: 'Kafka Producer',
		desc: 'Produce mensajes en un tópico de Kafka',
		icon: '󱀏',
		group: 'Kafka',
		color: '#3498DB',
		connectors: {
			inputs: ['input'],
			outputs: ['response', 'error']
		}
	}
	properties: IProperties = {
		value: {
			name: 'Valor:',
			value: '',
			type: 'code',
			lang: 'json',
			size: 4
		},
		topic: {
			name: 'Tópico:',
			value: '',
			type: 'string',
			size: 3
		},
		config: {
			name: 'Configuración:',
			type: 'code',
			lang: 'json',
			value: JSON.stringify(
				{
					clientId: 'my-app',
					sasl: {
						username: '',
						password: '',
						mechanism: 'scram-sha-512'
					},
					ssl: {
						rejectUnauthorized: false
					}
				},
				null,
				' '
			)
		},
		brokers: {
			name: 'Brokers:',
			description: 'Urls de conexión',
			type: 'list',
			object: {
				broker: {
					name: 'Broker:',
					type: 'string',
					value: ''
				}
			},
			value: []
		}
	}

	async onExecute({ outputData, dependency }: Parameters<INodeClass['onExecute']>[0]) {
		try {
			const { Kafka } = await dependency.getRequire('kafkajs')
			const kafka = new Kafka({
				...(this.properties.config.value as object),
				brokers: this.properties.brokers.value.map((m) => m.broker.value)
			})

			const producer = kafka.producer()
			const message = {
				value: typeof this.properties.value.value === 'object' ? JSON.stringify(this.properties.value.value) : '{}'
			}

			await producer.connect()
			const data = await producer.send({
				topic: this.properties.topic.value,
				messages: [message]
			})
			outputData('response', data)
		} catch (error) {
			let message = 'Error'
			if (error instanceof Error) message = error.toString()
			outputData('error', { error: message })
		}
	}
}
