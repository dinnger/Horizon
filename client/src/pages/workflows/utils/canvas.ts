import { mime } from './../../../../../shared/plugins/nodes/http_response/mimeTypes'
import type { ICommunicationTypes } from '@shared/interface/connect.interface.js'
import type { INodeCanvas, INodeConnections } from '@shared/interface/node.interface.js'
import { utilsValidateName } from '../../../shared/utils'
import {
	drawNodeConnectionPreview,
	renderSelected,
	getTempConnection,
	subscriberHelper
	// renderAnimation
} from './canvas_helpers'
import { pattern_dark, pattern_light } from './canvas_pattern'
import { v4 as uuidv4 } from 'uuid'
import { Nodes } from './canvasNode'

export interface ILog {
	logs?: object
}

export class Canvas {
	canvas: HTMLCanvasElement
	context: CanvasRenderingContext2D
	ctx: CanvasRenderingContext2D
	canvasTranslateX: number
	canvasTranslateY: number
	canvasTempPosX: number
	canvasTempPosY: number
	canvasWidth: number
	canvasHeight: number
	canvasFactor: number
	canvasPattern: CanvasPattern | undefined
	canvasRelativePos: INodeCanvas['design']
	canvasPosition: INodeCanvas['design']
	canvasGrid: number
	canvasSelect: {
		x1: number
		y1: number
		x2: number
		y2: number
		show: boolean
	}
	// setInterval
	backgroundUpdateInterval: ReturnType<typeof setInterval> | null
	canvasFps: number
	indexTime: number
	theme: string

	nodes: Nodes

	selectedNode: Map<
		string,
		{
			node: INodeCanvas
			relative_pos: INodeCanvas['design']
			isMove: boolean
		}
	>
	newConnectionNode: {
		node: INodeCanvas
		type: 'input' | 'output' | 'callback'
		index: number
		value: any
		relative?: { x: number; y: number }
	} | null

	isNodeConnectionVisible: boolean

	// Events
	// Muestra la ventana de nuevo nodo
	events_new_node_start:
		| null
		| (({
				node,
				output_index,
				design,
				relative_pos
		  }: {
				node?: INodeCanvas
				output_index?: number
				design?: INodeCanvas['design']
				relative_pos?: INodeCanvas['design']
		  }) => void)
	// Muestra la ventana de propiedades
	events_show_properties: null | ((data: any) => void)
	// Context Menu
	events_context_menu: null | (({ show }: { show: boolean }) => void)
	// Muestra la ventana de propiedades de conexiones
	events_show_connection_context:
		| null
		| ((
				data: {
					id: string
					nodeOrigin: INodeCanvas
					nodeDestiny: INodeCanvas
					input: string
					output: string
				} | null
		  ) => void)

	constructor({
		canvas,
		theme
	}: {
		canvas: HTMLCanvasElement
		theme: string
	}) {
		this.canvas = canvas
		this.context = canvas.getContext('2d') as CanvasRenderingContext2D
		this.ctx = this.context
		this.canvasTranslateX = 0
		this.canvasTranslateY = 0
		this.canvasTempPosX = 0
		this.canvasTempPosY = 0
		this.canvasWidth = 0
		this.canvasHeight = 0
		this.canvasFactor = 1
		this.backgroundUpdateInterval = null
		this.canvasFps = 1000 / 40
		this.canvasPosition = { x: 0, y: 0 }
		this.canvasRelativePos = { x: 0, y: 0 }
		this.canvasSelect = { x1: 0, y1: 0, x2: 0, y2: 0, show: false }
		this.canvasGrid = 40
		this.indexTime = 0 // valor de 0 a 100 que se incrementa en cada frame

		this.nodes = new Nodes()

		this.theme = theme
		this.selectedNode = new Map()
		this.newConnectionNode = null
		this.isNodeConnectionVisible = false

		this.events_new_node_start = null
		this.events_show_properties = null
		this.events_context_menu = null
		this.events_show_connection_context = null
	}

