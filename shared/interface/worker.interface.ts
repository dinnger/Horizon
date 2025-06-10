export interface IWorkerEnv {
	isDev: boolean
	isSubFlow: boolean
	subFlowBase: string
	subFlowParent: string
}

export interface IWorkerDependencies {
	secrets: Set<{
		idNode: string
		type: string
		name: string
		secret: string
	}>
	credentials: Set<{
		idNode: string
		type: string
		name: string
		credentials: string[]
	}>
}
