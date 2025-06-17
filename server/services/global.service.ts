import { globalDeployService, GlobalDeployService } from './global/globalDeploy.service.js';

/**
 * @export
 * @interface GlobalService
 * @description Defines the structure of the main global service.
 * This service acts as an aggregator for other global sub-services.
 * @property {() => GlobalDeployService} deploy - A function that returns an instance of the GlobalDeployService.
 *                                               The GlobalDeployService itself handles deployment-related operations.
 */
export interface GlobalService {
	deploy: () => GlobalDeployService;
}

/**
 * @function globalService
 * @description Factory function to create an instance of the main GlobalService.
 * This service provides access to various global sub-services, such as the deployment service.
 * @returns {GlobalService} An object implementing the GlobalService interface.
 */
export function globalService(): GlobalService {
	return {
		// Provides access to the global deployment service
		deploy: globalDeployService,
	};
}
