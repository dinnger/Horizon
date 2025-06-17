import type { ICommunicationTypes } from '@shared/interface/connect.interface.js'
import type { INodeCanvas, INodeConnections } from '@shared/interface/node.interface.js'
import { utilsValidateName } from '../../../shared/utils'
import {
	drawNodeConnectionPreview,
	renderSelected,
	getTempConnection,
	subscriberHelper,
	setIndexTime
	// renderAnimation
} from './canvas_helpers'
import { pattern_dark, pattern_light } from './canvas_pattern'
import { v4 as uuidv4 } from 'uuid'
import { Nodes, type ICanvasNodeNew } from './canvasNodes'

export interface ILog {
	logs?: object
}

type EventsCanvas =
	| 'context_menu'
	| 'node_selected'
	| 'node_deselected'
	| 'node_moved'
	| 'node_added'
	| 'node_removed'
	| 'node_properties_context'
	| 'node_property_changed'
	| 'node_connection_context'
	| 'node_connection_added'
	| 'node_connection_removed'

export class Canvas {
	canvas: HTMLCanvasElement
	context: CanvasRenderingContext2D
	ctx: CanvasRenderingContext2D
	canvasTranslate: { x: number; y: number } = { x: 0, y: 0 }
	canvasTempPosX = 0
	canvasTempPosY = 0
	canvasWidth = 0
	canvasHeight = 0
	canvasFactor = 1
	canvasPattern: CanvasPattern | undefined
	canvasRelativePos: INodeCanvas['design'] = { x: 0, y: 0 }
	canvasPosition: INodeCanvas['design'] = { x: 0, y: 0 }
	canvasGrid = 40
	canvasSelect: {
		x1: number
		y1: number
		x2: number
		y2: number
		show: boolean
	} = { x1: 0, y1: 0, x2: 0, y2: 0, show: false }

	// setInterval
	backgroundUpdateInterval: ReturnType<typeof setInterval> | null = null
	canvasFps: number = 1000 / 40
	indexTime = 0
	theme: string

	nodes: Nodes

	selectedNode: ICanvasNodeNew[] = []
	newConnectionNode: {
		node: INodeCanvas
		type: 'input' | 'output' | 'callback'
		index: number
		value: any
		relative?: { x: number; y: number }
	} | null = null

	isNodeConnectionVisible = false

	eventsCanvas = ['mousedown', 'mouseup', 'mousemove', 'wheel', 'dblclick', 'contextmenu']
	eventsType: 'cursor' | 'move' = 'cursor'

	isDragging = false

