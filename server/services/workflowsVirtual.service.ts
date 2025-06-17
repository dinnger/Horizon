import type { INode, INodeConnections } from '@shared/interface/node.interface.js';
import type { ICommunicationTypes } from '@shared/interface/connect.interface.js';
import type { IWorkflow } from '@shared/interface/workflow.interface.js';
import type { IPropertiesType } from '@shared/interface/node.properties.interface.js';
import { workersList } from './worker.service.js';

/**
 * @interface VirtualWorkflowOpResult
 * @description Defines the typical result structure for virtual workflow operations,
 * which usually involve some changes communicated back or an error.
 * @property {any} [changes] - The changes resulting from the operation. Type `any` due to variability.
 *                             Consider defining more specific types if the structure of `changes` is consistent for certain operations.
 * @property {string} [error] - Error message if the operation failed.
 */
interface VirtualWorkflowOpResult {
	changes?: any;
	error?: string;
}

/**
 * @typedef DirectDataResult
 * @description Represents operations that might return data directly or an error object.
 * Type `any` is used for data due to variability based on the operation.
 * Consider defining more specific types if the structure of returned data is consistent.
 */
type DirectDataResult = any | { error: string };

// Parameter Interfaces for each method in VirtualWorkflowService

/** @interface PropertyParams @description Parameters for setting workflow properties. */
interface PropertyParams {
	flow: string; // UID of the flow
	properties: IWorkflow['properties']; // The properties to set
}

/** @interface ActionsParams @description Parameters for performing generic actions on a node. */
interface ActionsParams {
	type: ICommunicationTypes; // Type of communication or action
	flow: string; // UID of the flow
	node: INode; // The node to act upon
}

/** @interface NodeAddParams @description Parameters for adding a node to the virtual workflow. */
interface NodeAddParams {
	flow: string; // UID of the flow
	node: INode; // The node to add
}

/** @interface NodeRemoveParams @description Parameters for removing a node from the virtual workflow. */
interface NodeRemoveParams {
	flow: string; // UID of the flow
	node: INode; // The node to remove (primarily its ID is used)
}

/** @interface NodeUpdateParams @description Parameters for updating a node in the virtual workflow. */
interface NodeUpdateParams {
	flow: string; // UID of the flow
	type: ICommunicationTypes; // Type of update/communication message for the worker
	data: any; // Data for the update operation
}

/** @interface NodePropertyParams @description Parameters for updating a specific property of a node. */
interface NodePropertyParams {
	flow: string; // UID of the flow
	node: { id: string; type: string }; // Simplified info of the node to update
	key: string; // The property key to update
	value: IPropertiesType; // The new value for the property
}

/** @interface ActionParams @description Parameters for triggering a specific action on a node. */
interface ActionParams {
	flow: string; // UID of the flow
	node: { id: string; type: string }; // Simplified info of the node
	action: string; // The action to trigger
	event: any; // Event data associated with the action
}

/** @interface ConnectionAddParams @description Parameters for adding a connection to the virtual workflow. */
interface ConnectionAddParams {
	flow: string; // UID of the flow
	data: INodeConnections; // The connection data to add
}

/** @interface ConnectionRemoveParams @description Parameters for removing a connection from the virtual workflow. */
interface ConnectionRemoveParams {
	flow: string; // UID of the flow
	id: string; // The ID of the connection to remove
}

/**
 * @export
 * @interface VirtualWorkflowService
 * @description Defines the contract for the Virtual Workflow Service.
 * This service allows interaction with the live state of a workflow running in a worker process.
 * Operations include modifying properties, adding/removing nodes and connections, and triggering actions.
 */
