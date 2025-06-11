import type { INodeClass, INodeClassProperty, INodeClassPropertyType } from '@shared/interface/node.interface.js'

interface IProperties extends INodeClassProperty {
	valor: Extract<INodeClassPropertyType, { type: 'code' }>
}
export default class implements INodeClass {
	public meta: { [key: string]: any } = {}
	info = {
		name: 'Iteration',
		desc: 'Iterates over a list of items and processes each one.',
		icon: '󱖈',
		group: 'Procesamiento',
		color: '#F39C12',
		connectors: {
			inputs: ['init', 'add', 'next', 'finish'],
			outputs: ['response', 'finish', 'error']
		},
		flags: {
			isSingleton: true
		}
	}
	properties: IProperties = {
		valor: {
			name: 'Valor de la iteración:',
			type: 'code',
			lang: 'json',
			value: '{{input.data}}'
		}
	}

	async onExecute({ inputData, context, outputData }: Parameters<INodeClass['onExecute']>[0]) {
		try {
			this.meta.id = this.meta.id || new Date().getTime()

			const valorInput = this.meta.data || this.properties.valor.value
			if (!Array.isArray(valorInput)) {
				return outputData('error', {
					error: 'El valor de la iteración debe ser un listado (Array)'
				})
			}

			if (inputData.connectorName === 'init') {
				this.meta.data = valorInput as object[] | []
				this.meta.index = 0
				if (this.meta.index === valorInput.length - 1) {
					return outputData('finish', {
						index: this.meta.index,
						value: this.meta.data[this.meta.index]
					})
				}
				return outputData('response', { index: 0, value: valorInput[0] })
			}

			if (inputData.connectorName === 'next') {
				this.meta.index++
				if (this.meta.index > valorInput.length - 1) {
					return outputData('error', { error: 'No hay mas datos' })
				}
				if (this.meta.index === valorInput.length - 1) {
					return outputData('finish', {
						index: this.meta.index,
						value: this.meta.data[this.meta.index]
					})
				}
				return outputData('response', {
					index: this.meta.index,
					value: valorInput[this.meta.index]
				})
			}
		} catch (error) {
			console.log('🚀 ~ onExecute ~ error:', error)
			let message = 'Error'
			if (error instanceof Error) message = error.message
			outputData('error', { error: message })
		}
	}
}