	init({ nodes, connections }: { nodes?: { [key: string]: INodeCanvas }; connections?: INodeConnections[] }) {
		this.addImageProcess(this.theme === 'dark' ? pattern_dark : pattern_light).then((img) => {
			this.canvasPattern = this.ctx.createPattern(img, 'repeat') as CanvasPattern
			if (nodes && connections) this.load({ nodes, connections })
			this.background()
			if (this.backgroundUpdateInterval) {
				clearInterval(this.backgroundUpdateInterval)
			}
			this.backgroundUpdateInterval = setInterval(() => {
				this.indexTime++
				if (this.indexTime > 100) this.indexTime = 0
				this.background()
			}, this.canvasFps)
		})
	}

	load({ nodes, connections }: { nodes: { [key: string]: INodeCanvas }; connections: INodeConnections[] }) {
		console.log('load', connections)
		for (const [key, node] of Object.entries(nodes)) {
			this.nodes.addNode({ ...node, id: key })
		}
		for (const connection of connections) {
			this.nodes.addConnection(connection)
		}
	}

	change_theme(theme: string) {
		this.theme = theme
		this.init({})
	}

	addImageProcess(src: string): Promise<HTMLImageElement> {
		return new Promise((resolve, reject) => {
			const img = new Image()
			img.onload = () => resolve(img)
			img.onerror = reject
			img.src = src
		})
	}

	background() {
		if (!this.canvas || !this.ctx || !this.canvasPattern) return
		const x = this.canvasTranslateX
		const y = this.canvasTranslateY
		// Relativas
		const x_ = -x / this.canvasFactor
		const y_ = -y / this.canvasFactor
		const w_ = this.canvasWidth / this.canvasFactor
		const h_ = this.canvasHeight / this.canvasFactor

		this.ctx.clearRect(x_, y_, w_, h_)
		this.ctx.save()
		this.ctx.translate(x, y)
		this.ctx.scale(this.canvasFactor, this.canvasFactor)
		this.ctx.clearRect(x_, y_, w_, h_)
		this.ctx.fillStyle = this.canvasPattern
		this.ctx.fillRect(x_, y_, w_, h_)
		this.ctx.globalAlpha = 1.0
		this.ctx.imageSmoothingEnabled = this.ctx.imageSmoothingEnabled = true //= ctx.mozImageSmoothingEnabled

		this.nodes.render({ ctx: this.ctx })

		// Render selected
		if (this.canvasSelect.show) {
			this.nodes.selectedMultiple({ range: this.canvasSelect, relative: this.canvasRelativePos })
			renderSelected({
				canvasSelect: this.canvasSelect,
				theme: this.theme,
				ctx: this.ctx
			})
		}

		if (this.newConnectionNode) {
			drawNodeConnectionPreview({
				node_connection_new: this.newConnectionNode.node,
				type: this.newConnectionNode.type,
				index: this.newConnectionNode.index,
				canvasRelativePos: this.newConnectionNode.relative || this.canvasRelativePos,
				nodes: this.nodes.getNodes(),
				ctx: this.ctx
			})
		}

		// Animation
		// renderAnimation(this.nodes, this.ctx)

		this.ctx.restore()
	}

	fn_get_nodes_array() {
		return Object.values(this.nodes)
	}

	fn_selected() {
		if (!this.canvasSelect.show) {
			this.canvasSelect.x1 = this.canvasRelativePos.x
			this.canvasSelect.y1 = this.canvasRelativePos.y
		}
		this.canvasSelect.x2 = this.canvasRelativePos.x
		this.canvasSelect.y2 = this.canvasRelativePos.y
		this.canvasSelect.show = true
	}

