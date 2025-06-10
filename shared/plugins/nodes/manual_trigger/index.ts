import type { INodeClass, INodeClassOnExecute, INodeClassProperty } from '@shared/interface/node.interface.js'

export default class implements INodeClass {
	constructor(
		public info: INodeClass['info'],
		public properties: INodeClassProperty
	) {
		this.info = {
			title: 'Event Manual',
			desc: 'Emit a manual event',
			icon: '󰆍',
			group: 'Integrations',
			color: '#95A5A6',
			connectors: {
				inputs: ['input'],
				outputs: ['response']
			}
		}

		this.properties = {
			delay: {
				name: 'Mostrar en producción',
				type: 'switch',
				value: false
			}
		}
	}

	async onExecute({ inputData, outputData }: INodeClassOnExecute) {
		console.debug(inputData.data)
		outputData('response', inputData.data)
	}
}
