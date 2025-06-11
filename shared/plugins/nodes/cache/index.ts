import type { INodeClass, INodeClassProperty, INodeClassPropertyType } from '@shared/interface/node.interface.js'

interface IClassProperties extends INodeClassProperty {
	key: Extract<INodeClassPropertyType, { type: 'string' }>
	stdTTL: Extract<INodeClassPropertyType, { type: 'number' }>
	checkperiod: Extract<INodeClassPropertyType, { type: 'number' }>
}

export default class implements INodeClass {
	private cacheInstance: any = null
	dependencies = ['node-cache']
	info = {
		name: 'Cache',
		desc: 'Almacena y recupera datos en memoria usando node-cache',
		icon: '󰍉',
		group: 'Utilities',
		color: '#27AE60',
		connectors: {
			inputs: ['get', 'set'],
			outputs: ['response', 'noExist']
		},
		flags: {
			isSingleton: true
		}
	}
	properties: IClassProperties = {
		key: {
			name: 'Clave',
			type: 'string',
			value: '',
			description: 'La clave para almacenar/recuperar datos del cache'
		},
		stdTTL: {
			name: 'TTL por defecto (segundos)',
			type: 'number',
			value: 600,
			description: 'Tiempo de vida por defecto para las claves en segundos (0 = sin expiración)'
		},
		checkperiod: {
			name: 'Período de verificación (segundos)',
			type: 'number',
			value: 120,
			description: 'Período en segundos para verificar claves expiradas (0 = deshabilitar)'
		}
	}

	async onCreate({ context, environment }: Parameters<NonNullable<INodeClass['onCreate']>>[0]) {
		// No hay configuraciones dinámicas por el momento
	}

	async onExecute({ execute, inputData, outputData, dependency }: Parameters<INodeClass['onExecute']>[0]) {
		const inputName = inputData.connectorName
		try {
			const NodeCache = await dependency.getRequire('node-cache')
			const key = typeof this.properties.key.value === 'string' ? this.properties.key.value : JSON.stringify(this.properties.key.value)

			if (!this.cacheInstance) {
				this.cacheInstance = new NodeCache({
					stdTTL: this.properties.stdTTL.value,
					checkperiod: this.properties.checkperiod.value
				})
			}

			if (inputName === 'set') {
				const node = execute.getNodeByType('utilities/caching/cache')
				if (!node || !node.meta) return outputData('error', { error: 'No se encontró el nodo' })

				this.cacheInstance.set(node.meta.key, inputData.data)

				outputData('response', inputData.data)
			} else if (inputName === 'get') {
				if (!key) {
					throw new Error('La clave no puede estar vacía')
				}
				// Operación GET: recuperar datos del cache
				const cachedData = this.cacheInstance.get(key)

				if (cachedData !== undefined) {
					outputData('response', cachedData, { key })
				} else {
					outputData('noExist', inputData.data, { key })
				}
			}
		} catch (error: any) {
			outputData('noExist', {
				error: error.message || 'Error desconocido en operación de cache',
				operation: inputName,
				key: this.properties.key.value
			})
		}
	}
}