export interface VirtualWorkflowService {
	/** Sets or updates properties for the entire workflow. */
	property: (params: PropertyParams) => Promise<VirtualWorkflowOpResult>;
	/** Performs a generic action related to a node, specified by `type`. */
	actions: (params: ActionsParams) => Promise<VirtualWorkflowOpResult>;
	/** Adds a new node to the virtual workflow. */
	nodeAdd: (params: NodeAddParams) => Promise<VirtualWorkflowOpResult>;
	/** Removes a node from the virtual workflow. */
	nodeRemove: (params: NodeRemoveParams) => Promise<VirtualWorkflowOpResult>;
	/** Updates an existing node in the virtual workflow. */
	nodeUpdate: (params: NodeUpdateParams) => Promise<VirtualWorkflowOpResult>;
	/** Updates a specific property of a node. Returns data directly. */
	nodeProperty: (params: NodePropertyParams) => Promise<DirectDataResult>;
	/** Triggers a specific action on a node. Returns data directly. */
	action: (params: ActionParams) => Promise<DirectDataResult>;
	/** Adds a connection between nodes in the virtual workflow. */
	connectionAdd: (params: ConnectionAddParams) => Promise<VirtualWorkflowOpResult>;
	/** Removes a connection from the virtual workflow. */
	connectionRemove: (params: ConnectionRemoveParams) => Promise<VirtualWorkflowOpResult>;
}

/**
 * @function virtualWorkflowService
 * @description Factory function for the Virtual Workflow Service.
 * Provides methods to interact with and modify the state of a workflow running in a worker process.
 * @returns {VirtualWorkflowService} An instance of the Virtual Workflow Service.
 */