	// ============================================================================
	// Events
	// ============================================================================
	event_mouse_init({ x, y, button }: INodeCanvas['design'] & { button: number }) {
		this.canvasTempPosX = x - this.canvasTranslateX
		this.canvasTempPosY = y - this.canvasTranslateY
		this.newConnectionNode = this.nodes.selected({ relative: this.canvasRelativePos })

		if (button === 0) {
			// this.fn_node_connect_focus({
			// 	x: this.canvasRelativePos.x,
			// 	y: this.canvasRelativePos.y
			// })
			// this.fn_node_connect_property_focus({ openMenu: false })
			if (this.events_show_properties) this.events_show_properties(null)
		}
		if (button === 2) {
			if (this.events_show_connection_context) {
				this.events_show_connection_context(null)
			}
			// this.fn_node_connect_property_focus({ openMenu: true })
		}

		if (this.events_context_menu) {
			this.events_context_menu({ show: false })
		}
	}

	event_mouse_end({ all }: { all?: boolean } = {}) {
		this.canvasSelect.show = false

		if (this.newConnectionNode && !getTempConnection()) {
			if (!this.isNodeConnectionVisible) {
				if (this.events_new_node_start) {
					console.log(12)
					// this.newConnectionNode.temp_pos = { ...this.canvasRelativePos }
					this.events_new_node_start({
						design: this.canvasPosition,
						relative_pos: { ...this.canvasRelativePos },
						output_index: this.newConnectionNode.index,
						node: this.newConnectionNode.node
					})
				}
			} else {
				this.selectedNode.clear()
				this.newConnectionNode = null
				if (this.events_new_node_start) {
					this.events_new_node_start({})
				}
			}
			this.isNodeConnectionVisible = true
		}

		if (this.newConnectionNode) {
			this.newConnectionNode.relative = this.canvasRelativePos
		}

		const tempConnection = getTempConnection()
		// if (tempConnection) {
		// 	this.nodes[tempConnection.nodeOrigin.id].addConnection({ ...tempConnection, isManual: true })
		// 	this.selectedNode.clear()
		// 	setTempConnection(null)
		// 	this.newConnectionNode = null
		// 	this.isNodeConnectionVisible = false
		// }
		// Enviar cambios de posición

		if (all) {
			this.nodes.clear()
			this.selectedNode.clear()
			this.newConnectionNode = null
			this.isNodeConnectionVisible = false
		}
		if (this.selectedNode.size === 0) {
			if (this.events_show_properties) {
				this.events_show_properties(null)
			}
			if (this.events_context_menu) {
				this.events_context_menu({ show: false })
			}
		}
		if (this.events_show_connection_context) {
			this.events_show_connection_context(null)
		}
	}

	event_mouse_cursor() {
		// Selected
		const selectedNodes = this.nodes.getSelected()
		if (selectedNodes.length === 0 || this.canvasSelect.show) {
			return this.fn_selected()
		}
		// Move Node
		if (selectedNodes.length > 0 && !this.newConnectionNode) {
			this.nodes.move({ relative: this.canvasRelativePos })
		}
	}

	event_mouse_move({ x, y }: INodeCanvas['design']) {
		this.canvasTranslateX = x - this.canvasTempPosX
		this.canvasTranslateY = y - this.canvasTempPosY
	}

	event_mouse_relative({ x, y }: INodeCanvas['design']) {
		this.canvasPosition = { x, y }
		this.canvasRelativePos = {
			x: Number.parseFloat(((x - this.canvasTranslateX) / this.canvasFactor).toFixed(2)),
			y: Number.parseFloat(((y - this.canvasTranslateY) / this.canvasFactor).toFixed(2))
		}
	}

	event_mouse_double_click() {
		const selected = this.nodes.getSelected()
		if (this.events_show_properties && selected.length > 0) {
			this.events_show_properties({ selected })
		}
	}

	event_context_menu() {
		if (this.events_context_menu) {
			const selected = this.nodes.getSelected()
			this.events_context_menu({ show: selected.length > 0 })
		}
	}

