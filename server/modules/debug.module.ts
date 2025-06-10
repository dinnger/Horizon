import { workerService } from '../services/worker.service.js'
import { workflowsService } from '../services/workflows.service.js'

export function workflow() {
	return {
		// workflows/list
		list: async () => {
			return workflowsService().list()
		},
		get: async (uid: string) => {
			return workflowsService().get({ uidFlow: uid })
		},
		detail: async (uid: string) => {
			return workerService({ app: null }).get(uid)
		},
		detailNode: async (uid: string, node: string) => {
			return workerService({ app: null }).getNode(uid, node)
		}
	}
}
