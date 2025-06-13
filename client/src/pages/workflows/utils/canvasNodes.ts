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
		this.addNode(
			{
				id: undefined,
				type: node.type,
				info: { ...node.info },
				properties: ref(JSON.parse(JSON.stringify(node.properties))).value,
				design: ref({
					x: node.design.x + this.canvasGrid * 2,
					y: node.design.y + this.canvasGrid * 2
				}).value
			},
			true
		)
	}
	addConnection(connection: INodeConnections) {
		const id = connection.idNodeOrigin || ''
		if (!this.nodes[id]) return console.error('No se encontró el nodo', id)

		this.nodes[id].addConnection(connection)
	}
	removeNode(id: string) {
		delete this.nodes[id]
	}
	render({ ctx }: { ctx: CanvasRenderingContext2D }) {
		for (const node of Object.values(this.nodes)) {
			// const selected = this.selectedNode.has(node.id)
			node.renderConnections({ ctx, nodes: this.nodes })
			node.render({ ctx })
		}
	}
	selected({ relative }: { relative: { x: number; y: number } }) {
		const x = relative.x
		const y = relative.y
		let newConnection = null
		for (const node of Object.values(this.nodes)) {
			const connector = node.setSelected({ pos: { x, y }, relative })
			if (connector) newConnection = connector
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
}

export type ICanvasNodeNew = NewNode