	event_resize() {
		const parent = this.canvas.parentElement
		if (parent) {
			this.canvasWidth = parent.clientWidth
			this.canvasHeight = parent.clientHeight
			this.canvas.width = this.canvasWidth
			this.canvas.height = this.canvasHeight
			// this.canvasFactor = this.canvasWidth / this.canvasHeight
		}
	}

	event_zoom({ zoom, value }: { zoom?: number; value?: number }) {
		this.canvasFactor = zoom || this.canvasFactor + (value || 0)
		if (this.canvasFactor < 0.5) this.canvasFactor = 0.5
		if (this.canvasFactor > 2) this.canvasFactor = 2
	}

	event_scroll_zoom({ deltaY }: { deltaY: number }) {
		const tempFactor = this.canvasFactor
		this.event_zoom({ value: deltaY > 0 ? 0.1 : -0.1 })
		this.canvasTranslateX -= this.canvasRelativePos.x * (this.canvasFactor - tempFactor)
		this.canvasTranslateY -= this.canvasRelativePos.y * (this.canvasFactor - tempFactor)
	}

	event_node_position(fn: (data: { id: string; x: number; y: number }) => void) {
		for (const node of Object.values(this.nodes)) {
			fn({ id: node.id, x: node.design.x, y: node.design.y })
		}
	}

	event_subscriber(
		type: ICommunicationTypes | ICommunicationTypes[],
		fn: ({ event, data }: { event: ICommunicationTypes; data: any }) => void
	) {
		if (Array.isArray(type)) {
			for (const t of type) {
				subscriberHelper().subscriber(t, fn)
			}
		} else {
			subscriberHelper().subscriber(type, fn)
		}
	}

	actionAddNode({
		origin,
		node,
		isManual
	}: {
		origin?: { idNode: string; connectorType: 'input' | 'output' | 'callback'; connectorName: string }
		node: INodeCanvas
		isManual?: boolean
	}) {
		const id = uuidv4()
		console.log('actionAddNode', { origin, node })
		const data: INodeCanvas = {
			...node,
			id: node.id || id,
			design: {
				x: Math.round((node.design.x || 0) / this.canvasGrid) * this.canvasGrid,
				y: Math.round((node.design.y || 0) / this.canvasGrid) * this.canvasGrid
			}
		}
		console.log('infoName', data.info.name)
		data.info.name = utilsValidateName({
			text: node.info.name,
			nodes: Object.values(this.nodes.getNodes())
		})
		const nodeDestiny = this.nodes.addNode(data, isManual)

		if (origin) {
			console.log('origin', origin)
			this.nodes.getNode({ id: origin.idNode }).addConnection({
				connectorType: origin.connectorType,
				connectorName: origin.connectorName,
				nodeDestiny: nodeDestiny,
				connectorDestinyType: 'output',
				connectorDestinyName: nodeDestiny.info.connectors.inputs[0],
				isManual: true
			})
		}

		return id
	}

	/**
	 * Adds a connection between two nodes in the workflow.
	 *
	 * @param {Object} params - The parameters for adding a connection.
	 * @param {string} params.id_node_origin - The ID of the origin node.
	 * @param {string} params.id_node_destiny - The ID of the destination node.
	 * @param {string} params.input - The input identifier for the connection.
	 * @param {string} params.output - The output identifier for the connection.
	 *
	 * @returns {void}
	 */

