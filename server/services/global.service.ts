import { globalDeployService } from './global/globalDeploy.service.js'

export function global_service() {
	return {
		// global/deploy
		deploy: globalDeployService
	}
}
