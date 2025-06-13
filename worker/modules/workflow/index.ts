import type { INode, INodeCanvas, INodeConnections } from '@shared/interface/node.interface.js'
import type { IWorkerDependencies } from '@shared/interface/worker.interface.js'
import type { Worker } from '../../worker.js'
import { v4 as uuidv4 } from 'uuid'
import { getNodeClass } from '@shared/maps/nodes.map.js'

export class NodeModule {
	el: Worker
	nodesInit: INodeCanvas | null = null
	nodes: { [key: string]: INodeCanvas & { class: any } } = {}
	nodesType = new Map<string, Set<string>>()
	nodesClass = getNodeClass()
	connections: {
		[key: string]: {
			[key: string]: { idNodeDestiny: string; connectorDestinyType: 'input' | 'output' | 'callback'; connectorDestinyName: string }[]
		}
	} = {}
	connectionsInputs: { [key: string]: Set<string> } = {}
	connectionsOutputs: { [key: string]: Set<string> } = {}

	dependencies: IWorkerDependencies = {
		secrets: new Set(),
		credentials: new Set()
	}

	constructor({ el }: { el: Worker }) {
		this.el = el
	}

	/**
	 * Adds a new node to the system.
	 *
	 * @param {Object} params - The parameters for adding a node.
	 * @param {string} [params.id] - The unique identifier for the node. If not provided, a new UUID will be generated.
	 * @param {string} params.name - The name of the node.
	 * @param {string} params.className - The class name of the node.
	 * @param {Object} params.pos - The position of the node.
	 * @param {number} params.pos.x - The x-coordinate of the node's position.
	 * @param {number} params.pos.y - The y-coordinate of the node's position.
	 * @param {IPropertiesType} [params.properties={}] - The properties of the node.
	 * @param {Object} [params.meta] - Additional metadata for the node.
	 * @returns {INode} The newly added node.
	 * @throws {Error} If the class name does not exist in nodesClass.
	 */
	addNode({
		id,
		info,
		type,
		design,
		properties = {},
		meta
	}: {
		id?: string
		info: INodeCanvas['info']
		type: string
		design: INodeCanvas['design']
		properties?: INodeCanvas['properties']
		meta?: INodeCanvas['meta']
	}): INodeCanvas | null {
		if (!this.el) return null
		if (!this.nodesClass[type]) {
			console.error(`No existe el nodo ${type}`)
		}
		id = id || uuidv4()

		const prop: { [key: string]: any } = {}
		if (this.nodesClass[type]?.properties) {
			for (const [key, value] of Object.entries(this.nodesClass[type].properties) as [string, any][]) {
				prop[key] = JSON.parse(JSON.stringify(value))
				if (value.onTransform) prop[key].onTransform = value.onTransform
				if (value.type === 'list') {
					prop[key].object = value.object
				}
				if (properties[key]?.value) {
					prop[key].value = properties[key].value
				}
			}
		}

		// Determinando si la propiedad secret o credencial
		for (const [key, value] of Object.entries(prop)) {
			if (!value.value || value?.value.toString().trim() === '') continue

			// Secrets
			if (value.type === 'secret') {
				this.dependencies.secrets.add({
					idNode: id,
					name: value.value,
					type,
					secret: value.value
				})
			}
			// Credentials
			if (value.type === 'credential') {
				this.dependencies.credentials.add({
					idNode: id,
					type,
					name: value.value,
					credentials: meta?.credentials || []
				})
			}
		}

		this.nodes[id] = {
			id,
			info,
			properties: prop,
			meta,
			design,
			type,
			class: this.nodesClass[type]?.class,
			connections: []
		}

		if (!this.nodesType.has(type)) {
			this.nodesType.set(type, new Set())
		}
		this.nodesType.get(type)?.add(id)
		if (this.nodes[id].type === 'workflow_init') this.nodesInit = this.nodes[id]
		// Iniciar propiedades virtuales para manipulación de datos
		if (this.el.isDev) {
			this.el.virtualModule.virtualNodeAdd({ node: this.nodes[id] })
		}

		return this.nodes[id]
	}

	/**
	 * Adds an edge to the connections object, linking an origin node's output to a destination node's input.
	 *
	 * @param {Object} params - The parameters for adding an edge.
	 * @param {string} params.id_node_origin - The ID of the origin node.
	 * @param {string} params.output - The output of the origin node.
	 * @param {string} params.id_node_destiny - The ID of the destination node.
	 * @param {string} params.input - The input of the destination node.
	 */
	addEdge({ id, idNodeOrigin, idNodeDestiny, connectorType, connectorName, connectorDestinyType, connectorDestinyName }: INodeConnections) {
		if (!this.el) return
		if (!this.connections[idNodeOrigin!]) this.connections[idNodeOrigin!] = {}
		if (!this.connections[idNodeOrigin!][`${connectorType}:${connectorName}`])
			this.connections[idNodeOrigin!][`${connectorType}:${connectorName}`] = []
		this.connections[idNodeOrigin!][`${connectorType}:${connectorName}`].push({
			idNodeDestiny: idNodeDestiny,
			connectorDestinyType,
			connectorDestinyName
		})

		// Guardar los nodos que se conectan a un nodo
		if (!this.connectionsInputs[idNodeDestiny]) this.connectionsInputs[idNodeDestiny] = new Set()
		if (!this.connectionsOutputs[idNodeOrigin!]) this.connectionsOutputs[idNodeOrigin!] = new Set()
		this.connectionsInputs[idNodeDestiny].add(idNodeOrigin!)
		this.connectionsOutputs[idNodeOrigin!].add(idNodeDestiny)
		// Iniciar propiedades virtuales para manipulación de datos
		if (this.el.isDev) {
			this.el.virtualModule.virtualConnectionAdd({
				id,
				idNodeOrigin,
				idNodeDestiny,
				connectorType,
				connectorName,
				connectorDestinyType,
				connectorDestinyName
			})
		}
	}
}
