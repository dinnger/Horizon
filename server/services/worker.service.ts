import type { Express } from 'express';
import type { ICustomWorker } from '../modules/worker.module.js';
import { closeWorker, initWorker } from '../modules/worker.module.js';
import envs from '../../shared/utils/envs.js';
import { workflowsService, WorkflowBasicInfo } from './workflows.service.js';

/**
 * @export
 * @interface IWorker
 * @description Represents the state and metadata of an active worker process.
 * @property {number} port - The port on which the worker is running.
 * @property {number} idFlow - The ID of the flow associated with this worker.
 * @property {string} nameFlow - The name of the flow.
 * @property {string} uidFlow - The unique ID of the flow.
 * @property {ICustomWorker} worker - The actual worker instance (custom type).
 * @property {boolean} active - Indicates if the worker is currently active.
 */
export interface IWorker {
	port: number;
	idFlow: number;
	nameFlow: string;
	uidFlow: string;
	worker: ICustomWorker;
	active: boolean;
}

// Starting port number for workers, initialized from environment variables.
let currentPort: number = envs.WORKER_INIT_PORT;

/**
 * @export
 * @const workersList
 * @description A Map to store and manage active worker instances.
 * The key is the normalized (lowercase, trimmed) UID of the flow, and the value is the IWorker object.
 */
export const workersList = new Map<string, IWorker>();

/**
 * @interface WorkerServiceParams
 * @description Parameters for the `workerService` factory function.
 * @property {Express | null} app - The Express application instance, can be null if not available.
 */
interface WorkerServiceParams {
	app: Express | null;
}

/**
 * @interface UidFlowParams
 * @description Standard parameter structure for methods that operate on a flow UID.
 * @property {string} uidFlow - The unique identifier of the flow.
 */
interface UidFlowParams {
	uidFlow: string;
}

/**
 * @interface WorkerOperationResult
 * @description Standard result for worker operations that might return a message or an error.
 * @property {string} [msg] - Success message.
 * @property {string} [error] - Error message, if any.
 */
interface WorkerOperationResult {
	msg?: string;
	error?: string;
}


/**
 * @export
 * @interface WorkerService
 * @description Defines the contract for the Worker Service.
 * This service manages the lifecycle (init, close, restart) and interaction (get, getNode) with worker processes.
 */
export interface WorkerService {
	/** Initializes a new worker for a given flow UID, or returns an existing active one. */
	init: (params: UidFlowParams) => Promise<IWorker | null | WorkerOperationResult>;
	/** Closes an active worker for a given flow UID. */
	close: (params: UidFlowParams) => Promise<WorkerOperationResult>;
	/** Restarts a worker for a given flow UID (closes then initializes). */
	restart: (params: UidFlowParams) => Promise<IWorker | null | WorkerOperationResult>;
	/** Retrieves general information from an active worker. */
	get: (uidFlow: string) => Promise<any | null>; // TODO: Define specific return type for worker data
	/** Retrieves information about a specific node from an active worker. */
	getNode: (uidFlow: string, node: string) => Promise<any | null>; // TODO: Define specific return type for node data
}

/**
 * @function workerService
 * @description Factory function for the Worker Service.
 * Provides methods to initialize, manage, and interact with worker processes for workflows.
 * @param {WorkerServiceParams} params - Parameters for the worker service, primarily the Express app instance.
 * @returns {WorkerService} An instance of the Worker Service.
 */
