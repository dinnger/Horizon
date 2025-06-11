import type { INode, INodeCanvas, INodeClass } from '@shared/interface/node.interface.js'
import type { Worker } from '../../worker.js'
import envs from '../../../shared/utils/envs.js'
import dayjs from 'dayjs'
import { v4 as uid } from 'uuid'
import { getMemoryUsage, getTime } from '../../utils/utils.js'
import { initProperties } from '../../worker_properties.js'
import { CoreTrace } from './trace.module.js'
import { CoreDependencies } from './dependency.module.js'
import { CoreCredential } from './credential.module.js'
import { CoreDebug } from './debug.module.js'
import { CoreGlobalStore } from './store.module.js'
import { convertJson } from '../../../shared/utils/utilities.js'
import { getNodeClass } from '@shared/maps/nodes.map.js'
// -----------------------------------------------------------------------------
// Base
// -----------------------------------------------------------------------------

export const info = {}
export class CoreModule {
	el: Worker
	debug: CoreDebug
	trace: CoreTrace = new CoreTrace()
	globalStore: CoreGlobalStore = new CoreGlobalStore()

	constructor({ el }: { el: Worker }) {
		this.el = el
		this.debug = new CoreDebug({ el })
		this.initConsole()
	}

	/**
	 * Initializes the console to intercept and log all calls to `console.log`.
	 * This method overrides the default `console.log` function to first log a warning
	 * with the provided arguments and then call the original `console.log` function.
	 *
	 * @example
	 * ```typescript
	 * initConsole();
	 * console.log('Hello, World!'); // Logs: console.log ['Hello, World!'] and then logs: Hello, World!
	 * ```
	 */
	initConsole() {
		const cl = console.log
		console.log = (...args) => {
			// console.warn('console.log', args)
			if (args.length > 1) {
				args[0] = `\x1b[42m Execute \x1b[0m \x1B[34m${args[0]} \x1B[0m`
				args.unshift(`\x1B[43m Worker ${this.el.index && this.el.index > 0 ? this.el.index : ''} \x1B[0m`)
			}
			if (args.length === 1) args.unshift(`\x1B[43m Worker ${this.el.index && this.el.index > 0 ? this.el.index : ''} \x1B[0m`)
			cl.apply(console, args)
		}
		console.debug = (...args) => {
			this.el.communicationModule.sendLogs([
				{
					date: dayjs().format('DD/MM/YYYY HH:mm:ss.SSS'),
					level: 'info',
					message: JSON.stringify(args)
				}
			])
			// cl.apply(console, args)
		}
	}

	/**
	 * Executes the given node with the provided execution data.
	 *
	 * @param {Object} params - The parameters for execution.
	 * @param {Interface_Node} params.node - The node to be executed.
	 * @param {Object.<string, {data: object, meta?: object}>} params.executeData - The execution data for the nodes.
	 *
	 * @returns {IWorkflowExecutionInterface} The execution interface containing methods and properties for execution.
	 */
	execute = ({
		node,
		executeData
	}: {
		node: INodeClass
		executeData: Map<string, { data: object; meta?: object; time: number }>
	}) => {
		const data: Parameters<INodeClass['onExecute']>[0]['execute'] = {
			isTest: false,
			getNodeById: (id: string) => {
				return this.el.nodeModule.nodes[id]
			},
			getNodeByType: (type: string) => {
				const typeNodes = this.el.nodeModule.nodesType.get(type)
				if (!typeNodes) return null
				let lastExecuteData = null
				let lastTime = 0
				for (const node of typeNodes) {
					const executeDataNode = executeData.get(node)
					if (executeDataNode && (lastTime === 0 || executeDataNode.time > lastTime)) {
						lastTime = executeDataNode.time
						lastExecuteData = {
							node: this.el.nodeModule.nodes[node],
							meta: executeDataNode.meta,
							data: executeDataNode.data
						}
					}
				}
				return lastExecuteData
			},
			// Devuelve los nodos que se conectan a un nodo
			getNodesInputs: (idNode: string) => {
				return this.el.nodeModule.connectionsInputs[idNode]
			},
			// Devuelve los nodos que se conectan a un nodo
			getNodesOutputs: (idNode: string) => {
				return this.el.nodeModule.connectionsOutputs[idNode]
			},
			getExecuteData: () => {
				return executeData
			},
			setExecuteData: (data) => {
				executeData = data
			},
			setGlobalData: ({ type, key, value }) => {
				this.globalStore.set(`${type}_${key}`, value)
			},
			getGlobalData: ({ type, key }) => {
				return this.globalStore.get(`${type}_${key}`)
			},
			deleteGlobalData: ({ type, key }) => {
				this.globalStore.delete(`${type}_${key}`)
			},
			ifExecute: (): boolean => {
				if (!node.id) return false
				return !!executeData.has(node.id)
			},
			stop: (): void => {
				console.log('stop')
			}
		}
		return data
	}

