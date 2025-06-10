import type { IPropertiesType } from './node.properties.interface.js'

interface IServerDeployInfo {
	title: string
	desc: string
	icon: string
}

interface IServerDeployContext {
	context: Record<string, any>
}

export interface IDeploy {
	info: IServerDeployInfo
	properties: Record<string, IPropertiesType>
	onExecute: ({ context }: IServerDeployContext) => Promise<void>
}

export interface IDeployExec extends Omit<IDeploy, 'onExecute'> {
	name: string
	class?: any
}
