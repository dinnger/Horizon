import type { Express } from 'express'
import type { IWorkflowContext } from '@shared/interface/workflow.interface.js'
import type { IServerEnv } from '@shared/interface/server.interface.js'
import type { IWorkerEnv } from '@shared/interface/worker.interface.js'
import envs from '../shared/utils/envs.js'
import { VariableModule } from './modules/variables/index.js'
import { NodeModule } from './modules/workflow/index.js'
import { CoreModule } from './modules/core/index.js'
import { VirtualModule } from './modules/virtual/index.js'
import { CommunicationModule } from './modules/communication/index.js'
// -----------------------------------------------------------------------------
// Base
// -----------------------------------------------------------------------------

export const info = {}
export class Worker {
	app: Express
	flow: string
	context: IWorkflowContext
	environment: Partial<IServerEnv> & Partial<IWorkerEnv>

	index: number | null
	isDev: boolean

	coreModule: CoreModule
	nodeModule: NodeModule
	communicationModule: CommunicationModule
	virtualModule: VirtualModule
	variableModule: VariableModule

	constructor({
		app,
		context,
		uidFlow,
		isDev,
		index
	}: {
		app: Express
		context: IWorkflowContext
		uidFlow: string
		isDev: boolean
		index: number
	}) {
		this.flow = uidFlow
		this.app = app
		this.context = context
		this.isDev = isDev
		this.index = index
		this.environment = envs

		this.communicationModule = new CommunicationModule({ el: this })
		this.variableModule = new VariableModule({ el: this })
		this.virtualModule = new VirtualModule({ el: this })
		this.coreModule = new CoreModule({ el: this })
		this.nodeModule = new NodeModule({ el: this })
	}
}