	/**
	 * Executes a console log for a given node execution with detailed timing and memory usage information.
	 *
	 * @param params - The parameters for the console execution.
	 * @param params.uuid - The unique identifier for the execution.
	 * @param params.node - The node being executed.
	 * @param params.destiny - The list of destination nodes.
	 * @param params.executeTime - The time taken for the execution.
	 * @param params.executeMeta - Metadata about the execution.
	 * @param params.executeMeta.accumulativeTime - The accumulative time of the execution.
	 * @param params.startTime - The start time of the execution.
	 * @param params.data - Additional data related to the execution.
	 */
	consoleExecute({
		uuid,
		node,
		destiny,
		executeTime,
		executeMeta,
		data
	}: {
		uuid: string
		node: INodeCanvas
		destiny: string[]
		executeTime: number
		executeMeta: { accumulativeTime: number }
		startTime: number

		data: any
	}) {
		// Consola
		if (this.el.isDev || envs.WORKER_TRACE) {
			const memory = getMemoryUsage()
			const executeTimeString = executeTime
			if (envs.WORKER_TRACE) {
				const timeString = `[Duration: ${`${executeTimeString}ms`.toString().padEnd(10, ' ')} Accumulative: ${`${executeMeta.accumulativeTime}ms`.padEnd(10, ' ')} Memory: ${memory}mb]`
				const consoleExecute = `\x1b[42m Execute \x1b[0m ${node.info.name.padEnd(13, ' ')} --> `
				for (const o of destiny) {
					console.log(`${consoleExecute} ${o.padEnd(13, ' ')} \x1b[34m ${timeString.padEnd(40, ' ')} \x1b[0m`)
				}
			}
			// Enviar mensaje de debug
			this.debug.send({
				uid,
				node,
				destiny,
				executeTimeString,
				executeMeta,
				data,
				memory
			})
		}
	}

