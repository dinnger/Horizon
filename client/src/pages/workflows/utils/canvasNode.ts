import type { INode, INodeCanvasNew, INodeCanvasNewClass, INodeClass, INodeConnections } from '@shared/interface/node.interface'
import type { INodePropertiesType } from '@shared/interface/node.properties.interface'
import { utilsStandardName } from '../../../shared/utils'
import { v4 as uuidv4 } from 'uuid'
import { render_node, renderConnectionNodes, subscriberHelper } from './canvas_helpers'

const canvasGrid = 20

export class Nodes {
	private nodes: { [key: string]: INodeCanvasNewClass } = {}

	addNode(node: INodeCanvasNew, isManual?: boolean) {
		if (isManual) {
			subscriberHelper().send('addNode', { node, isManual })
		}
		console.log({ node })
		this.nodes[node.id] = new NewNode(node)
	}
	addConnection(connection: INodeConnections) {
		this.nodes[connection.nodeOrigin.id].actionAddConnection(connection)
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
			this.nodes[node.id].move({ relative })
		}
	}
	clear() {
		for (const node of Object.values(this.nodes)) {
			node.setSelected({ relative: { x: 0, y: 0 } })
		}
	}
}

class NewNode implements INodeCanvasNewClass {
	id: string
	name: string
	type: string
	icon: string
	color: string
	properties: INodePropertiesType
	meta?: INode['meta'] | undefined
	design: INodeCanvasNew['design']
	connectors: INode['connectors']
	connections: INodeConnections[]
	relativePos = { x: 0, y: 0 }
	isSelected = false
	isMove = false

	constructor(value: INodeCanvasNew) {
		this.id = value.id
		this.name = utilsStandardName(value.name)
		this.type = value.type
		this.icon = value.icon
		this.color = value.color
		this.properties = value.properties
		this.meta = value.meta
		this.design = value.design
		this.connectors = value.connectors
		this.connections = value.connections || []
		this.design.x = value.design.x || 0
		this.design.y = value.design.y || 0
		this.design.width = value.design.width || 90
		this.design.height = this.calculateNodeHeight() || 90
	}

	calculateNodeHeight() {
		const widthByInputs = Math.max(35 + (this.connectors?.inputs?.length || 0) * 20, 85)
		const widthByOutputs = Math.max(35 + (this.connectors?.outputs?.length || 0) * 20, 85)
		return Math.max(widthByInputs, widthByOutputs)
	}

	actionAddConnection(element: INodeConnections) {
		let { id, nodeOrigin, nodeDestiny, isManual } = element
		id = id || uuidv4()
		const connection = {
			...element,
			id,
			pos_property: {}
		}
		this.connections.push(connection)
		if (nodeOrigin.id === this.id) nodeDestiny.actionAddConnection(element)
		if (isManual) {
			subscriberHelper().send('addConnection', element)
		}
	}

	setSelected({ pos, relative }: { pos?: { x: number; y: number; x2?: number; y2?: number }; relative: { x: number; y: number } }) {
		this.isSelected = false
		this.isMove = false
		this.relativePos = { x: 0, y: 0 }
		if (!pos) return null

		const marginX = 2
		if (
			(!pos.x2 &&
				pos.x >= this.design.x + marginX &&
				pos.x <= this.design.x + this.design.width - marginX &&
				pos.y >= this.design.y &&
				pos.y <= this.design.y + this.design.height) ||
			(pos.x2 &&
				pos.y2 &&
				pos.x <= this.design.x &&
				pos.y <= this.design.y &&
				pos.x2 >= this.design.x + this.design.width &&
				pos.y2 >= this.design.y + this.design.height)
		) {
			this.relativePos = {
				x: relative.x - this.design.x,
				y: relative.y - this.design.y
			}
			this.isSelected = true
			this.isMove = true
			return null
		}
		return this.getSelectedConnectors({ x: pos.x, y: pos.y })
	}

	getSelectedConnectors({ x, y }: { x: number; y: number }): {
		node: INodeCanvasNewClass
		type: 'output' | 'input' | 'callback'
		index: number
		value: any
	} | null {
		const marginX = 8

		for (const output of Object.keys(this.connectors.outputs)) {
			if (
				x <= this.design.x + this.design.width + marginX &&
				x >= this.design.x + this.design.width &&
				y >= this.design.y + 25 + Number.parseInt(output) * 20 - 5 &&
				y <= this.design.y + 25 + Number.parseInt(output) * 20 + 15
			) {
				this.isMove = false
				this.isSelected = true
				return { node: this, type: 'output', index: Number(output), value: this.connectors.outputs[Number(output)] }
			}
		}

		return null
	}

	getSelected() {
		return this.isSelected
	}

	move({ relative }: { relative: { x: number; y: number } }) {
		if (!this.isMove) return
		let x = relative.x - this.relativePos.x
		let y = relative.y - this.relativePos.y
		// x and y only divisible by 20
		x = Math.round(x / canvasGrid) * canvasGrid
		y = Math.round(y / canvasGrid) * canvasGrid
		if (x === this.design.x && y === this.design.y) return
		this.design.x = x
		this.design.y = y
		this.isMove = true
	}

	render({ ctx }: { ctx: CanvasRenderingContext2D }) {
		render_node({
			ctx,
			theme: 'dark',
			node: this,
			selected: this.isSelected
		})
	}

	renderConnections({ ctx, nodes }: { ctx: CanvasRenderingContext2D; nodes: { [key: string]: INodeCanvasNew } }) {
		for (const connection of this.connections) {
			renderConnectionNodes({
				ctx,
				nodeOrigin: connection.nodeOrigin,
				nodeDestiny: connection.nodeDestiny,
				idConnectorOrigin: connection.idConnectorOrigin,
				idConnectorDestiny: connection.idConnectorDestiny,
				indexTime: 0,
				connection,
				nodes
			})
		}
	}
}
