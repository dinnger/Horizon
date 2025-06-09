import type { INodeClass, INodeClassOnExecute, INodeClassProperty } from '@shared/interfaz/node.interfaz.js'

export default class implements INodeClass {
	public info: INodeClass['info']
	public properties: INodeClassProperty
	constructor() {
		this.info = {
			title: 'Iniciador',
			desc: 'Nodo que permite iniciar un flujo',
			icon: '󱈎',
			group: 'Triggers',
			color: '#3498DB',
			connectors: {
				inputs: [],
				outputs: ['init']
			}
		}
		this.properties = {
			typeExec: {
				name: 'Tipo de Ejecución:',
				type: 'options',
				options: [
					{
						label: 'por Ejecución',
						value: 'local'
					},
					{
						label: 'Global',
						value: 'global'
					}
				],
				value: 'local'
			},
			schema: {
				name: 'Esquema de Datos',
				description: 'Si es llamado por otro flujo, informara la estructura que necesita el flujo actual',
				type: 'code',
				lang: 'json',
				value: JSON.stringify({ dato1: 'string', dato2: 'number' }, null, 2)
			},
			valueDefault: {
				name: 'Valor por Defecto',
				type: 'code',
				lang: 'json',
				value: '{\n}'
			}
		}
	}

	async onExecute({ inputData, outputData }: INodeClassOnExecute) {
		// globalExec determina que los valres ejecutados seran accesibles de forma global
		if (this.properties.typeExec.value === 'local')
			outputData(
				'init',
				{ data: inputData.data || this.properties.valueDefault.value },
				{
					nextIsTrigger: true
				}
			)
		if (this.properties.typeExec.value === 'global')
			outputData(
				'init',
				{ data: inputData.data || this.properties.valueDefault.value },
				{
					globalExec: true,
					nextIsTrigger: true
				}
			)
	}
}
