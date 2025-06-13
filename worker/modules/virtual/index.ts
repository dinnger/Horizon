import type { INode, INodeCanvas, INodeClass, INodeConnections } from '@shared/interface/node.interface.js'
import type { INodePropertiesType, IPropertiesType } from '@shared/interface/node.properties.interface.js'
import type { IWorkflow } from '@shared/interface/workflow.interface.js'
import type { Worker } from '../../worker.js'
import { CoreDependencies } from './../core/dependency.module.js'
import { updateChangeStatus } from './status.module.js'
import { utils_standard_name } from '@shared/utils/utilities.js'
import { getNodeClass } from '@shared/maps/nodes.map.js'

interface IPropertyNode {
	node: INode
	key: string
	value: IPropertiesType
}
interface IPropertyInit {
	node: INode
}
type IPropertyWatch = IPropertyNode | IPropertyInit

type IProperties = IWorkflow['properties']

// ============================================================================
// Iniciadores
// ============================================================================
let virtualProject: any = {}
const virtualNode: Map<string, INodeCanvas> = new Map()
const virtualConnections: Map<string, INodeConnections> = new Map()
let virtualProperties: IProperties = {
	basic: {
		router: '/'
	}
}

// ============================================================================
// Virtual Node
// ============================================================================
interface IMetaNode {
	[key: string]: any
}

export class VirtualNode implements INodeCanvas {
	id?: string
	type: string
	info: INodeCanvas['info']
	design: INodeCanvas['design']
	properties: INodeCanvas['properties']
	meta: INode['meta']
	isManual?: boolean

	constructor(value: INodeCanvas) {
		this.id = value.id
		this.info = value.info
		this.info.name = utils_standard_name(value.info.name)
		this.type = value.type
		this.design = value.design
		this.properties = value.properties
		this.meta = value.meta
	}

	/**
	 * Actualiza la información de la propiedad
	 */
	update() {
		if (!this.properties) return
		for (const [key, value] of Object.entries(this.properties)) {
			if ('onTransform' in value && value.onTransform) {
				this.properties[key].value =
					typeof value.onTransform === 'function'
						? value.onTransform(this.properties[key].value)
						: utils_standard_name(String(this.properties[key].value))
			}
			if (this.properties[key].type === 'list') {
				const objets = this.properties[key].object
				for (const keyObject in objets) {
					const obj = objets[keyObject]
					if ('onTransform' in obj && obj.onTransform) {
						for (const keyProperty in this.properties[key].value) {
							const item = this.properties[key].value[keyProperty]
							const transform =
								typeof obj.onTransform === 'function'
									? obj.onTransform(item[keyObject].value)
									: utils_standard_name(String(item[keyObject].value))
							item[keyObject].value = transform
						}
					}
				}
			}
		}
	}
}

/**
 * Initializes virtual properties for a given node.
 *
 * @param {Object} params - The parameters for initialization.
 * @param {string} params.id - The unique identifier for the node.
 * @param {string} params.type - The type of the node.
 * @param {propertiesInterface} params.property - The properties to be assigned to the node.
 * @returns {Object} - An object containing a message and the updated propertiesNodeClass map, or an error message if the node type is not found.
 */
export class VirtualModule {
	el: Worker

	constructor({ el }: { el: Worker }) {
		this.el = el

		// Iniciar suscriptores entre el server y el worker
		this.el.communicationModule.subscriberMessage('getVirtualProperties', () => {
			return Promise.resolve({ data: virtualProperties })
		})

		this.el.communicationModule.subscriberMessage('getVirtualNodes', () => {
			if (virtualNode.size === 0) return Promise.resolve(null)
			return Promise.resolve({
				data: JSON.stringify(Object.fromEntries(virtualNode))
			})
		})

		this.el.communicationModule.subscriberMessage('getVirtualConnections', () => {
			return Promise.resolve({
				data: JSON.stringify(Array.from(virtualConnections.values()))
			})
		})

		this.el.communicationModule.subscriberMessage('getVirtualProject', () => {
			return Promise.resolve({
				data: JSON.stringify(virtualProject)
			})
		})
	}

	/**
	 * Virtual project
	 * @param {Object} param - The parameter object.
	 * @param {Object} param.data - The project data.
	 */
	async virtualProject(data: any) {
		virtualProject = data
	}

	/**
	 * Updates virtual properties and optionally marks changes
	 * @param data - The workflow properties to set
	 * @param isInit - Flag indicating if this is an initialization call. If false, change status will be updated
	 * @returns Promise that resolves when properties are updated
	 */
	async virtualPropertiesWatch(data: IProperties, isInit = false) {
		virtualProperties = data
		if (!isInit) updateChangeStatus(true)
	}

