import type { IWorkflow } from '@shared/interface/workflow.interface.js';
import type { Includeable, Order } from 'sequelize';
import type { Express } from 'express';
import type { ISocket } from '@shared/interface/socket.interface.js';
import { Deployments_Table as DeploymentsTable } from '../../database/entity/global.deployments.entity.js';
import { DeploymentsQueue_Table as DeploymentsQueueTable } from '../../database/entity/global.deploymentsQueue.entity.js';
import { Status_Table as StatusTable } from '../../database/entity/global.status.entity.js';
import { ProjectsTable } from '../../database/entity/projects.projects.entity.js';
import { Users_Table as UsersTable } from '../../database/entity/security.users.entity.js';
import { WorkflowsFlowTable } from '../../database/entity/workflows.flows.entity.js';
// import { WorkflowsHistoryTable } from '../../database/entity/workflows.history.entity.js'; // Not used in this file
import { queueProcess } from './queue.process.service.js';
import { queueDeploy } from './queue.deploy.service.js';
import { workflowsService } from '../workflows.service.js';

/**
 * @interface NewParams
 * @description Parameters for creating a new item in the deployment queue.
 * @property {ISocket} socket - The socket instance of the user initiating the request.
 * @property {Express} app - The Express application instance.
 * @property {string} uid - The unique identifier of the workflow to be deployed.
 * @property {IWorkflow['properties']} properties - Properties of the workflow.
 */
interface NewParams {
	socket: ISocket;
	app: Express;
	uid: string;
	properties: IWorkflow['properties'];
}

/**
 * @interface NewResult
 * @description Result of the new queue item operation.
 * @property {string} [msg] - Success message.
 * @property {string} [error] - Error message, if any.
 */
interface NewResult {
	msg?: string;
	error?: string;
}

/**
 * @interface ListParams
 * @description Parameters for listing queue items.
 * @property {number[]} [status] - Optional array of status IDs to filter the list.
 */
interface ListParams {
	status?: number[];
}

/**
 * @export
 * @interface QueueServiceListResultItem
 * @description Defines the structure of an item returned by the queue listing operation.
 * It includes details about the queued deployment, its associated workflow, project, status, and user.
 * @property {number} id - The ID of the queue item.
 * @property {number} id_status - The status ID of the queue item.
 * @property {object} workflow - Details of the associated workflow.
 * @property {string} workflow.uid - UID of the workflow.
 * @property {string} workflow.name - Name of the workflow.
 * @property {string} workflow.description - Description of the workflow.
 * @property {number} workflow.id_status - Status ID of the workflow.
 * @property {object} workflow.project - Details of the project the workflow belongs to.
 * @property {string} workflow.project.name - Name of the project.
 * @property {string} workflow.project.description - Description of the project.
 * @property {object} deployment - Details of the deployment configuration.
 * @property {number} deployment.id - ID of the deployment configuration.
 * @property {string} deployment.name - Name of the deployment configuration.
 * @property {string} deployment.description - Description of the deployment configuration.
 * @property {string} deployment.plugin - Plugin used for the deployment.
 * @property {number} deployment.id_status - Status ID of the deployment configuration.
 * @property {object} status - Details of the current status of the queue item.
 * @property {string} status.name - Name of the status (e.g., "Pending", "Processing").
 * @property {object} user - Details of the user who created the queue item.
 * @property {string} user.username - Username of the user.
 * @property {IWorkflow} [flow] - The full workflow definition, as used in `queue.process.service.ts`.
 * @property {any} [key] - Allows for other properties.
 */
export interface QueueServiceListResultItem {
	id: number;
	id_status: number;
	workflow: {
		uid: string;
		name: string;
		description: string;
		id_status: number;
		project: {
			name: string;
			description: string;
		};
	};
	deployment: {
		id: number;
		name: string;
		description: string;
		plugin: string;
		id_status: number;
	};
	status: {
		name: string;
	};
	user: {
		username: string;
	};
	flow?: IWorkflow;
	[key: string]: any;
}

/**
 * @interface ListResult
 * @description Result of the list queue items operation.
 * @property {QueueServiceListResultItem[]} [deploys] - Array of queue items.
 * @property {string} [error] - Error message, if any.
 */
interface ListResult {
	deploys?: QueueServiceListResultItem[];
	error?: string;
}

