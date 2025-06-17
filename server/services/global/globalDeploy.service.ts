import { Deployments_Table as DeploymentsTable } from '../../database/entity/global.deployments.entity.js';
import { Status_Table as StatusTable } from '../../database/entity/global.status.entity.js';
import { Users_Table as UsersTable } from '../../database/entity/security.users.entity.js';
import { queueService, QueueService } from './queue.service.js'; // Assuming QueueService is exported from queue.service.ts

/**
 * @interface SaveParams
 * @description Parameters for saving a new deployment.
 * @property {string} name - The name of the deployment.
 * @property {string} description - A description for the deployment.
 * @property {string} plugin - The plugin associated with the deployment.
 * @property {string} pluginName - The display name of the plugin.
 * @property {object} properties - Configuration properties for the deployment. Consider defining a more specific type.
 */
interface SaveParams {
	name: string;
	description: string;
	plugin: string;
	pluginName: string;
	properties: object;
}

/**
 * @interface ValidNameParams
 * @description Parameters for validating a deployment name.
 * @property {string} name - The name to validate.
 */
interface ValidNameParams {
	name: string;
}

/**
 * @interface DeleteParams
 * @description Parameters for deleting a deployment.
 * @property {number} id - The ID of the deployment to delete.
 */
interface DeleteParams {
	id: number;
}

/**
 * @interface DeployResult
 * @description Represents the result of a deployment operation.
 * @property {string} [save] - Success message for save operations.
 * @property {string} [error] - Error message if an operation failed.
 * @property {boolean} [valid] - True if a name validation was successful.
 * @property {any[]} [deploys] - Array of deployment records. Consider defining a specific type for these records.
 * @property {string} [msg] - General message, typically for delete operations.
 */
interface DeployResult {
	save?: string;
	error?: string;
	valid?: boolean;
	deploys?: any[]; // TODO: Define a specific type for deployment records
	msg?: string;
}

/**
 * @interface GlobalDeployService
 * @description Defines the contract for the global deployment service.
 * This service handles operations related to global deployments, such as creating, listing, and managing them.
 * @property {(params: SaveParams) => Promise<DeployResult>} save - Saves a new deployment.
 * @property {(params: ValidNameParams) => Promise<DeployResult>} validName - Validates if a deployment name is unique.
 * @property {() => Promise<DeployResult>} list - Lists all active deployments.
 * @property {(params: DeleteParams) => Promise<DeployResult>} delete - Marks a deployment as inactive.
 * @property {QueueService} queue - Access to the queue service for deployment queuing.
 */
export interface GlobalDeployService {
	save: (params: SaveParams) => Promise<DeployResult>;
	validName: (params: ValidNameParams) => Promise<DeployResult>;
	list: () => Promise<DeployResult>;
	delete: (params: DeleteParams) => Promise<DeployResult>;
	queue: QueueService;
}

/**
 * @function globalDeployService
 * @description Factory function for the Global Deploy Service.
 * Provides methods to manage global deployments.
 * @returns {GlobalDeployService} An instance of the Global Deploy Service.
 */
export function globalDeployService(): GlobalDeployService {
	return {
		/**
		 * @function save
		 * @description Saves a new deployment configuration to the database.
		 * @param {SaveParams} params - The parameters for the new deployment.
		 * @returns {Promise<DeployResult>} A promise that resolves with a success message or an error.
		 */
		save: async ({
			name,
			description,
			plugin,
			pluginName,
			properties,
		}: SaveParams): Promise<DeployResult> => {
			try {
				await DeploymentsTable.create({
					name,
					description,
					plugin_name: pluginName, // Database column uses snake_case
					plugin,
					properties,
					created_by: 1, // TODO: Replace with actual user ID from session or context
				});
				return { save: 'Despliegue creado exitosamente' };
			} catch (error: unknown) {
				let message = 'Error saving deployment'; // More specific default error
				if (error instanceof Error) message = error.toString();
				return { error: message };
			}
		},
		/**
		 * @function validName
		 * @description Checks if a given deployment name already exists for an active deployment.
		 * @param {ValidNameParams} params - The parameters containing the name to validate.
		 * @returns {Promise<DeployResult>} A promise that resolves with a validation status or an error.
		 */
		validName: async ({ name }: ValidNameParams): Promise<DeployResult> => {
			try {
				const existingDeploy = await DeploymentsTable.findOne({
					where: {
						name,
						id_status: 1, // Check only active deployments
					},
				});
				if (existingDeploy) {
					return { error: 'Ya existe una despliegue con el mismo nombre' };
				}
				return { valid: true };
			} catch (error: unknown) {
				let message = 'Error validating deployment name';
				if (error instanceof Error) message = error.toString();
				return { error: message };
			}
		},
		/**
		 * @function list
		 * @description Retrieves a list of all active deployments, including related status and user information.
		 * @returns {Promise<DeployResult>} A promise that resolves with the list of deployments or an error.
		 */
		list: async (): Promise<DeployResult> => {
			try {
				const deploys = await DeploymentsTable.findAll({
					include: [
						{
							model: StatusTable,
							required: true,
						},
						{
							model: UsersTable,
							required: true,
						},
					],
					where: {
						id_status: 1, // Only active deployments
					},
					order: [['name', 'ASC']],
				});
				return { deploys }; // TODO: Map 'deploys' to a more specific type than any[]
			} catch (error: unknown) {
				let message = 'Error listing deployments';
				if (error instanceof Error) message = error.toString();
				return { error: message };
			}
		},
		/**
		 * @function delete
		 * @description Marks a deployment as inactive (soft delete).
		 * @param {DeleteParams} params - The parameters containing the ID of the deployment to delete.
		 * @returns {Promise<DeployResult>} A promise that resolves with a success message or an error.
		 */
		delete: async ({ id }: DeleteParams): Promise<DeployResult> => {
			try {
				// TODO: Check if deployment is in use or has active queue items before deleting
				await DeploymentsTable.update(
					{
						id_status: 2, // Assuming 2 means inactive/deleted
					},
					{ where: { id, id_status: 1 } } // Ensure we only "delete" active ones
				);
				return { msg: 'Despliegue eliminado exitosamente' };
			} catch (error: unknown) {
				let message = 'Error deleting deployment';
				if (error instanceof Error) message = error.toString();
				return { error: message };
			}
		},
		// Provides access to queue-related deployment operations
		queue: queueService,
	};
}
