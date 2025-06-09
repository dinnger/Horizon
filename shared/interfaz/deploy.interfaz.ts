import type { IPropertiesType } from './node.properties.interfaz.js'

interface IServerDeployInfo {
	title: string
	desc: string
	icon: string
}

interface IServerDeployContext {
	context: Record<string, any>
}

export interface IServerDeploy {
	info: IServerDeployInfo
	properties: Record<string, IPropertiesType>
	onExecute: ({ context }: IServerDeployContext) => Promise<void>
}