	/**
	 * Initializes the virtual properties for a node.
	 * Permite tener un registro de los cambios en las propiedades de un nodo de forma virtual
	 *
	 * @param {Object} params - The parameters for initializing the properties.
	 * @param {string} params.id - The unique identifier of the node.
	 * @param {string} params.type - The type of the node.
	 * @param {propertiesInterface} params.property - The properties to be assigned to the node.
	 * @returns {Object} - An object containing a message indicating the result of the initialization or an error message if the node type is not found.
	 */
	async virtualNodeAdd({
		node,
		isNew = false
	}: {
		node: INodeCanvas
		isNew?: boolean
		// Cargando todas las propiedades de la clase y no solo el value almacenado
	}) {
		if (!node.info) return
		if (!node.id) return
		const newNode = new VirtualNode(node)
		virtualNode.set(node.id, newNode)

		await this.virtualNodePropertiesWatch({ node })
		if (isNew) updateChangeStatus(true)
	}

	/**
	 * Removes a virtual node by its ID.
	 *
	 * @param {Object} param - The parameter object.
	 * @param {string} param.idNode - The ID of the node to be removed.
	 * @returns {Promise<void>} A promise that resolves when the node has been removed.
	 */
	async virtualNodeRemove({ idNode }: { idNode: string }) {
		virtualNode.delete(idNode)
		updateChangeStatus(true)
	}

	/**
	 * Adds a virtual connection to the virtualConnections map and updates the change status.
	 *
	 * @param data - The connection node data to be added.
	 */
	async virtualConnectionAdd(data: INodeConnections) {
		virtualConnections.set(data.id!, data)
		if (data.isNew) updateChangeStatus(true)
	}

	/**
	 * Removes a virtual connection from the virtualConnections map and updates the change status.
	 *
	 * @param data - The connection node data containing the ID of the connection to be removed.
	 */
	async virtualConnectionRemove({ id }: { id: string }) {
		virtualConnections.delete(id)
		updateChangeStatus(true)
	}

	/**
	 * Updates the properties, meta, and coordinates of a virtual node.
	 *
	 * @param {Object} param - The parameter object.
	 * @param {INode} param.node - The node object containing updated properties, meta, and coordinates.
	 * @returns {Promise<void>} - A promise that resolves when the update is complete.
	 */
	async virtualNodeChangeMeta({ idNode, value }: { idNode: string; value: any }) {
		const vNode = virtualNode.get(idNode)
		if (!vNode) return
		vNode.meta = { ...(vNode.meta || {}), ...value }
		updateChangeStatus(true)
	}

	async virtualNodeChangePosition({ idNode, value }: { idNode: string; value: any }) {
		const vNode = virtualNode.get(idNode)
		if (!vNode) return
		vNode.design = { ...vNode.design, ...value }
		updateChangeStatus(true)
	}

