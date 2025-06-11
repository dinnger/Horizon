import type { INodeClass, INodeClassProperty, INodeClassPropertyType } from '@shared/interface/node.interface.js'

interface IProperties extends INodeClassProperty {
	ack: Extract<INodeClassPropertyType, { type: 'switch' }>
}
export default class implements INodeClass {
	info = {
		name: 'Kafka Ack',
		desc: 'Confirma mensajes de un tópico de Kafka',
		icon: '󱀏',
		group: 'Kafka',
		color: '#3498DB',
		connectors: {
			inputs: ['input'],
			outputs: ['response', 'error']
		}
	}
	properties: IProperties = {
		ack: {
			name: 'Ack:',
			value: true,
			type: 'switch',
			description: 'Habilita la confirmación del mensaje, si no se confirma el mensaje se pierde (nack)',
			size: 1
		}
	}

	async onExecute({ inputData, outputData, execute }: Parameters<INodeClass['onExecute']>[0]) {
		try {
			const node = execute.getNodeByType('triggers/rabbit')
			if (!node) return outputData('error', { error: 'No se ha definido el nodo' })

			const channel = node?.meta?.channel
			const message = node?.meta?.message
			if (!channel || !message)
				return outputData('error', {
					error: 'No se ha definido el canal o mensaje'
				})

			if (this.properties.ack.value) {
				channel.ack(message)
			} else {
				channel.nack(message)
			}
			outputData('response', inputData.data)
		} catch (error) {
			let message = 'Error'
			if (error instanceof Error) message = error.toString()
			outputData('error', { error })
		}
	}
}
