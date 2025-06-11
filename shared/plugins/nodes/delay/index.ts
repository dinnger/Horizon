import type { INodeClass, INodeClassProperty, INodeClassPropertyType } from '@shared/interface/node.interface.js'

interface IProperties extends INodeClassProperty {
	delay: Extract<INodeClassPropertyType, { type: 'number' }>
}

export default class implements INodeClass {
	info = {
		name: 'Delay',
		desc: 'Show value inside the console',
		icon: '󱫞',
		group: 'Timer',
		color: '#95A5A6',
		connectors: {
			inputs: ['input'],
			outputs: ['response']
		}
	}
	properties: IProperties = {
		delay: {
			name: 'Tiempo de Espera (seg)',
			type: 'number',
			value: 3
		}
	}

	async onExecute({ inputData, outputData }: Parameters<INodeClass['onExecute']>[0]) {
		setTimeout(
			() => {
				outputData('response', inputData.data)
			},
			(this.properties.delay.value as number) * 1000
		)
	}
}
