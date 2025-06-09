import type { Express } from 'express'
import type { IServerEnv } from './server.interfaz.js'
import type { INodePropertiesType } from './node.properties.interfaz.js'
import type { IWorkflowContext } from './workflow.interfaz.js'
import type { IWorkerEnv } from './worker.interfaz.js'

interface IMetaNode {
	[key: string]: any
}

interface IConnectors {
	inputs: string[]
	outputs: string[]
	callbacks?: string[]
}

export interface INode {
	id: string
	name: string
	type: string
	icon: string
	color: string
	x: number
	y: number
	properties: INodePropertiesType
	meta?: IMetaNode
	connectors: IConnectors
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
	connectors: IConnectors
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
	properties: T
	credentials?: C
	meta?: IMetaNode
	onCreate?: (data: INodeClassOnCreate) => void
	onExecute: (data: INodeClassOnExecute) => void
	onCredential?: (data: INodeClassOnCredential) => void
}

export type INodeClassProperty = INodePropertiesType
export type INodeClassPropertyType = INodePropertiesType[keyof INodePropertiesType]

// ============================================================================
// Node Class Exec
// ============================================================================
export interface INodeClassExec extends Omit<INode, 'icon' | 'color' | 'connectors'> {
	icon?: string
	color?: string
	connectors?: IConnectors
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