/**
 * @interface DashboardParams
 * @description Parameters for fetching dashboard data for the queue.
 * @property {number[]} [status] - Optional array of status IDs to filter dashboard stats.
 */
interface DashboardParams {
	status?: number[];
}

/**
 * @interface DeployStats
 * @description Statistics for deployments in the queue.
 * @property {number} total - Total number of deployments matching the criteria.
 * @property {number} successful - Number of successful deployments.
 * @property {number} failed - Number of failed deployments.
 * @property {number} pending - Number of pending deployments (includes processing and queued).
 */
interface DeployStats {
	total: number;
	successful: number;
	failed: number;
	pending: number;
}

/**
 * @interface DashboardResult
 * @description Result of the dashboard data operation.
 * @property {DeployStats} [stats] - Deployment statistics.
 * @property {QueueServiceListResultItem[]} [deploys] - Array of recent deployments for the dashboard.
 * @property {string} [error] - Error message, if any.
 */
interface DashboardResult {
	stats?: DeployStats;
	deploys?: QueueServiceListResultItem[];
	error?: string;
}

/**
 * @export
 * @interface QueueService
 * @description Defines the contract for the queue service.
 * This service manages the deployment queue, allowing items to be added, listed, and processed.
 * @property {(params: NewParams) => Promise<NewResult>} new - Adds a new item to the deployment queue.
 * @property {(params?: ListParams) => Promise<ListResult>} list - Lists items in the deployment queue.
 * @property {(params?: DashboardParams) => Promise<DashboardResult>} dashboard - Retrieves data for the deployment queue dashboard.
 * @property {() => Promise<void>} init - Initializes the queue processing mechanism.
 */
export interface QueueService {
	new: (params: NewParams) => Promise<NewResult>;
	list: (params?: ListParams) => Promise<ListResult>;
	dashboard: (params?: DashboardParams) => Promise<DashboardResult>;
	init: () => Promise<void>;
}

/**
 * @function queueService
 * @description Factory function for the Queue Service.
 * Provides methods to manage and interact with the deployment queue.
 * @returns {QueueService} An instance of the Queue Service.
 */
