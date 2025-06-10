import type { INodeClass, INodeClassOnExecute, INodeClassProperty } from '@shared/interface/node.interface.js'

export default class implements INodeClass {
	public properties: INodeClassProperty
	public info: INodeClass['info']

	constructor() {
		this.info = {
			title: 'MCP Server',
			desc: 'Orquestador tipo tool router para exponer outputs como tools',
			icon: '󰘳',
			group: 'Orquestadores',
			color: '#8E44AD',
			connectors: {
				inputs: ['input'],
				outputs: ['response', 'error'],
				callbacks: ['tools']
			},
			flags: {
				isTrigger: true
			}
		}
		this.properties = {}
	}

	async onExecute({ execute, outputData, inputData, context }: INodeClassOnExecute) {
		// Extraer los outputs conectados a este nodo
		const nodeId = context.currentNode?.id
		if (!nodeId) return outputData('error', { error: 'No se encontró el nodo MCP' })
		const outputs = execute.getNodesOutputs(nodeId)
		if (!outputs || outputs.size === 0) return outputData('error', { error: 'No hay outputs conectados' })

		// Construir un objeto tools con una función por cada output
		const tools: Record<string, (params: any) => Promise<any>> = {}
		for (const outputName of outputs) {
			tools[outputName] = (params: any) => {
				return new Promise((resolve, reject) => {
					// Ejecutar el output como una "tool" usando la lógica de callback
					outputData(outputName, params, {
						callback: (result: any) => {
							if (outputName === 'error') reject(result)
							else resolve(result)
						}
					})
				})
			}
		}

		// Si se recibe un parámetro especial __tool, ejecuta la tool correspondiente
		const dataAny = inputData.data as any
		if (dataAny?.__tool && tools[dataAny.__tool]) {
			try {
				const result = await tools[dataAny.__tool](dataAny.params || {})
				return outputData('response', { tool: dataAny.__tool, result })
			} catch (err) {
				return outputData('error', { error: err })
			}
		}

		// Si no, devolver la lista de tools disponibles
		return outputData('response', {
			tools: Object.keys(tools),
			description: 'Puedes invocar cualquier tool pasando { __tool: "nombre", params: {...} }'
		})
	}
}
