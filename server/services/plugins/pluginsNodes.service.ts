import type { INodeCanvas } from '@shared/interface/node.interface.js';
import { getNodeClass, NodeClassInfo } from '@shared/maps/nodes.map.js'; // Assuming NodeClassInfo is exported

/**
 * @interface GetParams
 * @description Parameters for the `get` method of PluginsNodesService.
 * @property {string} [type] - Optional type filter. If provided, only nodes of this type will be returned.
 */
interface GetParams {
	type?: string;
}

/**
 * @interface GetResult
 * @description Defines the structure of the result returned by the `get` method of PluginsNodesService.
 * @property {INodeCanvas[]} nodes - An array of node information objects, conforming to the INodeCanvas interface.
 */
interface GetResult {
	nodes: INodeCanvas[];
}

/**
 * @export
 * @interface PluginsNodesService
 * @description Defines the contract for the service that provides information about available node plugins.
 * @property {(params: GetParams) => Promise<GetResult>} get - Asynchronously retrieves a list of available node plugins, optionally filtered by type.
 *                                                            This can be synchronous if `getNodeClass` is synchronous.
 */
export interface PluginsNodesService {
	get: (params: GetParams) => Promise<GetResult>;
}

/**
 * @function pluginsNodesService
 * @description Factory function to create an instance of the PluginsNodesService.
 * This service is responsible for fetching details about registered node plugins.
 * @returns {PluginsNodesService} An object implementing the PluginsNodesService interface.
 */
export function pluginsNodesService(): PluginsNodesService {
	return {
		/**
		 * @async
		 * @function get
		 * @description Retrieves information for all registered node plugins, or filters by a specific type if provided.
		 * It iterates over the map of node classes and formats them into a list compatible with INodeCanvas.
		 * Kept async for consistency, but can be made synchronous if `getNodeClass()` is synchronous.
		 * @param {GetParams} params - Parameters for the get operation, may contain a type to filter by.
		 * @returns {Promise<GetResult>} A promise that resolves with an object containing a list of node plugins.
		 */
		get: async ({ type }: GetParams): Promise<GetResult> => {
			const nodes: INodeCanvas[] = [];
			const nodeClassMap = getNodeClass(); // Retrieves a map of node plugin constructors/classes

			// Iterate over each registered node plugin type (key) in the map
			for (const key of Object.keys(nodeClassMap)) {
				// If a type filter is provided and it doesn't match the current key, skip this node
				if (type && key !== type) continue;

				const nodeInfo: NodeClassInfo = nodeClassMap[key]; // Get the info for the current node type

				// Construct the INodeCanvas compatible object
				nodes.push({
					info: nodeInfo.info,
					type: key, // The key from the map is the node type string
					properties: nodeInfo.properties,
					design: { // Default design properties for canvas representation
						x: 0,
						y: 0,
					},
				});
			}
			return { nodes };
		},
	};
}
