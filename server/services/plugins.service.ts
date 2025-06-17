import { pluginsDeploysService, PluginsDeploysService } from './plugins/pluginsDeploys.service.js';
import { pluginsNodesService, PluginsNodesService } from './plugins/pluginsNodes.service.js';

/**
 * @export
 * @interface PluginsService
 * @description Defines the structure of the main plugins service.
 * This service acts as an aggregator for other plugin-related sub-services,
 * such as services for node plugins and deploy plugins.
 * @property {() => PluginsNodesService} nodes - A function that returns an instance of the PluginsNodesService.
 * @property {() => PluginsDeploysService} deploys - A function that returns an instance of the PluginsDeploysService.
 */
export interface PluginsService {
	nodes: () => PluginsNodesService;
	deploys: () => PluginsDeploysService;
}

/**
 * @function pluginsService
 * @description Factory function to create an instance of the main PluginsService.
 * This service provides access to various plugin-related sub-services.
 * @returns {PluginsService} An object implementing the PluginsService interface.
 */
export function pluginsService(): PluginsService {
	return {
		// Provides access to the service for node plugins
		nodes: pluginsNodesService,
		// Provides access to the service for deploy plugins
		deploys: pluginsDeploysService,
	};
}
