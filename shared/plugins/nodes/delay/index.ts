import type { INodeClass, INodeClassOnExecute, INodeClassProperty } from '@shared/interfaz/node.interfaz.js'

export default class implements INodeClass {
	constructor(
		public info: INodeClass['info'],
		public properties: INodeClassProperty
	) {
		this.info = {
			title: 'Delay',
			desc: 'Show value inside the console',
			icon: '󱫞',
			group: 'Timer',
			color: '#95A5A6',
			connectors: {
				inputs: ['input'],
				outputs: ['response']
			}
		}

		this.properties = {
			delay: {
				name: 'Tiempo de Espera (seg)',
				type: 'number',
				value: 3
			}
		}
	}

	async onExecute({ inputData, outputData }: INodeClassOnExecute) {
		setTimeout(
			() => {
				outputData('response', inputData.data)
			},
			(this.properties.delay.value as number) * 1000
		)
	}
}
