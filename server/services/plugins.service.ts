import { pluginsDeploysService } from './plugins/pluginsDeploys.service.js'
import { pluginsNodesService } from './plugins/pluginsNodes.service.js'

export function pluginsService() {
	return {
		// plugins/nodes
		nodes: pluginsNodesService,
		// plugins/deploys
		deploys: pluginsDeploysService
	}
}
