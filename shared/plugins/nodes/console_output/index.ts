import type { INodeClass, INodeClassProperty, INodeClassPropertyType } from '@shared/interface/node.interface.js'

interface IProperties extends INodeClassProperty {
	delay: Extract<INodeClassPropertyType, { type: 'switch' }>
}

export default class implements INodeClass {
	info = {
		name: 'Console',
		desc: 'Show value inside the console',
		icon: '󰆍',
		group: 'Utilities',
		color: '#95A5A6',
		connectors: {
			inputs: ['input'],
			outputs: ['response']
		}
	}
	properties: IProperties = {
		delay: {
			name: 'Mostrar en producción',
			type: 'switch',
			value: false
		}
	}

	async onExecute({ inputData, outputData }: Parameters<INodeClass['onExecute']>[0]) {
		console.debug('[console]', inputData.data)
		outputData('response', inputData.data)
	}
}
