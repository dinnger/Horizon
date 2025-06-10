import type { INodeClass, INodeClassOnExecute, INodeClassProperty } from '@shared/interface/node.interface.js'

export default class implements INodeClass {
	constructor(
		public info: INodeClass['info'],
		public properties: INodeClassProperty
	) {
		this.info = {
			title: 'Console',
			desc: 'Show value inside the console',
			icon: '󰆍',
			group: 'Utilities',
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
		console.debug('[console]', inputData.data)
		outputData('response', inputData.data)
	}
}
