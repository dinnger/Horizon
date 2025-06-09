import type { INode, INodeClassExec } from './node.interfaz.js'
import type { IPropertiesType } from './node.properties.interfaz.js'

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

interface IWorkflowProperties {
	basic: {
		router: string
	}
}

interface IWorkflowEnv {
	secrets: Record<string, string>
	variables: Record<string, string>
}

interface IWorkflowConnections {
	id: string
	id_node_origin: string
	id_node_destiny: string
	output: string
	input: string
	isNew?: boolean
}

export type IWorkflowPropertyType = IPropertiesType

export interface IWorkflow {
	info: IWorkflowInfo
	project: IWorkflowProject
	nodes: Record<string, INode>
	properties: IWorkflowProperties
	env: IWorkflowEnv
	connections: IWorkflowConnections[]
}

export interface IWorkflowContext extends Omit<IWorkflow, 'connections'> {
	currentNode?: INodeClassExec
}
