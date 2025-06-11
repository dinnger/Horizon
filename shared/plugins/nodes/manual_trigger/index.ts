import type { INodeClass, INodeClassProperty, INodeClassPropertyType } from '@shared/interface/node.interface.js'

interface IProperties extends INodeClassProperty {
	delay: Extract<INodeClassPropertyType, { type: 'switch' }>
}
export default class implements INodeClass {
	info = {
		name: 'Event Manual',
		desc: 'Emit a manual event',
		icon: '󰆍',
		group: 'Integrations',
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
		console.debug(inputData.data)
		outputData('response', inputData.data)
	}
}