	subscribers = new Map<EventsCanvas | EventsCanvas[], (e: any) => any>()

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
		this.nodes = new Nodes({ canvasTranslate: this.canvasTranslate })
		this.theme = theme
	}

	init({ nodes, connections }: { nodes?: { [key: string]: INodeCanvas }; connections?: INodeConnections[] }) {
		this.event_resize()
		for (const event of this.eventsCanvas) {
			this.canvas.addEventListener(event as any, (e) => {
				e.preventDefault()
				this.events({ event: event as string, e })
			})
		}
		window.addEventListener('resize', () => this.event_resize())
		document.addEventListener('mouseup', this.eventMouseUp)

		this.addImageProcess(this.theme === 'dark' ? pattern_dark : pattern_light).then((img) => {
			this.canvasPattern = this.ctx.createPattern(img, 'repeat') as CanvasPattern
			if (nodes && connections) this.load({ nodes, connections })
			this.background()
			if (this.backgroundUpdateInterval) {
				clearInterval(this.backgroundUpdateInterval)
			}

			this.backgroundUpdateInterval = setInterval(() => {
				this.indexTime++
				setIndexTime(this.indexTime)
				if (this.indexTime > 100) this.indexTime = 0
				this.background()
			}, this.canvasFps)
		})
	}

	load({ nodes, connections }: { nodes: { [key: string]: INodeCanvas }; connections: INodeConnections[] }) {
		for (const [key, node] of Object.entries(nodes)) {
			this.nodes.addNode({ ...node, id: key })
		}
		for (const connection of connections) {
			this.nodes.addConnection(connection)
		}
	}

	events({ event, e }: { event: string; e: any }) {
		switch (event) {
			case 'mousedown':
				this.eventMouseDown(e)
				break
			case 'mouseup':
				this.eventMouseUp(e)
				break
			case 'mousemove':
				this.eventMouseMove(e)
				break
			case 'wheel':
				this.eventWheel(e)
				break
			case 'dblclick':
				this.eventDbClick(e)
				break
			case 'contextmenu':
				this.eventContextMenu(e)
				break
		}
	}

	eventMouseDown = (e: MouseEvent) => {
		this.event_mouse_init({
			x: e.clientX,
			y: e.clientY
		})
		this.isDragging = true
		// Si se pulsa botón central
		if (e.button === 1) {
			this.eventMouseUp(e)
			this.eventsType = 'move'
		}
	}

	eventMouseUp = (e: MouseEvent) => {
		this.isDragging = false
		if (e.button === 1) this.eventsType = 'cursor'
		if (e.button === 0) this.event_mouse_end()
	}

	eventMouseMove = (e: MouseEvent) => {
		this.event_mouse_relative({ x: e.offsetX, y: e.offsetY })
		if (this.eventsType === 'cursor' && e.buttons === 1 && this.isDragging) {
			// Selected

			if (this.selectedNode.length === 0 || this.canvasSelect.show) {
				return this.fn_selected()
			}
			// Move Node
			if (this.selectedNode.length > 0 && !this.newConnectionNode) {
				this.nodes.move({ relative: this.canvasRelativePos })
				this.emit('node_moved', { selected: this.selectedNode })
			}
		}
		if ((this.eventsType === 'move' && e.buttons === 1) || e.buttons === 4) {
			if (e.buttons === 4) this.eventsType = 'move'
			this.event_mouse_move({ x: e.clientX, y: e.clientY })
		}
	}

	eventDbClick = (_e: MouseEvent) => {
		const selected = this.nodes.getSelected()
		this.emit('node_selected', { selected })
	}

	eventWheel = (e: WheelEvent) => {
		this.event_scroll_zoom({ deltaY: e.deltaY })
	}

	eventContextMenu = (_e: MouseEvent) => {
		// Primero verificar si se hizo clic derecho sobre una conexión
		const connectionAtPosition = this.nodes.getConnectionAtPosition({
			x: this.canvasRelativePos.x,
			y: this.canvasRelativePos.y
		})

		if (connectionAtPosition) {
			// Mostrar menú contextual de conexión
			this.emit('node_connection_context', {
				id: connectionAtPosition.connection.id!,
				nodeOrigin: connectionAtPosition.nodeOrigin.get(),
				nodeDestiny: connectionAtPosition.nodeDestiny.get(),
				input: connectionAtPosition.connection.connectorDestinyName,
				output: connectionAtPosition.connection.connectorName
			})
			return
		}

		// Si no hay conexión, mostrar menú contextual de nodos
		const selected = this.nodes.getSelected()
		if (selected.length === 0) return
		this.emit('node_properties_context', { selected, canvasTranslate: this.nodes.canvasTranslate })
	}

	listener = (event: EventsCanvas | EventsCanvas[], callback: (e: any) => any) => {
		if (Array.isArray(event)) {
			for (const e of event) {
				this.listener(e, callback)
			}
			return
		}
		this.subscribers.set(event, callback)
	}

	emit = (event: EventsCanvas | EventsCanvas[], e: any) => {
		console.log({ event })
		if (Array.isArray(event)) {
			for (const e of event) {
				this.emit(e, e)
			}
			return
		}
		const callback = this.subscribers.get(event)
		if (callback) callback(e)
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
		const x = this.canvasTranslate.x
		const y = this.canvasTranslate.y
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
	event_mouse_init({ x, y }: INodeCanvas['design']) {
		this.canvasTempPosX = x - this.canvasTranslate.x
		this.canvasTempPosY = y - this.canvasTranslate.y
		this.newConnectionNode = this.nodes.selected({ relative: this.canvasRelativePos })
		this.selectedNode = this.nodes.getSelected()

		// if (button === 0) {
		// 	// this.fn_node_connect_focus({
		// 	// 	x: this.canvasRelativePos.x,
		// 	// 	y: this.canvasRelativePos.y
		// 	// })
		// 	// this.fn_node_connect_property_focus({ openMenu: false })
		// 	if (this.events_show_properties) this.events_show_properties(null)
		// }
		// if (button === 2) {
		// 	if (this.events_show_connection_context) {
		// 		this.events_show_connection_context(null)
		// 	}
		// 	// this.fn_node_connect_property_focus({ openMenu: true })
		// }

		// if (this.events_context_menu) {
		// 	this.events_context_menu(null)
		// }
	}
	event_mouse_end({ all }: { all?: boolean } = {}) {
		this.canvasSelect.show = false

		if (this.newConnectionNode && !getTempConnection()) {
			// Verificar si se terminó el arrastre sobre un input de otro nodo
			const targetInput = this.nodes.getInputAtPosition({
				x: this.canvasRelativePos.x,
				y: this.canvasRelativePos.y
			})

			if (targetInput && this.newConnectionNode.type === 'output' && targetInput.node.id !== this.newConnectionNode.node.id) {
				// Crear conexión directa entre output e input
				const originNode = this.nodes.getNode({ id: this.newConnectionNode.node.id! })
				originNode.addConnection({
					connectorType: 'output',
					connectorName: this.newConnectionNode.value,
					idNodeDestiny: targetInput.node.id!,
					connectorDestinyType: 'input',
					connectorDestinyName: targetInput.connectorName,
					isManual: true
				})

				// Limpiar el estado de conexión
				this.selectedNode = []
				this.newConnectionNode = null
				this.isNodeConnectionVisible = false
			} else {
				// Comportamiento original: mostrar menú de nuevos nodos
				if (!this.isNodeConnectionVisible) {
					this.emit('node_added', {
						design: this.canvasPosition,
						relative_pos: { ...this.canvasRelativePos },
						output_index: this.newConnectionNode.index,
						node: this.newConnectionNode.node
					})
				} else {
					this.selectedNode = []
					this.newConnectionNode = null
				}
				this.isNodeConnectionVisible = true
			}
		}
		if (this.newConnectionNode) {
			this.newConnectionNode.relative = this.canvasRelativePos
		}

		// if (tempConnection) {
		// 	this.nodes[tempConnection.nodeOrigin.id].addConnection({ ...tempConnection, isManual: true })
		// 	this.selectedNode=[]
		// 	setTempConnection(null)
		// 	this.newConnectionNode = null
		// 	this.isNodeConnectionVisible = false
		// }
		// Enviar cambios de posición

		if (all) {
			this.nodes.clear()
			this.selectedNode = []
			this.newConnectionNode = null
			this.isNodeConnectionVisible = false
		}
	}

	event_mouse_move({ x, y }: INodeCanvas['design']) {
		this.canvasTranslate.x = x - this.canvasTempPosX
		this.canvasTranslate.y = y - this.canvasTempPosY
	}

	event_mouse_relative({ x, y }: INodeCanvas['design']) {
		this.canvasPosition = { x, y }
		this.canvasRelativePos = {
			x: Number.parseFloat(((x - this.canvasTranslate.x) / this.canvasFactor).toFixed(2)),
			y: Number.parseFloat(((y - this.canvasTranslate.y) / this.canvasFactor).toFixed(2))
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
		this.event_zoom({ value: deltaY > 0 ? -0.1 : 0.1 })
		this.canvasTranslate.x -= this.canvasRelativePos.x * (this.canvasFactor - tempFactor)
		this.canvasTranslate.y -= this.canvasRelativePos.y * (this.canvasFactor - tempFactor)
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
		const data: INodeCanvas = {
			...node,
			id: node.id || id,
			design: {
				x: Math.round((node.design.x || 0) / this.canvasGrid) * this.canvasGrid,
				y: Math.round((node.design.y || 0) / this.canvasGrid) * this.canvasGrid
			}
		}
		data.info.name = utilsValidateName({
			text: node.info.name,
			nodes: Object.values(this.nodes.getNodes())
		})
		const nodeDestiny = this.nodes.addNode(data, isManual)

		if (origin) {
			this.nodes.getNode({ id: origin.idNode }).addConnection({
				connectorType: origin.connectorType,
				connectorName: origin.connectorName,
				idNodeDestiny: nodeDestiny.id,
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
		if (action === 'virtualRemoveNode' && !Array.isArray(node)) {
			// this.selectedNode.delete(node.id)
			// const listConnection = this.connectionNodes.filter((value) => value.id_node_origin === node.id || value.id_node_destiny === node.id)
			// for (const connection of listConnection) {
			// 	this.actionDeleteConnectionById({ id: connection.id })
			// }
			this.nodes.removeNode(String(node.id))
			// if (this.events_context_menu) {
			// 	this.events_context_menu(null)
			// }
		}
		if (action === 'duplicateNode') {
			const ids: string[] = []
			const tempIds = []
			const tempConnections = []
			const nodes = Array.isArray(node) ? node : [node]
			for (const node of nodes) {
				const name = node.info.name.split('_').length > 1 ? node.info.name.split('_').slice(0, -1).join('_') : node.info.name
				const ICanvasNodeNew = {
					...node,
					properties: JSON.parse(JSON.stringify(node.properties)),
					connections: []
				}
				ICanvasNodeNew.info.name = name
				const id = this.actionAddNode({
					node: ICanvasNodeNew,
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
			this.selectedNode = []
			// this.actionSelectNodeById({ ids })
		}

		// if (this.events_context_menu) this.events_context_menu(null)
	}
	/**
	 * Deletes a connection node by its ID.
	 *
	 * @param {Object} param - The parameter object.
	 * @param {string} param.id - The ID of the connection node to delete.
	 *
	 * @returns {void}
	 */
	actionDeleteConnectionById({ id }: { id: string }) {
		// Encontrar y eliminar la conexión de todos los nodos
		for (const node of Object.values(this.nodes.nodes)) {
			node.deleteConnections({ id })
		}
		// if (this.events_show_connection_context) {
		// 	this.events_show_connection_context(null)
		// }
	}

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
		for (const event of this.eventsCanvas) {
			this.canvas.removeEventListener(event as any, (e) => {
				e.preventDefault()
				this.events({ event: event as string, e })
			})
		}
		window.removeEventListener('resize', () => this.event_resize())
		document.removeEventListener('mouseup', this.eventMouseUp)
		subscriberHelper().clear()
		if (this.backgroundUpdateInterval) {
			clearInterval(this.backgroundUpdateInterval)
		}
	}
}
