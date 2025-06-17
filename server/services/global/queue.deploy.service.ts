import type { IDeploy } from '@shared/interface/deploy.interface.js';
import { getDeploysClass } from '@shared/maps/deploy.maps.js';
import { queueService } from './queue.service.js';
import { DeploymentsQueue_Table as DeploymentsQueueTable } from '../../database/entity/global.deploymentsQueue.entity.js';
import fs from 'node:fs';
import { Deployments_Table as DeploymentsTable } from '../../database/entity/global.deployments.entity.js';

/**
 * @interface QueueItem
 * @description Represents an item in the deployment queue.
 * This interface should ideally align with the structure returned by `queueService().list()`.
 * @property {number} id - The unique identifier of the queue item.
 * @property {object} deployment - Information about the deployment itself.
 * @property {string} deployment.plugin - The plugin associated with the deployment.
 * @property {number} id_deployment - The ID of the main deployment configuration.
 * @property {object} meta - Metadata associated with the queue item.
 * @property {string} meta.path - The file system path for the deployment.
 * @property {object} workflow - Information about the workflow being deployed.
 * @property {string} workflow.uid - The unique identifier of the workflow.
 */
interface QueueItem {
	id: number;
	deployment: {
		plugin: string;
	};
	id_deployment: number;
	meta: {
		path: string;
	};
	workflow: {
		uid: string;
	};
	// Add other properties of item if known (e.g., from includes in queueService list)
}

/**
 * @interface DeployListResult
 * @description Represents the expected result from `queueService().list()`.
 * @property {QueueItem[]} [deploys] - An optional array of deployment queue items.
 */
interface DeployListResult {
	deploys?: QueueItem[];
	// Add other properties if list() returns more than just deploys
}

/**
 * @async
 * @function queueDeploy
 * @description Processes items from the deployment queue that are ready for deployment (status 3).
 * It retrieves the corresponding deployment plugin, extracts properties, executes the deployment,
 * and updates the queue item status accordingly.
 * This function processes one item at a time due to early returns within the loop.
 * @returns {Promise<void>} A promise that resolves when the processing of an item is complete or no items are found.
 */
export async function queueDeploy(): Promise<void> {
	// Retrieve list of deployments with status 3 (ready for deployment)
	const listResult: DeployListResult | null = await queueService().list({ status: [3] });
	const deployClassMap = getDeploysClass(); // Map of available deployment plugin classes

	// Iterate over each deployment item fetched
	for (const item of listResult?.deploys || []) {
		try {
			const deployInfo = deployClassMap[item.deployment.plugin]; // Get the plugin class info

			// If the deployment plugin is not found, update status to error and exit for this item
			if (!deployInfo) {
				await DeploymentsQueueTable.update(
					{
						description: `No existe el plugin [${item.deployment.plugin}]`,
						id_status: 4, // Error status
					},
					{ where: { id: item.id } }
				);
				return; // Exit function, effectively processing one item from the list per call to queueDeploy
			}

			// Extract properties for the deployment from the main DeploymentsTable
			const deployProperties: { properties: Record<string, any> } | null = await DeploymentsTable.findOne({
				attributes: ['properties'],
				where: {
					id: item.id_deployment,
				},
			});

			// Instantiate the deployment class
			const classInstance: IDeploy = new (deployInfo.class as any)();

			// If properties were found, assign them to the class instance
			if (deployProperties) {
				for (const key of Object.keys(classInstance.properties)) {
					if (deployProperties.properties?.[key] !== undefined) {
						classInstance.properties[key].value = deployProperties.properties[key];
					}
				}
			}

			// Execute the deployment
			await classInstance.onExecute({
				context: {
					path: item.meta.path, // Filesystem path for deployment context
					flow: item.workflow.uid, // Workflow UID for context
				},
			});

			// Cleanup: Remove the deployment path
			fs.rmSync(item.meta.path, { recursive: true, force: true }); // Added force to avoid issues with non-existent paths if already cleaned.

			// Update queue item status to successful
			await DeploymentsQueueTable.update(
				{
					description: 'Despliegue exitoso',
					id_status: 7, // Success status
				},
				{ where: { id: item.id } }
			);
			return; // Exit function after successful deployment of an item
		} catch (error: unknown) {
			let message: string = 'Error during deployment execution'; // Default error message
			if (error instanceof Error) {
				message = error.toString();
			}

			// Attempt to cleanup deployment path even on error
			try {
				if (item?.meta?.path && fs.existsSync(item.meta.path)) { // Check if path exists before removing
					fs.rmSync(item.meta.path, { recursive: true, force: true });
				}
			} catch (cleanupError: unknown) {
				console.error(`Cleanup failed for item ${item.id} after error:`, cleanupError);
			}

			// Update queue item status to error
			await DeploymentsQueueTable.update(
				{
					description: message,
					id_status: 4, // Error status
				},
				{ where: { id: item.id } }
			);

			// Log the error for server-side monitoring
			console.error(`Error processing queue item ${item.id}:`, message);
			// The original code had 'throw error' which would stop the loop.
			// Current behavior with 'return' statements also processes one item per call.
			// If processing all items in the list despite errors is desired, remove returns and adjust error handling.
			// throw error; // Uncomment if the entire queueDeploy process should stop on any single item error.
		}
	}
}
