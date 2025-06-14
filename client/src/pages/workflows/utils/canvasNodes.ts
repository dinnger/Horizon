import type { INodeCanvas, INodeConnections } from '@shared/interface/node.interface'
import { v4 as uuidv4 } from 'uuid'
import { subscriberHelper } from './canvas_helpers'
import { NewNode } from './canvasNode'
import { ref } from 'vue'

// (moved and fixed below after NewNode class)

export class Nodes {
	public canvasGrid = 20
	canvasTranslate: { x: number; y: number }
	nodes: { [key: string]: NewNode } = {}

	constructor({ canvasTranslate }: { canvasTranslate: { x: number; y: number } }) {
		this.canvasTranslate = canvasTranslate
	}
	getNode(data: { id: string }) {
		const node = this.nodes[data.id]
		if (!node) throw new Error('No se encontró el nodo')
		return this.nodes[data.id]
	}

	addNode(node: INodeCanvas, isManual?: boolean) {
		node.id = node.id || uuidv4()
		this.nodes[node.id] = new NewNode(node, this)
		const newNode = this.nodes[node.id]
		if (isManual) {
			subscriberHelper().send('virtualAddNode', {
				node: newNode.get(),
				isManual
			})
		}
		return this.nodes[node.id]
	}

	duplicateNode({ id }: { id: string }) {
		const node = this.nodes[id]
		if (!node) return
		return this.addNode(
			{
				id: undefined,
				type: node.type,
				info: { ...node.info },
				properties: ref(JSON.parse(JSON.stringify(node.properties))).value,
				design: ref({
					x: node.design.x + this.canvasGrid * 2,
					y: node.design.y + this.canvasGrid * 5
				}).value
			},
			true
		)
	}
	duplicateMultiple() {
		const selectedNodes = this.getSelected()
		const originalToNewIdMap = new Map<string, string>()
		const duplicatedNodes: NewNode[] = []

		// Primero duplicar todos los nodos seleccionados y crear el mapeo de IDs
		for (const node of selectedNodes) {
			const newNode = node.duplicate()
			if (newNode && node.id) {
				originalToNewIdMap.set(node.id, newNode.id!)
				duplicatedNodes.push(newNode)
				newNode.isSelected = true
				newNode.isMove = true
			}
		}

		// Luego crear las conexiones entre los nodos duplicados
		for (const originalNode of selectedNodes) {
			if (!originalNode.id) continue

			// Buscar todas las conexiones donde este nodo es el origen
			for (const connection of originalNode.connections) {
				// Solo crear conexiones si tanto el nodo origen como el destino fueron duplicados
				if (connection.idNodeOrigin === originalNode.id && connection.idNodeDestiny && originalToNewIdMap.has(connection.idNodeDestiny)) {
					const newOriginId = originalToNewIdMap.get(originalNode.id)
					const newDestinyId = originalToNewIdMap.get(connection.idNodeDestiny)

					if (newOriginId && newDestinyId) {
						// Crear la nueva conexión entre los nodos duplicados
						this.addConnection({
							id: uuidv4(),
							connectorType: connection.connectorType,
							connectorName: connection.connectorName,
							idNodeOrigin: newOriginId,
							idNodeDestiny: newDestinyId,
							connectorDestinyType: connection.connectorDestinyType,
							connectorDestinyName: connection.connectorDestinyName,
							isManual: true
						})
					}
				}
			}
		}
	}

	addConnection(connection: INodeConnections & { isManual?: boolean }) {
		const id = connection.idNodeOrigin || ''
		if (!this.nodes[id]) return console.error('No se encontró el nodo', id)
		if (!this.nodes[connection.idNodeDestiny]) return console.error('No se encontró el nodo destino', connection.idNodeDestiny)
		this.nodes[id].addConnection(connection)
	}

	removeNode(id: string) {
		delete this.nodes[id]
	}

	selected({ relative }: { relative: { x: number; y: number } }) {
		const x = relative.x
		const y = relative.y
		const selected = this.getSelected()
		let newConnection = null
		// Si se pulsa botón derecho
		let verifyMulti = false
		for (const node of selected) {
			if (selected.length > 0 && node.verifySelected({ pos: { x, y } }) && selected.includes(node)) {
				console.log('selected')
				verifyMulti = true
			}
		}
		if (verifyMulti) {
			for (const node of selected) {
				node.setRelativePos(relative)
			}
			return
		}

		for (const node of selected) {
			node.isSelected = false
		}

		for (const node of Object.values(this.nodes).reverse()) {
			const select = node.setSelected({ pos: { x, y }, relative })
			if (select && select.type === 'connector') {
				newConnection = select.value
			}
			if (select) break
		}
		return newConnection
	}

	selectedMultiple({ range, relative }: { range: { x1: number; y1: number; x2: number; y2: number }; relative: { x: number; y: number } }) {
		const xMin = Math.min(range.x1, range.x2)
		const xMax = Math.max(range.x1, range.x2)
		const yMin = Math.min(range.y1, range.y2)
		const yMax = Math.max(range.y1, range.y2)
		for (const node of Object.values(this.nodes)) {
			node.setSelected({ pos: { x: xMin, y: yMin, x2: xMax, y2: yMax }, relative })
		}
	}