	/**
	 * Watches for changes in virtual properties of a node and triggers the onCreate method if defined.
	 *
	 * @param {Object} params - The parameters for the function.
	 * @param {Object} params.node - The node object containing id and type.
	 * @param {string} params.node.id - The unique identifier of the node.
	 * @param {string} params.node.type - The type of the node.
	 * @param {string} params.key - The key of the property to be watched.
	 * @param {propertiesType} params.value - The value of the property to be watched.
	 *
	 * @returns {Promise<Object>} - An object containing an error message if the node is not found.
	 *
	 * @example
	 * const result = await virtualPropertiesWatch({
	 *   node: { id: 'node1', type: 'typeA' },
	 *   key: 'propertyKey',
	 *   value: 'propertyValue'
	 * });
	 */
	async virtualNodePropertiesWatch(data: IPropertyWatch) {
		// isInit determina si se llama desde init para inicializar los valors (value)
		const isInit = !('key' in data)
		if (!data.node.id) return { error: 'No se encontró el nodo' }
		const node = virtualNode.get(data.node.id)

		if (!node) return { error: 'No se encontró el nodo' }

		// Si se llama desde init se toman las propiedades directas como referencia de memoria
		const nodeProperty: INodePropertiesType | undefined = node.properties
		if (!nodeProperty) return { error: 'No se encontró la propiedad en el nodo' }

		if (!isInit) nodeProperty[data.key].value = data.value

		const classList = getNodeClass()
		const nodeClassExist = classList[node.type]
		if (!nodeClassExist) return { error: 'No se encontró el nodo' }
		const nodeClass: INodeClass = new (nodeClassExist.class as any)()

		for (const [key, value] of Object.entries(nodeProperty)) {
			const nodeClassProperty = nodeClass.properties[key] as any
			for (const [keyProperty, value] of Object.entries(nodeClassProperty)) {
				if (nodeClassProperty[keyProperty] !== undefined && key in nodeProperty && keyProperty in nodeProperty[key]) {
					nodeClassProperty[keyProperty] = nodeProperty[key][keyProperty as keyof (typeof nodeProperty)[typeof key]]
				}
			}
		}
		if (!isInit) nodeClass.properties[data.key].value = data.value

		if (isInit) {
			node.info = nodeClass.info
		} else {
			updateChangeStatus(true)
		}

		// Secrets y credenciales
		// FIXME: No se actualiza al crear nuevos nodos
		// await this.el.variableModule.virtualSecretsAndCredentials(node.type, nodeClass.properties)

		const changes: { key: string; before: any; value: any }[] = []
		const beforeProperties = JSON.parse(JSON.stringify(nodeProperty))

		// Analizando las propiedades
		const analizar = ({
			beforeProperties,
			property,
			tempKey
		}: {
			beforeProperties: { [key: string]: any }
			property: { [key: string]: any }
			tempKey?: string
		}) => {
			for (const [keyProperty, valueProperty] of Object.entries(property)) {
				if (typeof valueProperty === 'object') {
					if (beforeProperties[keyProperty]) {
						analizar({
							beforeProperties: beforeProperties[keyProperty],
							property: valueProperty,
							tempKey: tempKey ? `${tempKey}.${keyProperty}` : keyProperty
						})
					} else {
						// beforeProperty[keyProperty] = structuredClone(
						// 	property[keyProperty]
						// )
						const newKey = tempKey ? `${tempKey}.${keyProperty}` : keyProperty
						changes.push({
							key: newKey,
							before: beforeProperties[keyProperty],
							value: property[keyProperty]
						})
					}
				} else {
					const newKey = tempKey ? `${tempKey}.${keyProperty}` : keyProperty
					if (beforeProperties[keyProperty] !== property[keyProperty]) {
						// Valida que no sea el mismo key del origen
						if (!isInit && newKey.indexOf(`${(data as IPropertyNode).key}.`) !== 0) {
							changes.push({
								key: newKey,
								before: beforeProperties[keyProperty],
								value: property[keyProperty]
							})
						}
					}
				}
			}
		}

		// Actualizando información de la propiedad si tienen transform
		// if (node.update && node.properties) {
		// 	node.update()
		// 	const tempProperty = JSON.parse(JSON.stringify(node.properties))
		// 	for (const key in tempProperty) {
		// 		// biome-ignore lint/performance/noDelete: <explanation>
		// 		if (tempProperty[key].object) delete tempProperty[key].object
		// 	}
		// 	analizar({
		// 		beforeProperties,
		// 		property: tempProperty,
		// 		tempKey: '_'
		// 	})
		// }

		// Si existe el onCreate
		if (nodeClass.onCreate) {
			await nodeClass.onCreate({
				context: this.el.context,
				environment: this.el.environment,
				dependency: CoreDependencies('create')
			})
			if (JSON.stringify(node.info.connectors?.inputs) !== JSON.stringify(nodeClass.info.connectors.inputs)) {
				changes.push({
					key: '_inputs_',
					before: structuredClone(node.info.connectors?.inputs),
					value: nodeClass.info.connectors.inputs
				})
				if (node.info.connectors) node.info.connectors.inputs = nodeClass.info.connectors.inputs
			}
			if (JSON.stringify(node.info.connectors?.outputs) !== JSON.stringify(nodeClass.info.connectors.outputs)) {
				changes.push({
					key: '_outputs_',
					before: structuredClone(node.info.connectors?.outputs),
					value: nodeClass.info.connectors.outputs
				})
				if (node.info.connectors) node.info.connectors.outputs = nodeClass.info.connectors.outputs
			}

			analizar({
				beforeProperties,
				property: nodeClass.properties
			})
			node.properties = nodeClass.properties

			node.info.connectors = nodeClass.info.connectors

			return changes
		}
		node.properties = nodeClass.properties
		return changes
	}

	/**
	 * Virtual action
	 * @param {Object} param - The parameter object.
	 * @param {INode} param.node - The node object containing the properties.
	 * @param {string} param.action - The action to be executed.
	 * @param {any} param.event - The event data.
	 * @returns {Promise<Object>} - An object containing the changes.
	 */
	async virtualAction({ node, action, event }: { node: INodeCanvas; action: string; event: any }) {
		if (!node.id) return { error: 'No se encontró el nodo' }
		const nodeC = virtualNode.get(node.id)
		if (!nodeC) return { error: 'No se encontró el nodo' }
		const getNodeC = getNodeClass()[nodeC.type].class
		if (!getNodeC) return { error: 'No se encontró el nodo' }
		const nodeClass = new (getNodeC.class as any)()
		nodeClass.properties = nodeC.properties
		const changes = await nodeClass.onAction()
		if (changes) return changes[action]()
		return changes
	}
}
