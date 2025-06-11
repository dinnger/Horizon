import type { INodeClass, INodeClassProperty, INodeClassPropertyType } from '@shared/interface/node.interface.js'

interface IProperties extends INodeClassProperty {
	typeExec: Extract<INodeClassPropertyType, { type: 'options' }>
	schema: Extract<INodeClassPropertyType, { type: 'code' }>
	valueDefault: Extract<INodeClassPropertyType, { type: 'code' }>
}

export default class implements INodeClass {
	info = {
		name: 'Iniciador',
		desc: 'Nodo que permite iniciar un flujo',
		icon: '󱈎',
		group: 'Triggers',
		color: '#3498DB',
		connectors: {
			inputs: [],
			outputs: ['init']
		}
	}
	properties: IProperties = {
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

	async onExecute({ inputData, outputData }: Parameters<INodeClass['onExecute']>[0]) {
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
