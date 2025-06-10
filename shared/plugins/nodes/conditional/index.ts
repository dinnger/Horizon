import type {
	INodeClass,
	INodeClassOnCreate,
	INodeClassOnExecute,
	INodeClassProperty,
	INodeClassPropertyType
} from '@shared/interface/node.interface.js'

interface IProperties extends INodeClassProperty {
	conditions: Extract<INodeClassPropertyType, { type: 'list' }>
}

export default class ConditionalNode implements INodeClass<IProperties> {
	constructor(
		public info: INodeClass['info'],
		public properties: IProperties,
		public meta: { [key: string]: any } = {}
	) {
		this.info = {
			title: 'Conditional',
			desc: 'Evalúa una condición y ramifica según el resultado.',
			icon: '󰈲',
			group: 'Control Flow / Logic',
			color: '#9b59b6',
			connectors: {
				inputs: ['input'],
				outputs: ['error']
			},
			flags: {
				isSingleton: true
			}
		}

		this.properties = {
			conditions: {
				name: 'Condiciones:',
				type: 'list',
				object: {
					name: {
						name: 'Nombre:',
						type: 'string',
						value: 'condicion_{{index}}',
						maxlength: 20,
						onTransform: 'utils_standard_name',
						evaluation: {
							active: false
						}
					},
					condition: {
						name: 'Condición (JS):',
						type: 'string',
						value: 'input.data === true',
						evaluation: {
							all: true
						}
					},
					value: {
						name: 'Valor de salida:',
						type: 'string',
						value: '{{input.data}}'
					}
				},
				value: []
			}
		}
	}

	async onCreate({ context, environment }: INodeClassOnCreate) {
		const valor = this.properties.conditions.value
		this.info.connectors.outputs = []
		for (let i = 0; i < valor.length; i++) {
			const index = (i + 1).toString().padStart(2, '0')
			const name = valor[i]?.name?.value?.toString().trim().replace('{{index}}', index) || `condicion_${index}`
			this.info.connectors.outputs.push(name)
		}
		this.info.connectors.outputs.push('else')
		this.info.connectors.outputs.push('error')
	}

	async onExecute({ inputData, outputData }: INodeClassOnExecute): Promise<void> {
		try {
			const code = this.properties.conditions.value.map((m) => m.condition.value)

			let name = null
			for (let i = 0; i < code.length; i++) {
				if (code[i] === true) {
					const index = (i + 1).toString().padStart(2, '0')
					name = this.properties.conditions.value[i]?.name?.value?.toString().trim().replace('{{index}}', index) || `condicion_${index}`
					break
				}
			}

			if (!name) return outputData('else', inputData.data)

			outputData(name, inputData.data)
		} catch (error) {
			let message = 'Error'
			if (error instanceof Error) message = error.message
			outputData('error', { error: message })
		}
	}
}
