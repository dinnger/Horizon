import type { INodeCanvas, INodeConnections } from './node.interface.js'
import type { IPropertiesType } from './node.properties.interface.js'

interface IWorkflowInfo {
	uid: string
	name: string
	description: string
	version: string
	author: string
	date: string
}

type IWorkflowProject =
	| { type: 'tcp'; tcp: { port: number; host?: string; protocol?: 'http' | 'https'; maxRetries: number } }
	| { type: 'rabbitMQ'; rabbitMQ: { host: string; port: number; exchange: string; maxRetries: number; username: string; password: string } }
	| { type: 'kafka'; kafka: { host: string; port: number; exchange: string; maxRetries: number; username: string; password: string } }

interface IWorkflowProperties {
	basic: {
		router: string
	}
	deploy?: number | null
}

interface IWorkflowEnv {
	secrets: Record<string, string>
	variables: Record<string, string>
}

export type IWorkflowPropertyType = IPropertiesType

export interface IWorkflowContext extends Omit<IWorkflow, 'connections'> {
	currentNode?: INodeCanvas
}
export interface IWorkflow {
	uid?: string
	info: IWorkflowInfo
	project?: IWorkflowProject
	env: IWorkflowEnv
	connections: INodeConnections[]
	properties: IWorkflowProperties
	nodes: Record<string, INodeCanvas>
}
