import { NewNode } from './../../../../../shared/class/node.class'
import type {
	ICanvasPoint,
	IConnection,
	INode,
	INodeCanvas,
	INodeNew
} from '@shared/interfaces/workflow.interface.js'
import { utilsValidateName } from '../../../shared/utils'
import {
	drawNodeConnectionPreview,
	renderConnectionNodes,
	renderNodes,
	renderSelected,
	setTempConnection,
	getTempConnection,
	verifyNodeFocus,
	subscriberHelper,
	renderAnimation
} from './canvas_helpers'
import { pattern_dark, pattern_light } from './canvas_pattern'
import { v4 as uuidv4 } from 'uuid'
import type { SubscriberType } from '@shared/interfaces/class.interface'

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
	canvasRelativePos: ICanvasPoint
	canvasPosition: ICanvasPoint
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

	nodes: { [key: string]: INodeCanvas }
	selectedNode: Map<
		string,
		{
			node: INodeCanvas
			relative_pos: ICanvasPoint
			isMove: boolean
		}
	>
	newConnectionNode: {
		node: INode
		output_index: number
		temp_pos?: ICanvasPoint
	} | null
	isNodeConnectionVisible: boolean
	connectionNodes: IConnection[]

	// Events
	// Muestra la ventana de nuevo nodo
	events_new_node_start:
		| null
		| (({
				node,
				output_index,
				pos,
				relative_pos
		  }: {
				node?: INode
				output_index?: number
				pos?: ICanvasPoint
				relative_pos?: ICanvasPoint
		  }) => void)
	// Muestra la ventana de propiedades
	events_show_properties: null | (({ show }: { show: boolean }) => void)
	// Context Menu
	events_context_menu: null | (({ show }: { show: boolean }) => void)
	// Muestra la ventana de propiedades de conexiones
	events_show_connection_context:
		| null
		| ((
				data: {
					id: string
					node_origin: INode
					node_destiny: INode
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

		this.theme = theme
		this.nodes = {}
		this.selectedNode = new Map()
		this.newConnectionNode = null
		this.isNodeConnectionVisible = false
		this.connectionNodes = []

		this.events_new_node_start = null
		this.events_show_properties = null
		this.events_context_menu = null
		this.events_show_connection_context = null
	}

	init({
		nodes,
		connections
	}: { nodes?: { [key: string]: INodeNew }; connections?: IConnection[] }) {
		this.addImageProcess(
			this.theme === 'dark' ? pattern_dark : pattern_light
		).then((img) => {
			this.canvasPattern = this.ctx.createPattern(
				img,
				'repeat'
			) as CanvasPattern
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

	load({
		nodes,
		connections
	}: { nodes: { [key: string]: INodeNew }; connections: IConnection[] }) {
		for (const [key, node] of Object.entries(nodes)) {
			this.actionAddNode({
				id: key,
				name: node.name,
				type: node.type,
				x: node.x,
				y: node.y,
				color: node.color,
				icon: node.icon,
				inputs: node.inputs,
				outputs: node.outputs,
				properties: node.properties,
				meta: node.meta,
				connections: []
			})
		}
		for (const connection of connections) {
			this.actionAddConnection(connection)
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

		for (const [_, connection] of Array.from(this.connectionNodes.entries())) {
			const node_origin = this.nodes[connection.id_node_origin]
			const node_destiny = this.nodes[connection.id_node_destiny]
			if (!node_origin || !node_destiny) continue
			renderConnectionNodes({
				ctx: this.ctx,
				node_origin,
				node_destiny,
				input: connection.input,
				output: connection.output,
				indexTime: this.indexTime,
				connection,
				nodes: this.nodes
			})
		}
		renderNodes({
			nodes: this.nodes,
			selectedNode: this.selectedNode,
			theme: this.theme,
			ctx: this.ctx
		})

		renderSelected({
			canvasSelect: this.canvasSelect,
			theme: this.theme,
			selectedNode: this.selectedNode,
			canvasRelativePos: this.canvasRelativePos,
			nodes: this.nodes,
			ctx: this.ctx
		})
		if (this.newConnectionNode) {
			drawNodeConnectionPreview({
				node_connection_new: this.newConnectionNode,
				canvasRelativePos:
					this.newConnectionNode.temp_pos || this.canvasRelativePos,
				nodes: this.nodes,
				ctx: this.ctx
			})
		}

		// Animation
		renderAnimation(this.nodes, this.ctx)

		this.ctx.restore()
	}

	fn_get_nodes_array() {
		return Object.values(this.nodes)
	}

	fn_node_focus({ x, y }: ICanvasPoint) {
		const selectedNode = verifyNodeFocus({ x, y, nodes: this.nodes })
		if (!selectedNode.node) {
			this.selectedNode.clear()
			return
		}

		const exists = this.selectedNode.has(selectedNode.node.id)
		if (!exists) {
			this.selectedNode.clear()
			this.selectedNode.set(selectedNode.node.id, {
				node: selectedNode.node,
				relative_pos: {
					x: this.canvasRelativePos.x - selectedNode.node.x,
					y: this.canvasRelativePos.y - selectedNode.node.y
				},
				isMove: false
			})
		}
		// Actualiza la posición de los nodos seleccionados
		if (exists) {
			for (const select of this.selectedNode.values()) {
				select.relative_pos = {
					x: this.canvasRelativePos.x - select.node.x,
					y: this.canvasRelativePos.y - select.node.y
				}
			}
		}
	}

	fn_node_connect_focus({ x, y }: ICanvasPoint) {
		const verify = verifyNodeFocus({
			x,
			y,
			nodes: this.nodes,
			margin: { x1: 10, y1: 0, x2: 10, y2: 0 }
		})
		if (!verify.node || verify.output_index === null) return
		this.newConnectionNode = {
			node: verify.node,
			output_index: verify.output_index
		}
		this.isNodeConnectionVisible = false
		this.selectedNode.set(verify.node.id, {
			node: verify.node,
			relative_pos: {
				x: this.canvasRelativePos.x - verify.node.x,
				y: this.canvasRelativePos.y - verify.node.y
			},
			isMove: false
		})
	}

	fn_node_connect_property_focus({ openMenu }: { openMenu: boolean }) {
		for (const value of Array.from(this.connectionNodes.values())) {
			value.isFocused = false
		}
		const pointers = Array.from(this.connectionNodes.values()).flatMap(
			(value) => {
				return value.pointers
					? value.pointers.map((pointer, key: number) => {
							const prev = value.pointers?.[key - 1]
								? {
										x2: value.pointers[key - 1].x,
										y2: value.pointers[key - 1].y
									}
								: { x2: pointer.x, y2: pointer.y }
							return {
								x1: Math.min(pointer.x, prev.x2),
								y1: Math.min(pointer.y, prev.y2),
								x2: Math.max(pointer.x, prev.x2),
								y2: Math.max(pointer.y, prev.y2),
								index: key,
								el: value
							}
						})
					: []
			}
		)
		const { x, y } = this.canvasRelativePos
		for (const value of pointers) {
			const x1 = value.x1 - 10
			const y1 = value.y1 - 10
			const x2 = value.x2 + 10
			const y2 = value.y2 + 10
			if (x1 < x && x2 > x && y1 < y && y2 > y) {
				value.el.isFocused = true
				if (openMenu && this.events_show_connection_context) {
					this.events_show_connection_context({
						id: value.el.id,
						node_origin: this.nodes[value.el.id_node_origin],
						node_destiny: this.nodes[value.el.id_node_destiny],
						input: value.el.input,
						output: value.el.output
					})
				}
				break
			}
		}
	}

	fn_node_move() {
		for (const select of this.selectedNode.values()) {
			let x = this.canvasRelativePos.x - select.relative_pos.x
			let y = this.canvasRelativePos.y - select.relative_pos.y
			// x and y only divisible by 20
			x = Math.round(x / this.canvasGrid) * this.canvasGrid
			y = Math.round(y / this.canvasGrid) * this.canvasGrid
			if (x === select.node.x && y === select.node.y) return

			select.node.x = x
			select.node.y = y
			select.isMove = true
			// Reset connections
			select.node.update()
		}
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
	event_mouse_init({ x, y, button }: ICanvasPoint) {
		this.canvasTempPosX = x - this.canvasTranslateX
		this.canvasTempPosY = y - this.canvasTranslateY
		this.fn_node_focus({
			x: this.canvasRelativePos.x,
			y: this.canvasRelativePos.y
		})
		if (button === 0) {
			this.fn_node_connect_focus({
				x: this.canvasRelativePos.x,
				y: this.canvasRelativePos.y
			})
			this.fn_node_connect_property_focus({ openMenu: false })
			if (this.events_show_properties)
				this.events_show_properties({ show: false })
		}
		if (button === 2) {
			if (this.events_show_connection_context) {
				this.events_show_connection_context(null)
			}
			this.fn_node_connect_property_focus({ openMenu: true })
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
					this.newConnectionNode.temp_pos = { ...this.canvasRelativePos }
					this.events_new_node_start({
						pos: this.canvasPosition,
						relative_pos: { ...this.canvasRelativePos },
						output_index: this.newConnectionNode.output_index,
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
		const tempConnection = getTempConnection()
		if (tempConnection) {
			this.actionAddConnection({ ...tempConnection, isManual: true })
			this.selectedNode.clear()
			setTempConnection(null)
			this.newConnectionNode = null
			this.isNodeConnectionVisible = false
		}
		// Enviar cambios de posición
		if (this.selectedNode.size > 0) {
			for (const node of Array.from(this.selectedNode.values()).filter(
				(f) => f.isMove
			)) {
				subscriberHelper().send('changePosition', {
					node: node.node
				})
			}
		}
		if (all) {
			this.selectedNode.clear()
			this.newConnectionNode = null
			this.isNodeConnectionVisible = false
		}
		if (this.selectedNode.size === 0) {
			if (this.events_show_properties) {
				this.events_show_properties({ show: false })
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
		if (this.selectedNode.size === 0 || this.canvasSelect.show) {
			return this.fn_selected()
		}
		// Move Node
		if (this.selectedNode.size > 0 && !this.newConnectionNode) {
			this.fn_node_move()
		}
	}

	event_mouse_move({ x, y }: ICanvasPoint) {
		this.canvasTranslateX = x - this.canvasTempPosX
		this.canvasTranslateY = y - this.canvasTempPosY
	}

	event_mouse_relative({ x, y }: ICanvasPoint) {
		this.canvasPosition = { x, y }
		this.canvasRelativePos = {
			x: Number.parseFloat(
				((x - this.canvasTranslateX) / this.canvasFactor).toFixed(2)
			),
			y: Number.parseFloat(
				((y - this.canvasTranslateY) / this.canvasFactor).toFixed(2)
			)
		}
	}

	event_mouse_double_click() {
		if (this.events_show_properties && this.selectedNode.size > 0) {
			this.events_show_properties({ show: true })
		}
	}

	event_context_menu() {
		if (this.events_context_menu) {
			const selectedNodes = new Map<string, INode>()
			this.selectedNode.forEach((value, key) => {
				selectedNodes.set(key, value.node)
			})
			this.events_context_menu({ show: this.selectedNode.size > 0 })
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
		this.canvasTranslateX -=
			this.canvasRelativePos.x * (this.canvasFactor - tempFactor)
		this.canvasTranslateY -=
			this.canvasRelativePos.y * (this.canvasFactor - tempFactor)
	}

	event_node_position(
		fn: (data: { id: string; x: number; y: number }) => void
	) {
		for (const node of Object.values(this.nodes)) {
			fn({ id: node.id, x: node.x, y: node.y })
		}
	}

	event_subscriber(type: SubscriberType |SubscriberType[], fn: ({event,data}:{event: SubscriberType,data: any}) => void) {
    if (Array.isArray(type)){
      for (const t of type){
        subscriberHelper().subscriber(t, fn)
      }
    }else{
      subscriberHelper().subscriber(type, fn)
    }
	}

	// ============================================================================
	// Actions
	// ============================================================================
	/**
	 * Adds a new node to the canvas with the specified properties.
	 *
	 * @param {INodeNew} value - The properties of the new node to be added.
	 * @returns {string} The unique identifier of the newly added node.
	 *
	 * @remarks
	 * - The node's position (x, y) will be adjusted to align with the canvas grid.
	 * - The node's width will be determined by the greater of the specified width,
	 *   the width calculated based on the number of inputs, or the width calculated
	 *   based on the number of outputs.
	 * - The node's height will be determined by the greater of the specified height,
	 *   the height calculated based on the number of inputs, or the height calculated
	 *   based on the number of outputs.
	 * - If the node's name is not unique, it will be validated and adjusted to ensure uniqueness.
	 *
	 * @example
	 * ```typescript
	 * const newNode: INodeNew = {
	 *   name: 'Example Node',
	 *   type: 'exampleType',
	 *   x: 100,
	 *   y: 150,
	 *   inputs: [{ id: 'input1' }],
	 *   outputs: [{ id: 'output1' }],
	 *   properties: { key: 'value' },
	 *   meta: { description: 'An example node' }
	 * };
	 * const nodeId = actionAddNode(newNode);
	 * console.log(nodeId); // Outputs the unique identifier of the newly added node
	 * ```
	 */
	actionAddNode(value: INodeNew) {
		const id = uuidv4()

		const data = {
			id: value.id || id,
			name: utilsValidateName({
				text: value.name,
				nodes: Object.values(this.nodes)
			}),
			type: value.type,
			x: Math.round((value.x || 0) / this.canvasGrid) * this.canvasGrid,
			y: Math.round((value.y || 0) / this.canvasGrid) * this.canvasGrid,
			width: value.width || 90,
			height: 0,
			color: value.color,
			icon: value.icon,
			inputs: value.inputs || [],
			outputs: value.outputs || [],
			properties: value.properties || {},
			meta: value.meta || {},
			connections: []
		}

		this.nodes[value.id || id] = new NewNode(data)

		if (value.isManual) {
			subscriberHelper().send('addNode', { node: data })
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
	actionAddConnection({
		id,
		id_node_origin,
		id_node_destiny,
		input,
		output,
		isManual
	}: {
		id?: string
		id_node_origin: string
		id_node_destiny: string
		input: string
		output: string
		isManual?: boolean
	}) {
		if (
			this.connectionNodes.find(
				(f) =>
					f.id_node_destiny === id_node_destiny &&
					f.id_node_origin === id_node_origin &&
					f.input === input &&
					f.output === output
			)
		)
			return
		if (
			this.connectionNodes.find(
				(f) =>
					f.id_node_origin === id_node_destiny &&
					f.id_node_destiny === id_node_origin &&
					f.input === output &&
					f.output === input
			)
		)
			return

		id = id || uuidv4()
		const connections = {
			id,
			id_node_origin,
			id_node_destiny,
			input,
			output,
			pos_property: {},
			pointers: null
		}
		this.connectionNodes.push(connections)
		this.nodes[id_node_origin].connections.push(
			this.connectionNodes[this.connectionNodes.length - 1]
		)
		this.nodes[id_node_destiny].connections.push(
			this.connectionNodes[this.connectionNodes.length - 1]
		)
		if (isManual) {
			subscriberHelper().send('addConnection', {
				id,
				id_node_origin,
				output,
				id_node_destiny,
				input
			})
		}
	}

  /**
   * Nodes
   */
  actionNode(action:SubscriberType,node:INode | INode[]) {
   
    if (!Array.isArray(node)){
      subscriberHelper().send(action, {
        node: {
          id: node.id
        }
      })
    }
    if (action==='removeNode' && !Array.isArray(node)){
      this.selectedNode.delete(node.id)
      const listConnection = this.connectionNodes.filter(
        (value) =>
          value.id_node_origin === node.id || value.id_node_destiny === node.id
      )
      for (const connection of listConnection) {
        this.actionDeleteConnectionById({ id: connection.id })
      }
      delete this.nodes[node.id]
      if (this.events_context_menu) {
        this.events_context_menu({ show: false })
      }
    }
    if (action==='duplicateNode'){
      const ids: string[] = []
      const tempIds = []
      const tempConnections = []
      const nodes = Array.isArray(node) ? node : [node]
      for (const node of nodes) {
        const name =
          node.name.split('_').length > 1
            ? node.name.split('_').slice(0, -1).join('_')
            : node.name
        const id = this.actionAddNode({
          name,
          type: node.type,
          color: node.color,
          icon: node.icon,
          meta: node.meta,
          x: node.x + node.width / 2,
          y: node.y + node.height / 2,
          width: node.width,
          height: node.height,
          inputs: node.inputs,
          outputs: node.outputs,
          properties: JSON.parse(JSON.stringify(node.properties)),
          connections: [],
          isManual: true
        })
        tempConnections.push(...JSON.parse(JSON.stringify(node.connections)));
        tempIds.push({ beforeId: node.id, afterId: id });
        ids.push(id);
      }

      
      for (const temp of tempConnections) {
        temp.id_node_origin =
          tempIds.find((f) => f.beforeId === temp.id_node_origin)?.afterId ||
          temp.id_node_origin;
        temp.id_node_destiny =
          tempIds.find((f) => f.beforeId === temp.id_node_destiny)?.afterId ||
          temp.id_node_destiny;
      }
      for (const connection of tempConnections.filter(
        (f) => ids.includes(f.id_node_origin) && ids.includes(f.id_node_destiny)
      )) {
        this.actionAddConnection({
          id_node_origin: connection.id_node_origin,
          id_node_destiny: connection.id_node_destiny,
          input: connection.input,
          output: connection.output,
          isManual: true,
        });
      }
      this.selectedNode.clear()
      this.actionSelectNodeById({ ids });
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
	actionDeleteConnectionById({ id }: { id: string }) {
		this.connectionNodes = this.connectionNodes.filter(
			(value) => value.id !== id
		)
		subscriberHelper().send('removeConnection', {
			id
		})
		if (this.events_show_connection_context) {
			this.events_show_connection_context(null)
		}
	}

	actionSelectNodeById({ ids }: { ids: string[] }) {
		for (const id of ids) {
			const node = this.nodes[id]

			this.selectedNode.set(node.id, {
				node: node,
				relative_pos: {
					x: this.canvasRelativePos.x - node.x,
					y: this.canvasRelativePos.y - node.y
				},
				isMove: false
			})
		}
	}

	actionUpdateNodeMeta({ id, meta }: { id: string; meta: object }) {
		subscriberHelper().send('changeMeta', {
			id,
			meta
		})
	}

	actionTrace(data: {
		[id: string]: {
			inputs: { data: { [key: string]: number }; length: number }
			outputs: { data: { [key: string]: number }; length: number }
		}
	}) {
		for (const [id, item] of Object.entries(data)) {
			const node = this.nodes[id]
			if (!node) continue

			const data: { [key: string]: { value: number; changes: number } } = {}

			for (const [key, value] of Object.entries(item.outputs.data)) {
				data[key] = {
					value,
					changes: value - (node.info?.outputs.data[key]?.value || value - 1)
				}
			}

			node.info = {
				inputs: item.inputs,
				outputs: {
					data,
					length: item.outputs.length
				}
			}
		}
	}

	destroy() {
		subscriberHelper().clear()
		if (this.backgroundUpdateInterval) {
			clearInterval(this.backgroundUpdateInterval)
		}
	}
}