	/**
	 * Nodes
	 */
	actionNode(action: ICommunicationTypes, node: INodeCanvas | INodeCanvas[]) {
		if (!Array.isArray(node)) {
			// subscriberHelper().send(action, {
			// 	node: {
			// 		id: node.id
			// 	}
			// })
		}
		if (action === 'removeNode' && !Array.isArray(node)) {
			// this.selectedNode.delete(node.id)
			// const listConnection = this.connectionNodes.filter((value) => value.id_node_origin === node.id || value.id_node_destiny === node.id)
			// for (const connection of listConnection) {
			// 	this.actionDeleteConnectionById({ id: connection.id })
			// }
			this.nodes.removeNode(String(node.id))
			if (this.events_context_menu) {
				this.events_context_menu({ show: false })
			}
		}
		if (action === 'duplicateNode') {
			const ids: string[] = []
			const tempIds = []
			const tempConnections = []
			const nodes = Array.isArray(node) ? node : [node]
			for (const node of nodes) {
				const name = node.info.name.split('_').length > 1 ? node.info.name.split('_').slice(0, -1).join('_') : node.info.name
				const newNode = {
					...node,
					properties: JSON.parse(JSON.stringify(node.properties)),
					connections: []
				}
				newNode.info.name = name
				const id = this.actionAddNode({
					node: newNode,
					isManual: true
				})
				tempConnections.push(...JSON.parse(JSON.stringify(node.connections)))
				tempIds.push({ beforeId: node.id, afterId: id })
				ids.push(id)
			}

			for (const temp of tempConnections) {
				temp.id_node_origin = tempIds.find((f) => f.beforeId === temp.id_node_origin)?.afterId || temp.id_node_origin
				temp.id_node_destiny = tempIds.find((f) => f.beforeId === temp.id_node_destiny)?.afterId || temp.id_node_destiny
			}
			// for (const connection of tempConnections.filter((f) => ids.includes(f.id_node_origin) && ids.includes(f.id_node_destiny))) {
			// 	this.addConnection({
			// 		id_node_origin: connection.id_node_origin,
			// 		id_node_destiny: connection.id_node_destiny,
			// 		input: connection.input,
			// 		output: connection.output,
			// 		isManual: true
			// 	})
			// }
			this.selectedNode.clear()
			// this.actionSelectNodeById({ ids })
		}

		if (this.events_context_menu) this.events_context_menu({ show: false })
	}

	/**
	 * Deletes a connection node by its ID.
	 *
	 * @param {Object} param - The parameter object.
	 * @param {string} param.id - The ID of the connection node to delete.
	 *
	 * @returns {void}
	 */
	// actionDeleteConnectionById({ id }: { id: string }) {
	// 	this.connectionNodes = this.connectionNodes.filter((value) => value.id !== id)
	// 	subscriberHelper().send('removeConnection', {
	// 		id
	// 	})
	// 	if (this.events_show_connection_context) {
	// 		this.events_show_connection_context(null)
	// 	}
	// }

	// actionSelectNodeById({ ids }: { ids: string[] }) {
	// 	for (const id of ids) {
	// 		const node = this.nodes[id]

	// 		this.selectedNode.set(node.id, {
	// 			node: node,
	// 			relative_pos: {
	// 				x: this.canvasRelativePos.x - node.x,
	// 				y: this.canvasRelativePos.y - node.y
	// 			},
	// 			isMove: false
	// 		})
	// 	}
	// }

	actionTrace(data: {
		[id: string]: {
			inputs: { data: { [key: string]: number }; length: number }
			outputs: { data: { [key: string]: number }; length: number }
		}
	}) {
		// for (const [id, item] of Object.entries(data)) {
		// 	const node = this.nodes[id]
		// 	if (!node) continue
		// 	const data: { [key: string]: { value: number; changes: number } } = {}
		// for (const [key, value] of Object.entries(item.outputs.data)) {
		// 	data[key] = {
		// 		value,
		// 		changes: value - (node.info?.outputs.data[key]?.value || value - 1)
		// 	}
		// }
		// node.info = {
		// 	inputs: item.inputs,
		// 	outputs: {
		// 		data,
		// 		length: item.outputs.length
		// 	}
		// }
		// }
	}

	destroy() {
		subscriberHelper().clear()
		if (this.backgroundUpdateInterval) {
			clearInterval(this.backgroundUpdateInterval)
		}
	}
}