export function workerService({ app }: WorkerServiceParams): WorkerService {
	return {
		/**
		 * @async
		 * @function init
		 * @description Initializes a worker for the specified flow UID.
		 * If an active worker already exists for this flow, it's returned.
		 * Otherwise, a new worker is initialized on an available port.
		 * @param {UidFlowParams} params - Contains the uidFlow for the worker.
		 * @returns {Promise<IWorker | null | WorkerOperationResult>} The worker instance, null, or an error object.
		 */
		init: async ({ uidFlow }: UidFlowParams): Promise<IWorker | null | WorkerOperationResult> => {
			const normalizedUidFlow = uidFlow.toLocaleLowerCase().trim();
			const existingWorker = workersList.get(normalizedUidFlow);

			// If an active worker already exists, return it
			if (existingWorker?.active) return existingWorker;
			// If the Express app instance is not available, cannot initialize new worker
			if (!app) return { error: 'Application not available, cannot initialize worker.' };

			// Fetch flow details using the workflowsService
			const flowDataResult = await workflowsService().get({ uidFlow });

			// Handle potential error from workflowsService or if flow data is not as expected
			if (flowDataResult && 'error' in flowDataResult && typeof flowDataResult.error === 'string') {
				return { error: flowDataResult.error };
			}
			const flows = flowDataResult as WorkflowBasicInfo[]; // Assuming result is WorkflowBasicInfo[]

			if (!flows || flows.length === 0) return { error: `Flow with UID '${uidFlow}' not found.` };
			const flow: WorkflowBasicInfo = flows[0]; // Take the first flow found (should be unique by UID)

			const workerExists = !!existingWorker; // Check if worker entry exists, even if not active
			// Assign a new port if it's a new worker, otherwise reuse existing port
			currentPort = !workerExists ? currentPort + 1 : existingWorker.port;

			try {
				// Initialize the actual worker process
				const workerProcess = await initWorker({
					app,
					flow: uidFlow,
					port: currentPort,
					workerExist: workerExists,
					workersList, // Pass the list for the worker module to potentially manage/update
				});

				// Store worker data
				const workerData: IWorker = {
					port: currentPort,
					idFlow: flow.id,
					nameFlow: flow.name,
					uidFlow,
					worker: workerProcess,
					active: true,
				};
				workersList.set(normalizedUidFlow, workerData);
				return workerData;
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : 'Failed to initialize worker process';
				// If it was a new worker attempt, decrement port to allow its reuse for next attempt
				if(!workerExists) currentPort--;
				return { error: message };
			}
		},
		/**
		 * @async
		 * @function close
		 * @description Closes an active worker for the specified flow UID.
		 * @param {UidFlowParams} params - Contains the uidFlow of the worker to close.
		 * @returns {Promise<WorkerOperationResult>} Result of the close operation.
		 */
		close: async ({ uidFlow }: UidFlowParams): Promise<WorkerOperationResult> => {
			const normalizedUidFlow = uidFlow.toLocaleLowerCase().trim();
			const worker = workersList.get(normalizedUidFlow);

			if (!worker) {
				return { error: 'No existe un worker con ese UID.' }; // More specific error
			}
			if (!worker.active) {
				return { error: 'Worker no activo.' }; // Already inactive
			}

			try {
				await closeWorker({
					port: worker.port,
					workerProcess: worker.worker,
				});
				worker.active = false; // Update state in the map
				return { msg: 'Worker cerrado exitosamente.' };
			} catch (error: unknown) {
				console.error(`Error closing worker ${uidFlow}:`, error);
				const message = error instanceof Error ? error.message : 'Unknown error during worker close';
				// Even if closeWorker fails, we mark it as inactive as its state is uncertain.
				if (worker) worker.active = false;
				return { error: message };
			}
		},
		/**
		 * @async
		 * @function restart
		 * @description Restarts a worker for the specified flow UID.
		 * This involves closing the existing worker (if active) and then initializing a new one.
		 * @param {UidFlowParams} params - Contains the uidFlow of the worker to restart.
		 * @returns {Promise<IWorker | null | WorkerOperationResult>} The new worker instance, null, or an error object.
		 */
		restart: async ({ uidFlow }: UidFlowParams): Promise<IWorker | null | WorkerOperationResult> => {
			try {
				// Attempt to close the worker first.
				// Pass the current `app` context to the nested `workerService` call.
				const closeResult = await workerService({ app }).close({ uidFlow });

				// Check if closing failed for a critical reason (not just "not found" or "not active")
				if (closeResult?.error && !closeResult.error.includes("No existe un worker") && !closeResult.error.includes("Worker no activo") ) {
					return { error: `Failed to stop worker for restart: ${closeResult.error}` };
				}
				// Proceed to initialize the worker again.
				return await workerService({ app }).init({ uidFlow });
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : 'Unknown error during worker restart';
				return { error: message };
			}
		},
		/**
		 * @async
		 * @function get
		 * @description Retrieves general information data from an active worker.
		 * @param {string} uidFlow - The UID of the flow whose worker data is requested.
		 * @returns {Promise<any | null>} Data from the worker, or null if worker not found or inactive.
		 * @todo Define a specific return type for worker data instead of `any`.
		 */
		get: async (uidFlow: string): Promise<any | null> => {
			const worker = workersList.get(uidFlow.toLocaleLowerCase().trim());
			if (!worker || !worker.active) return null;
			return worker.worker.getDataWorker({ type: 'infoWorkflow' });
		},
		/**
		 * @async
		 * @function getNode
		 * @description Retrieves information about a specific node from an active worker.
		 * @param {string} uidFlow - The UID of the flow.
		 * @param {string} node - The ID or identifier of the node.
		 * @returns {Promise<any | null>} Node-specific data from the worker, or null if worker not found or inactive.
		 * @todo Define a specific return type for node data instead of `any`.
		 */
		getNode: async (uidFlow: string, node: string): Promise<any | null> => {
			const worker = workersList.get(uidFlow.toLocaleLowerCase().trim());
			if (!worker || !worker.active) return null;
			return worker.worker.getDataWorker({ type: 'infoWorkflow', data: { node } });
		},
	};
}
