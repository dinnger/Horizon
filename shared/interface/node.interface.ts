import type { Express } from 'express'
import type { IServerEnv } from './server.interface.js'
import type { INodePropertiesType } from './node.properties.interface.js'
import type { IWorkflowContext } from './workflow.interface.js'
import type { IWorkerEnv } from './worker.interface.js'

interface Point {
	x: number
	y: number
}

interface INodeInfo {
	name: string
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

interface IMetaNode {
	[key: string]: any
}

export interface INodeConnectors {
	inputs: string[]
	outputs: string[]
	callbacks?: string[]
}

export interface INodeConnections {
	id?: string
	connectorType: 'input' | 'output' | 'callback'
	connectorName: string
	nodeOrigin?: INodeCanvas
	nodeDestiny: INodeCanvas
	connectorDestinyType: 'input' | 'output' | 'callback' // connector output
	connectorDestinyName: string // connector input
	isManual?: boolean
	pointers?: Point[]
	colorGradient?: any
	isFocused?: boolean
	isNew?: boolean
}

interface IClassOnCreateDependency {
	getRequire: (name: string) => Promise<any>
	getModule: ({ path, name }: { path: string; name: string }) => Promise<any>
	getSecret: ({ type, subType, name }: { type: string; subType?: string; name?: string }) => Promise<any>
	listSecrets: ({ type, subType }: { type: string; subType?: string }) => Promise<any>
}

interface INodeClassOnCreate {
	context: IWorkflowContext
	environment: Partial<IServerEnv> & Partial<IWorkerEnv>
	dependency: IClassOnCreateDependency
}
interface IClassExecute {
	isTest: boolean
	getNodeById: (id: string) => INode | null
	getNodeByType: (type: string) => {
		node: INode
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

interface INodeClassOnExecute {
	app: Express
	execute: IClassExecute
	context: IWorkflowContext
	environment: Partial<IServerEnv> & Partial<IWorkerEnv>
	inputData: {
		idNode: string
		connectorType: 'input' | 'output' | 'callback'
		connectorName: string
		data: object
		meta?: IMetaNode
	}
	outputData: (output: string, data: object, meta?: IMetaNode) => void
	dependency: any
	credential: any
	logger: {
		info: (...args: unknown[]) => void
		error: (...args: unknown[]) => void
	}
}

interface INodeClassOnCredential {
	action: 'test' | 'new' | 'save'
	dependency: any
	response?: {
		alert: string
		type: 'info' | 'error'
	}
}

// ============================================================================
// Node
// ============================================================================
export interface INode {
	id?: string
	info: INodeInfo
	dependencies?: string[]
	properties: INodePropertiesType
	credentials?: INodePropertiesType
	meta?: IMetaNode
	tags?: string[]
}

// ============================================================================
// CANVAS
// ============================================================================

export interface INodeCanvas extends INode {
	type: string
	design: Point & { width?: number; height?: number }
	connections?: INodeConnections[]
}

// ============================================================================
// Node Class
// ============================================================================
export interface INodeClass extends INode {
	type?: string
	onCreate?: (data: INodeClassOnCreate) => void
	onExecute: (data: INodeClassOnExecute) => void
	onCredential?: (data: INodeClassOnCredential) => void
	onDeploy?: () => void
}

export type INodeClassProperty = INodeClass['properties']
export type INodeClassPropertyType = INodeClassProperty[keyof INodeClassProperty]

// ============================================================================
// Comunicación para microservicios
// ============================================================================
export interface INodeMicroservice {
	execute: INodeClassOnExecute['execute']
	outputData: INodeClassOnExecute['outputData']
	context: INodeClassOnExecute['context']

	connection?(params: Record<string, any>): Promise<void>
	request?(params: Record<string, any>): Promise<void>
	retry?(params: {
		fn: (args?: any) => Promise<void> | void
		error: string
		args?: any
	}): Promise<void>
}
