import { securityService } from './services/security.service.js'
import { global_service } from './services/global.service.js'
import { pluginsService } from './services/plugins.service.js'
import { projectsService } from './services/projects.service.js'
import { workerService } from './services/worker.service.js'
import { workflowsService } from './services/workflows.service.js'
import { workspaceService } from './services/workspace.service.js'

export function router() {
	return {
		server: () => {
			return {
				global: global_service,
				security: securityService,
				projects: projectsService,
				workflows: workflowsService,
				worker: workerService,
				plugins: pluginsService,
				workspace: workspaceService
			}
		}
	}
}
