import { getDeploysClass, DeployClassInfo } from '@shared/maps/deploy.maps.js'; // Assuming DeployClassInfo is exported from deploy.maps.js

/**
 * @interface DeployPluginInfo
 * @description Defines the structure for information about a deploy plugin.
 * @property {string} name - The display name of the deploy plugin.
 * @property {string} type - The unique type identifier for the deploy plugin (often the key from the map).
 * @property {any} info - General information about the plugin. Ideally, this would have a more specific type (e.g., `DeployClassInfo['info']`).
 * @property {any} properties - Default properties or configuration schema for the plugin. Ideally, this would have a more specific type (e.g., `DeployClassInfo['properties']`).
 */
interface DeployPluginInfo {
	name: string;
	type: string;
	info: any;
	properties: any;
}

/**
 * @interface GetResult
 * @description Defines the structure of the result returned by the `get` method of the PluginsDeploysService.
 * @property {DeployPluginInfo[]} deploys - An array of deploy plugin information objects.
 */
interface GetResult {
	deploys: DeployPluginInfo[];
}

/**
 * @export
 * @interface PluginsDeploysService
 * @description Defines the contract for the service that provides information about available deploy plugins.
 * @property {() => Promise<GetResult>} get - Asynchronously retrieves a list of all available deploy plugins.
 *                                            This can be synchronous if `getDeploysClass` is synchronous.
 */
export interface PluginsDeploysService {
	get: () => Promise<GetResult>;
}

/**
 * @function pluginsDeploysService
 * @description Factory function to create an instance of the PluginsDeploysService.
 * This service is responsible for fetching details about registered deploy plugins.
 * @returns {PluginsDeploysService} An object implementing the PluginsDeploysService interface.
 */
export function pluginsDeploysService(): PluginsDeploysService {
	return {
		/**
		 * @async
		 * @function get
		 * @description Retrieves information for all registered deploy plugins.
		 * It iterates over the map of deploy classes and formats them into a list.
		 * Kept async for consistency, but can be made synchronous if `getDeploysClass()` is synchronous.
		 * @returns {Promise<GetResult>} A promise that resolves with an object containing a list of deploy plugins.
		 */
		get: async (): Promise<GetResult> => {
			const deploys: DeployPluginInfo[] = [];
			const deployClassMap = getDeploysClass(); // Retrieves a map of deploy plugin constructors/classes

			// Iterate over each registered deploy plugin type (key) in the map
			for (const key of Object.keys(deployClassMap)) {
				const deployInfo: DeployClassInfo = deployClassMap[key]; // Get the info for the current plugin type
				deploys.push({
					name: deployInfo.name,
					type: key, // The key from the map serves as the unique type identifier
					info: deployInfo.info,
					properties: deployInfo.properties,
				});
			}
			return { deploys };
		},
	};
}
