import type { INode, INodeCanvas } from '@shared/interface/node.interface.js'
import { getNodeClass } from '@shared/maps/nodes.map.js'

export function pluginsNodesService() {
	return {
		// plugins/nodes/get
		get: async ({ type }: { type?: string }) => {
			const nodes: INodeCanvas[] = []
			const nodesClass = getNodeClass()

			for (const key of Object.keys(nodesClass)) {
				if (type && key !== type) continue
				const node = nodesClass[key]
				nodes.push({
					info: node.info,
					type: key,
					properties: node.properties,
					design: {
						x: 0,
						y: 0
					}
				})
			}
			return { nodes }
		}
	}
}
