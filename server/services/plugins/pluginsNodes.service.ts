import { getNodeClass } from '@shared/maps/nodes.map.js'

export function pluginsNodesService() {
	return {
		// plugins/nodes/get
		get: async ({ type }: { type?: string }) => {
			const nodes = []
			const nodesClass = getNodeClass()

			for (const key of Object.keys(nodesClass)) {
				if (type && key !== type) continue
				nodes.push({
					name: nodesClass[key].name,
					type: key,
					typeDescription: nodesClass[key].typeDescription,
					info: nodesClass[key].info,
					properties: nodesClass[key].properties
				})
			}
			return { nodes }
		}
	}
}