	/**
	 * Starts the execution of a node.
	 *
	 * @param {Object} params - The parameters for execution.
	 * @param {string} [params.uuid] - The unique identifier for the execution.
	 * @param {Interface_Node} [params.node] - The node to be executed.
	 * @param {Object} params.inputData - The input data for the node.
	 * @param {Object} params.inputData.data - The actual input data.
	 * @param {Object} [params.meta] - Additional metadata.
	 * @param {Object} params.executeData - Data required for execution.
	 * @param {Object} params.executeMeta - Metadata for execution.
	 * @param {number} params.executeMeta.accumulativeTime - The accumulative time for execution.
	 */
	startExecution({
		uuid = '',
		node,
		inputData,
		executeMeta,
		executeData = new Map(),
		executeClass = new Map(),
		meta
	}: {
		uuid?: string
		node?: INodeCanvas
		inputData: { idNode: string; connectorType: 'input' | 'output' | 'callback'; connectorName: string; data: object }
		executeData: Map<string, { data: object; meta?: object; time: number }>
		executeMeta: { accumulativeTime: number }
		executeClass?: Map<string, INodeClass>
		meta?: object
	}) {
		node = node || this.el.nodeModule.nodesInit || undefined
		if (!node) return
		uuid = uuid || uid()

		// Class
		// if (isNewExecution) executeClass.clear()
		let classExecute: INodeClass | undefined = undefined
		if (!node.id || !node.type) return
		if (!executeClass.has(node.id)) {
			const defineClass = getNodeClass()[node.type].class
			classExecute = new (defineClass as any)()
			if (classExecute?.info?.flags?.isSingleton) executeClass.set(node.id, classExecute)
		} else {
			classExecute = executeClass.get(node.id)
		}
		if (!classExecute) {
			throw new Error(`Class for node id ${node.id} not found`)
		}

		// Observer
		if (this.el.isDev) {
			if (this.trace.dataNode.has(node.id)) this.trace.dataNode.set(node.id, classExecute)
			this.trace.traceExecute({ id: node.id, type: 'inputs' })
		}

		// remplazando propiedades que se hayan definido en el nodo
		const fnProperties = new initProperties({
			el: this.el,
			node,
			nodes: this.el.nodeModule.nodes,
			input: inputData,
			context: this.el.context,
			executeData
		})
		for (const key in classExecute.properties) {
			if (node.properties?.[key]) {
				classExecute.properties[key].value = node.properties[key].value
			}

			// Analizar propiedades si es necesario hacer un replace
			const matchReg = JSON.stringify(classExecute.properties[key]).match(/\{\{((?:(?!\{\{|\}\}).)+)\}\}/g)
			if (matchReg) {
				classExecute.properties[key] = fnProperties.analizarProperties(node.info.name, classExecute.properties[key])
			} else {
				if (typeof classExecute.properties[key] === 'string') {
					classExecute.properties[key] = convertJson(classExecute.properties[key])
				}
			}
		}

		// metada
		classExecute.meta = node.meta

		// Verificar si es trigger
		const isTrigger = this.el.nodeModule.nodesClass[node.type].info.flags?.isTrigger

		// Iniciador de tiempo
		const startTime = isTrigger ? null : getTime()

		// Iniciar logs
		const logStart:
			| {
					type: 'none' | 'info' | 'warn' | 'error' | 'debug'
					value: string
			  }
			| undefined = node?.meta?.logs?.start
		const logExec:
			| {
					type: 'none' | 'info' | 'warn' | 'error' | 'debug'
					value: string
			  }
			| undefined = node?.meta?.logs?.exec

		if (logStart && logStart.type !== 'none') {
			this.el.communicationModule.logger[logStart.type](fnProperties.analizarString(node.info.name, logStart.value), {
				node: node.info.name
			})
		}

		// Nodo actual
		const currentNode = {
			...node
		}

		const execute = this.execute({ node: classExecute, executeData })

		// Ejecución del nodo
		classExecute.onExecute({
			app: this.el.app,
			execute,
			environment: {
				SERVER_URL: envs.SERVER_URL,
				SERVER_BASE: envs.SERVER_BASE
			},
			context: {
				...this.el.context,
				currentNode
			},
			logger: this.el.communicationModule.logger,
			inputData,
			outputData: (output_name, data, meta) => {
				// Si es trigger, generar uuid
				if (isTrigger) uuid = uid()

				// Registrando tiempo
				const executeTime: number = startTime ? Number.parseFloat((getTime() - startTime).toFixed(3)) : 0

				// Observer
				if (this.el.isDev) {
					if (!node.id) return
					if (this.trace.dataNode.has(node.id)) this.trace.dataNode.set(node.id, classExecute)
					this.trace.traceExecute({ id: node.id, type: 'outputs', connectName: output_name, executeTime })
				}

				// Registrando logs
				if (logExec && logExec.type !== 'none') {
					const value = fnProperties.setInput(data).analizarString(node.info.name, logExec.value)
					this.el.communicationModule.logger[logExec.type](value, {
						node: node.info.name
					})
				}

				const executeDateNode = execute.getExecuteData()
				if (!node.id) return
				executeDateNode.set(node.id, { data, meta, time: getTime() })
				executeMeta.accumulativeTime = Number.parseFloat((executeMeta.accumulativeTime + executeTime).toFixed(3))

				const hasOutputs = this.el.nodeModule.connections[node.id] && this.el.nodeModule.connections[node.id][output_name]
				if (hasOutputs) {
					// Console
					this.consoleExecute({
						uuid,
						node,
						destiny: this.el.nodeModule.connections[node.id][output_name].map(
							(o: any) => this.el.nodeModule.nodes[o.id_node_destiny].info.name
						),
						executeTime,
						executeMeta,
						startTime: startTime || 0,
						data
					})

					const outputs = this.el.nodeModule.connections[node.id][output_name]

					for (const output of outputs) {
						const newExecuteData = new Map(executeDateNode)
						const newExecuteMeta = { ...executeMeta }

						// Propagar metadatos/callback si existen
						let nextMeta = meta
						if (meta && typeof meta === 'object' && (meta as any).callback) {
							// Si ya existe una cadena de callbacks, la propagamos
							nextMeta = { ...(meta as any) }
						}

						this.startExecution({
							uuid,
							node: this.el.nodeModule.nodes[output.idNodeDestiny],
							inputData: {
								idNode: node.id,
								connectorType: output.connectorDestinyType,
								connectorName: output.connectorDestinyName,
								data
							},
							meta: nextMeta,
							executeData: newExecuteData,
							executeMeta: newExecuteMeta,
							executeClass
						})
					}
				} else {
					// Si no existen outputs, retornar la información al callback si existe
					if (meta && typeof meta === 'object' && typeof (meta as any).callback === 'function') {
						;(meta as any).callback({ output: output_name, data, meta })
					} else {
						// executeClass.clear()
						executeData.clear()
						executeDateNode.clear()
						this.consoleExecute({
							uuid,
							node,
							destiny: ['Finished'],
							executeTime,
							executeMeta,
							startTime: startTime || 0,
							data
						})
					}
				}
			},
			dependency: CoreDependencies('execute'),
			credential: CoreCredential.apply(classExecute)
		})
	}
}
