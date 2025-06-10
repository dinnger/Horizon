import type { Express } from 'express'
import type { IServerEnv } from './server.interface.js'
import type { INodePropertiesType } from './node.properties.interface.js'
import type { IWorkflowContext } from './workflow.interface.js'
import type { IWorkerEnv } from './worker.interface.js'

interface Point {
	x: number
	y: number
}

export interface INodePoint extends Point {
	button?: number
}

interface IMetaNode {
	[key: string]: any
}

export interface INodeConnectors {
	inputs: string[]
	outputs: string[]
	callbacks?: string[]
}

export interface INodeConnections {
	id: string
	nodeOrigin: INodeCanvasNewClass
	nodeDestiny: INodeCanvasNewClass
	idConnectorOrigin: string // connector output
	idConnectorDestiny: string // connector input
	isManual?: boolean
	pointers?: Point[]
	colorGradient?: any
	isFocused?: boolean
	isNew?: boolean
}

interface INodeDesign extends INodePoint {
	width: number
	height: number
}

export interface INode {
	id: string
	name: string
	type: string
	icon: string
	color: string
	properties: INodePropertiesType
	meta?: IMetaNode
	design?: INodeDesign
	connectors: INodeConnectors
	connections?: INodeConnections[]
}

// ============================================================================
// CANVAS
// ============================================================================

export interface INodeCanvas extends Omit<INode, 'design'> {
	design: INodeDesign
	isManual?: boolean
}

export type INodeCanvasNew = Omit<INodeCanvas, 'isManual'>

export interface INodeCanvasNewClass extends INodeCanvasNew {
	design: INodeDesign
	setSelected: ({ pos, relative }: { pos?: { x: number; y: number; x2?: number; y2?: number }; relative: { x: number; y: number } }) => {
		node: INodeCanvasNewClass
		type: 'input' | 'output' | 'callback'
		index: number
		value: any
	} | null
	getSelected: () => boolean
	move: ({ relative }: { relative: { x: number; y: number } }) => void
	actionAddConnection: (element: INodeConnections) => void
	render: ({ ctx }: { ctx: CanvasRenderingContext2D }) => void
	renderConnections: ({ ctx, nodes }: { ctx: CanvasRenderingContext2D; nodes: { [key: string]: INodeCanvasNew } }) => void
}

// ============================================================================
// PLUGINS NODES
// ============================================================================
// Node Info
// ============================================================================
interface INodeInfo {
	title: string
	desc: string
	icon: string
	group: string
	color: string
	connectors: INodeConnectors
	flags?: {
		isSingleton?: boolean
		isTrigger?: boolean
		isAccessSecrets?: boolean
	}
}

// ============================================================================
// Workflow Creation
// ============================================================================
interface IClassOnCreateDependency {
	getRequire: (name: string) => Promise<any>
	getModule: ({ path, name }: { path: string; name: string }) => Promise<any>
	getSecret: ({ type, subType, name }: { type: string; subType?: string; name?: string }) => Promise<any>
	listSecrets: ({ type, subType }: { type: string; subType?: string }) => Promise<any>
}

export interface INodeClassOnCreate {
	context: IWorkflowContext
	environment: Partial<IServerEnv> & Partial<IWorkerEnv>
	dependency: IClassOnCreateDependency
}

// ============================================================================
// Workflow Execution
// ============================================================================
interface IClassOnExecuteExecution {
	isTest: boolean
	getNodeById: (id: string) => INodeClassExec | null
	getNodeByType: (type: string) => {
		node: INodeClassExec
		meta?: IMetaNode
		data: object
	} | null
	getNodesInputs: (idNode: string) => Set<string> | null
	getNodesOutputs: (idNode: string) => Set<string> | null
	getExecuteData: () => Map<string, { data: object; meta?: IMetaNode; time: number }>
	setExecuteData: (data: Map<string, { data: object; meta?: IMetaNode; time: number }>) => void
	setGlobalData: ({ type, key }: { type: string; key: string; value: any }) => void
	getGlobalData: ({ type, key }: { type: string; key: string }) => any
	deleteGlobalData: ({ type, key }: { type: string; key: string }) => void
	ifExecute: () => boolean
	stop: () => void
}

export interface INodeClassOnExecute {
	app: Express
	execute: IClassOnExecuteExecution
	context: IWorkflowContext
	environment: Partial<IServerEnv> & Partial<IWorkerEnv>
	inputData: { idNode: string; inputName: string; data: object; meta?: IMetaNode }
	outputData: (output: string, data: object, meta?: IMetaNode) => void
	dependency: any
	credential: any
	logger: {
		info: (...args: unknown[]) => void
		error: (...args: unknown[]) => void
	}
}

// ============================================================================
// Workflow Credential
// ============================================================================
interface IClassOnCredentialResponse {
	alert: string
	type: 'info' | 'error'
}

export interface INodeClassOnCredential {
	action: 'test' | 'new' | 'save'
	dependency: any
}

// ============================================================================
// Node Class
// ============================================================================
export interface INodeClass<T extends INodePropertiesType = INodePropertiesType, C extends INodePropertiesType = INodePropertiesType> {
	info: INodeInfo
	dependencies?: string[]
	properties: T
	credentials?: C
	meta?: IMetaNode
	tags?: 'tools'[]
	onCreate?: (data: INodeClassOnCreate) => void
	onExecute: (data: INodeClassOnExecute) => void
	onCredential?: (data: INodeClassOnCredential) => void
	onDeploy?: () => void
}

export type INodeClassProperty = INodePropertiesType
export type INodeClassPropertyType = INodePropertiesType[keyof INodePropertiesType]

// ============================================================================
// Node Class Exec
// ============================================================================
export interface INodeClassExec extends Omit<INode, 'icon' | 'color' | 'connectors'> {
	icon?: string
	color?: string
	connectors?: INodeConnectors
	class: any
	update?: () => void
}

// ============================================================================
// Node Map
// ============================================================================
export interface INodeMap extends Omit<INodeClass, 'onCreate' | 'onExecute' | 'onCredential'> {
	name: string
	type: string
	group: string
	dependencies: string[]
	properties: INodePropertiesType
	class: any
	credentialsActions?: {
		[key: string]: string
	}
}

// ============================================================================
// Comunicación para microservicios
// ============================================================================
export interface INodeClassConnection {
	connection?(params: Record<string, any>): Promise<void>
	request?(params: Record<string, any>): Promise<void>
	retry?(params: {
		fn: (args?: any) => Promise<void> | void
		error: string
		args?: any
	}): Promise<void>
}
