import { getDeploysClass } from '@shared/maps/deploy.maps.js'

export function pluginsDeploysService() {
	return {
		// plugins/deploys/get
		get: async () => {
			const deploys = []
			const deployClass = getDeploysClass()
			for (const key of Object.keys(deployClass)) {
				deploys.push({
					name: deployClass[key].name,
					type: key,
					info: deployClass[key].info,
					properties: deployClass[key].properties
				})
			}
			return { deploys }
		}
	}
}