export function virtualWorkflowService(): VirtualWorkflowService {
	/**
	 * @private
	 * @function getWorker
	 * @description Helper function to retrieve an active worker instance from the `workersList`.
	 * @param {string} flow - The UID of the flow.
	 * @returns {IWorker | null} The worker instance if found and active, otherwise null.
	 */
	const getWorker = (flow: string) => {
		if (!flow) return null; // Basic validation
		// Normalize flow UID for consistent map key access
		return workersList.get(flow.toLocaleLowerCase().trim()) || null;
	};

	return {
		/**
		 * @async
		 * @function property
		 * @description Updates properties for the entire specified workflow.
		 * @param {PropertyParams} params - Parameters containing the flow UID and properties to set.
		 * @returns {Promise<VirtualWorkflowOpResult>} A promise resolving with changes or an error.
		 */
		property: async (params: PropertyParams): Promise<VirtualWorkflowOpResult> => {
			const worker = getWorker(params.flow);
			if (!worker) return { error: 'Worker not found for the specified flow' };
			// Send message to worker to update workflow properties
			const changes = await worker.worker.getDataWorker({
				type: 'propertyWorkflow',
				data: { properties: params.properties },
			});
			return { changes };
		},
		/**
		 * @async
		 * @function actions
		 * @description Performs a generic action on a node within the specified workflow.
		 * @param {ActionsParams} params - Parameters including action type, flow UID, and node data.
		 * @returns {Promise<VirtualWorkflowOpResult>} A promise resolving with changes or an error.
		 */
		actions: async (params: ActionsParams): Promise<VirtualWorkflowOpResult> => {
			const worker = getWorker(params.flow);
			if (!worker) return { error: 'Worker not found for the specified flow' };
			// Send message to worker to perform an action
			const changes = await worker.worker.getDataWorker({
				type: params.type,
				data: { node: params.node },
			});
			return { changes };
		},
		/**
		 * @async
		 * @function nodeAdd
		 * @description Adds a new node to the specified virtual workflow.
		 * @param {NodeAddParams} params - Parameters containing the flow UID and the node to add.
		 * @returns {Promise<VirtualWorkflowOpResult>} A promise resolving with changes or an error.
		 */
		nodeAdd: async (params: NodeAddParams): Promise<VirtualWorkflowOpResult> => {
			const worker = getWorker(params.flow);
			if (!worker) return { error: 'Worker not found for the specified flow' };
			const changes = await worker.worker.getDataWorker({
				type: 'virtualAddNode',
				data: { node: params.node },
			});
			return { changes };
		},
		/**
		 * @async
		 * @function nodeRemove
		 * @description Removes a node from the specified virtual workflow.
		 * @param {NodeRemoveParams} params - Parameters containing the flow UID and the node to remove (ID is used).
		 * @returns {Promise<VirtualWorkflowOpResult>} A promise resolving with changes or an error.
		 */
		nodeRemove: async (params: NodeRemoveParams): Promise<VirtualWorkflowOpResult> => {
			const worker = getWorker(params.flow);
			if (!worker) return { error: 'Worker not found for the specified flow' };
			const changes = await worker.worker.getDataWorker({
				type: 'virtualRemoveNode',
				data: { idNode: params.node.id }, // Worker expects idNode for removal
			});
			return { changes };
		},
		/**
		 * @async
		 * @function nodeUpdate
		 * @description Sends an update message for a node in the specified workflow.
		 * The `type` parameter dictates the kind of update message sent to the worker.
		 * @param {NodeUpdateParams} params - Parameters for the node update.
		 * @returns {Promise<VirtualWorkflowOpResult>} A promise resolving with changes or an error.
		 */
		nodeUpdate: async (params: NodeUpdateParams): Promise<VirtualWorkflowOpResult> => {
			const worker = getWorker(params.flow);
			if (!worker) return { error: 'Worker not found for the specified flow' };
			// The message to the worker includes the `type` as part of its `data` payload
			const changes = await worker.worker.getDataWorker({
				type: params.type, // This is the overall message type for `getDataWorker`
				data: { type: params.type, ...params.data }, // This is the payload sent to the worker's specific handler
			});
			return { changes };
		},
		/**
		 * @async
		 * @function nodeProperty
		 * @description Updates a specific property of a node in the virtual workflow.
		 * @param {NodePropertyParams} params - Parameters for updating the node property.
		 * @returns {Promise<DirectDataResult>} A promise resolving with the direct result from the worker or an error.
		 */
		nodeProperty: async (params: NodePropertyParams): Promise<DirectDataResult> => {
			const worker = getWorker(params.flow);
			if (!worker) return { error: 'Worker not found for the specified flow' };
			// This method returns data directly from the worker, not wrapped in {changes: ...}
			return worker.worker.getDataWorker({
				type: 'virtualChangeProperties',
				data: { node: params.node, key: params.key, value: params.value },
			});
		},
		/**
		 * @async
		 * @function action
		 * @description Triggers a specific named action on a node within the virtual workflow.
		 * @param {ActionParams} params - Parameters for the node action.
		 * @returns {Promise<DirectDataResult>} A promise resolving with the direct result from the worker or an error.
		 */
		action: async (params: ActionParams): Promise<DirectDataResult> => {
			const worker = getWorker(params.flow);
			if (!worker) return { error: 'Worker not found for the specified flow' };
			// This method also returns data directly
			return worker.worker.getDataWorker({
				type: 'actionNode',
				data: { node: params.node, action: params.action, event: params.event },
			});
		},
		/**
		 * @async
		 * @function connectionAdd
		 * @description Adds a connection between nodes in the specified virtual workflow.
		 * @param {ConnectionAddParams} params - Parameters containing the flow UID and connection data.
		 * @returns {Promise<VirtualWorkflowOpResult>} A promise resolving with changes or an error.
		 */
		connectionAdd: async (params: ConnectionAddParams): Promise<VirtualWorkflowOpResult> => {
			const worker = getWorker(params.flow);
			if (!worker) return { error: 'Worker not found for the specified flow' };
			const changes = await worker.worker.getDataWorker({
				type: 'virtualAddConnection',
				data: params.data,
			});
			return { changes };
		},
		/**
		 * @async
		 * @function connectionRemove
		 * @description Removes a connection from the specified virtual workflow using its ID.
		 * @param {ConnectionRemoveParams} params - Parameters containing the flow UID and connection ID.
		 * @returns {Promise<VirtualWorkflowOpResult>} A promise resolving with changes or an error.
		 */
		connectionRemove: async (params: ConnectionRemoveParams): Promise<VirtualWorkflowOpResult> => {
			const worker = getWorker(params.flow);
			if (!worker) return { error: 'Worker not found for the specified flow' };
			const changes = await worker.worker.getDataWorker({
				type: 'removeConnection', // Note: ensure this type matches the expected worker message type.
				data: { id: params.id },
			});
			return { changes };
		},
	};
}