export function queueService(): QueueService {
	return {
		/**
		 * @function new
		 * @description Adds a new deployment task to the queue.
		 * It first validates the workflow and then creates an entry in the DeploymentsQueueTable.
		 * @param {NewParams} params - Parameters for the new queue item.
		 * @returns {Promise<NewResult>} A promise that resolves with a success message or an error.
		 */
		new: async ({ socket, app, uid, properties }: NewParams): Promise<NewResult> => {
			try {
				// Find the workflow to ensure it exists and is properly configured for deployment.
				const workflow = await WorkflowsFlowTable.findOne({
					include: [
						{
							model: DeploymentsTable,
							required: false,
							where: { id_status: 1 }, // Ensure the associated deployment config is active
						},
					],
					where: { uid },
				});

				// Validations for the workflow and its deployment configuration
				if (!workflow) return { error: 'No se encontró el flujo de trabajo' };
				if (!workflow.id_deploy) {
					return { error: 'El flujo de trabajo no está asociado a un despliegue' };
				}
				if (!workflow.deployment) {
					return { error: 'No se encontró la configuración de despliegue asociada al flujo' };
				}

				// Save current state of workflow before queuing (if applicable)
				await workflowsService().save({ app, uid, properties });

				// Create the queue entry
				await DeploymentsQueueTable.create({
					id_deployment: workflow.id_deploy,
					id_flow: workflow.id,
					flow: workflow.flow, // Store the workflow definition at the time of queuing
					description: '', // Initial description, can be updated by processing steps
					id_status: 1, // Initial status: pending
					created_by: socket.session.id, // Track user who initiated
				});

				return { msg: 'Despliegue en cola' };
			} catch (error: unknown) {
				let message = 'Error adding deployment to queue';
				if (error instanceof Error) message = error.toString();
				return { error: message };
			}
		},
		/**
		 * @function list
		 * @description Lists items from the deployment queue, optionally filtered by status.
		 * Includes details from related tables like Workflows, Projects, Status, and Users.
		 * @param {ListParams} [params={}] - Parameters for listing, primarily status filter.
		 * @returns {Promise<ListResult>} A promise that resolves with the list of queue items or an error.
		 */
		list: async ({ status }: ListParams = {}): Promise<ListResult> => {
			const order: Order = [['id', 'ASC']]; // Default order
			try {
				const include: Includeable[] = [ // Define associations to include
					{
						attributes: ['uid', 'name', 'description', 'id_status'],
						model: WorkflowsFlowTable,
						required: true,
						include: [
							{
								attributes: ['name', 'description'],
								model: ProjectsTable,
								required: true,
							},
						],
					},
					{
						attributes: ['id', 'name', 'description', 'plugin', 'id_status'],
						model: DeploymentsTable,
						required: true,
					},
					{
						model: StatusTable, // For the status of the queue item itself
						required: true,
					},
					{
						model: UsersTable, // For the user who created the queue item
						required: true,
					},
				];
				const deploys = await DeploymentsQueueTable.findAll({
					include,
					where: status ? { id_status: status } : {}, // Apply status filter if provided
					order,
				});
				// The 'as any as QueueServiceListResultItem[]' cast assumes direct compatibility.
				// For robust typing, map 'deploys' to 'QueueServiceListResultItem[]' explicitly.
				return { deploys: deploys as any as QueueServiceListResultItem[] };
			} catch (error: unknown) {
				let message = 'Error listing queue items';
				if (error instanceof Error) message = error.toString();
				return { error: message };
			}
		},
		/**
		 * @function dashboard
		 * @description Retrieves aggregated data and recent items for the deployment queue dashboard.
		 * @param {DashboardParams} [params={}] - Parameters for filtering dashboard data, primarily status.
		 * @returns {Promise<DashboardResult>} A promise that resolves with dashboard data or an error.
		 */
		dashboard: async ({ status }: DashboardParams = {}): Promise<DashboardResult> => {
			try {
				// Default statuses for dashboard: pending, processing, error, queued, success
				const defaultStatus = status || [1, 3, 4, 6, 7];

				// Fetch all queue items matching the statuses for statistics calculation
				const deployStatsModels = await DeploymentsQueueTable.findAll({
					include: [{ model: StatusTable, required: true }],
					where: { id_status: defaultStatus },
				});

				// Calculate statistics based on fetched items
				const stats: DeployStats = {
					total: deployStatsModels.length,
					successful: deployStatsModels.filter((d: any) => d.id_status === 7).length, // Status 7 = success
					failed: deployStatsModels.filter((d: any) => d.id_status === 4).length,     // Status 4 = error
					pending: deployStatsModels.filter((d: any) => [1, 3, 6].includes(d.id_status)).length, // Status 1,3,6 = pending/processing/queued
				};

				// Fetch the 10 most recent deployments for the dashboard list
				const recentDeploysModels = await DeploymentsQueueTable.findAll({
					include: [
						{
							attributes: ['uid', 'name', 'description'],
							model: WorkflowsFlowTable,
							required: true,
							include: [{ attributes: ['name'], model: ProjectsTable, required: true }],
						},
						{ model: StatusTable, required: true },
					],
					where: { id_status: defaultStatus },
					order: [['id', 'DESC']], // Most recent first
					limit: 10,
				});

				return {
					stats,
					deploys: recentDeploysModels as any as QueueServiceListResultItem[], // Cast assuming compatibility
				};
			} catch (error: unknown) {
				let message = 'Error fetching dashboard data';
				if (error instanceof Error) message = error.toString();
				return { error: message };
			}
		},
		/**
		 * @function init
		 * @description Initializes the deployment queue processing.
		 * It finds pending items (status 1), updates them to queued (status 6),
		 * then triggers the file processing step (`queueProcess`) and the deployment step (`queueDeploy`).
		 * This function is typically called periodically or at application startup.
		 * @returns {Promise<void>} A promise that resolves when the initialization steps are complete.
		 */
		init: async (): Promise<void> => {
			try {
				// Find deployments with status 1 (pending)
				const listResult = await queueService().list({ status: [1] });
				const idsToUpdate = listResult?.deploys?.map((f) => f.id) || [];

				// If there are pending items, update their status to 6 (queued for processing)
				if (idsToUpdate.length > 0) {
					await DeploymentsQueueTable.update(
						{ id_status: 6 },
						{ where: { id: idsToUpdate } }
					);
				}

				// Trigger the file processing step for queued items
				await queueProcess();

				// Trigger the deployment step for items ready to be deployed
				await queueDeploy();
			} catch (error: unknown) {
				// Log errors during initialization as this is a background process
				console.error("Error during queue initialization:", error);
			}
		},
	};
}