	getSelected() {
		return Object.values(this.nodes).filter((f) => f.getSelected())
	}

	getNodes() {
		return this.nodes
	}

	move({ relative }: { relative: { x: number; y: number } }) {
		for (const node of this.getSelected()) {
			this.nodes[node.id || -1].move({ relative })
		}
	}

	clear() {
		for (const node of Object.values(this.nodes)) {
			node.setSelected({ relative: { x: 0, y: 0 } })
		}
	}

	render({ ctx }: { ctx: CanvasRenderingContext2D }) {
		for (const node of Object.values(this.nodes)) {
			// const selected = this.selectedNode.has(node.id)
			node.renderConnections({ ctx, nodes: this.nodes })
			node.render({ ctx })
		}
	}

	getInputAtPosition({ x, y }: { x: number; y: number }): {
		node: NewNode
		type: 'input'
		index: number
		connectorName: string
	} | null {
		// Buscar en todos los nodos si hay un input en la posición dada
		for (const node of Object.values(this.nodes)) {
			const connector = node.getSelectedConnectors({ x, y })
			if (connector && connector.type === 'input') {
				return {
					node,
					type: 'input',
					index: connector.index,
					connectorName: connector.value
				}
			}
		}
		return null
	}

	/**
	 * Encuentra una conexión en la posición específica del mouse
	 */
	getConnectionAtPosition({ x, y }: { x: number; y: number }): {
		connection: INodeConnections
		nodeOrigin: NewNode
		nodeDestiny: NewNode
	} | null {
		const tolerance = 10 // Tolerancia en píxeles para detectar la conexión

		for (const node of Object.values(this.nodes)) {
			for (const connection of node.connections) {
				if (connection.idNodeOrigin !== node.id) continue

				const nodeDestiny = this.nodes[connection.idNodeDestiny]
				if (!nodeDestiny) continue

				// Si la conexión tiene pointers (puntos calculados), verificar proximidad
				if (connection.pointers && connection.pointers.length > 1) {
					if (this.isPointNearPath(x, y, connection.pointers, tolerance)) {
						return {
							connection,
							nodeOrigin: node,
							nodeDestiny
						}
					}
				} else {
					// Si no tiene pointers, calcular una línea directa
					const originPoint = this.getNodeOutputPosition(node, connection.connectorName)
					const destinyPoint = this.getNodeInputPosition(nodeDestiny, connection.connectorDestinyName)

					if (originPoint && destinyPoint) {
						if (this.isPointNearLine(x, y, originPoint, destinyPoint, tolerance)) {
							return {
								connection,
								nodeOrigin: node,
								nodeDestiny
							}
						}
					}
				}
			}
		}
		return null
	}

	/**
	 * Verifica si un punto está cerca de un path definido por una serie de puntos
	 */
	private isPointNearPath(x: number, y: number, points: { x: number; y: number }[], tolerance: number): boolean {
		for (let i = 0; i < points.length - 1; i++) {
			const p1 = points[i]
			const p2 = points[i + 1]
			if (this.isPointNearLine(x, y, p1, p2, tolerance)) {
				return true
			}
		}
		return false
	}
	/**
	 * Verifica si un punto está cerca de una línea entre dos puntos
	 */
	private isPointNearLine(x: number, y: number, p1: { x: number; y: number }, p2: { x: number; y: number }, tolerance: number): boolean {
		const A = x - p1.x
		const B = y - p1.y
		const C = p2.x - p1.x
		const D = p2.y - p1.y

		const dot = A * C + B * D
		const lenSq = C * C + D * D

		if (lenSq === 0) {
			// Los puntos son iguales
			return Math.sqrt(A * A + B * B) <= tolerance
		}

		const param = dot / lenSq

		let xx: number
		let yy: number

		if (param < 0) {
			xx = p1.x
			yy = p1.y
		} else if (param > 1) {
			xx = p2.x
			yy = p2.y
		} else {
			xx = p1.x + param * C
			yy = p1.y + param * D
		}

		const dx = x - xx
		const dy = y - yy
		return Math.sqrt(dx * dx + dy * dy) <= tolerance
	}
	/**
	 * Obtiene la posición del output de un nodo
	 */
	private getNodeOutputPosition(node: NewNode, outputName: string): { x: number; y: number } | null {
		const outputIndex = Object.keys(node.info.connectors.outputs).findIndex(
			(key) => node.info.connectors.outputs[Number.parseInt(key)] === outputName
		)
		if (outputIndex === -1) return null

		return {
			x: node.design.x + node.design.width!,
			y: node.design.y + 25 + outputIndex * 20 + 10
		}
	}

	/**
	 * Obtiene la posición del input de un nodo
	 */
	private getNodeInputPosition(node: NewNode, inputName: string): { x: number; y: number } | null {
		const inputIndex = Object.keys(node.info.connectors.inputs).findIndex(
			(key) => node.info.connectors.inputs[Number.parseInt(key)] === inputName
		)
		if (inputIndex === -1) return null

		return {
			x: node.design.x,
			y: node.design.y + 25 + inputIndex * 20 + 10
		}
	}
}

export type ICanvasNodeNew = NewNode
