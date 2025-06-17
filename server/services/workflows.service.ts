import type { IWorkflow } from '@shared/interface/workflow.interface.js';
import type { Express } from 'express';
import type { ISocket } from '@shared/interface/socket.interface.js';
import { Status_Table as StatusTable } from '../database/entity/global.status.entity.js';
import { ProjectsTable } from '../database/entity/projects.projects.entity.js';
import { WorkflowsFlowTable } from '../database/entity/workflows.flows.entity.js';
import { workerService, workersList, IWorker as IWorkerInfo } from './worker.service.js';
import { virtualWorkflowService, VirtualWorkflowService } from './workflowsVirtual.service.js';
import { Users_Table as UsersTable } from '../database/entity/security.users.entity.js';
import { WorkflowsHistoryTable, IWorkflowsHistoryEntity } from '../database/entity/workflows.history.entity.js';
import { securitySecretService } from './security/securitySecret.service.js'; // Used in commented out code
import { WorkflowsEnvsTable } from '../database/entity/workflows.envs.entity.js';
import fs from 'node:fs';

/**
 * @interface WorkflowOperationResult
 * @description Standard result for workflow operations that primarily return a message or an error.
 * @property {string} [msg] - Success message.
 * @property {string} [error] - Error message, if any.
 */
interface WorkflowOperationResult {
	msg?: string;
	error?: string;
}

/**
 * @export
 * @interface WorkflowBasicInfo
 * @description Provides essential information about a workflow, typically for listings.
 * Includes project, status, user details, and worker status.
 * @property {number} id - The unique ID of the workflow.
 * @property {string} name - The name of the workflow.
 * @property {string} uid - The unique identifier (UID) of the workflow.
 * @property {number} created_by - ID of the user who created the workflow.
 * @property {Partial<ProjectsTable>} [project] - Associated project details.
 * @property {Partial<StatusTable>} [status] - Current status details of the workflow.
 * @property {Partial<UsersTable>} [user] - User details of the creator.
 * @property {'Active' | 'Inactive'} worker_status - The current status of the associated worker.
 * @property {any} [key] - Allows for additional properties from `workflow.dataValues`.
 */
export interface WorkflowBasicInfo {
	id: number;
	name: string;
	uid: string;
	created_by: number;
	project?: Partial<ProjectsTable>;
	status?: Partial<StatusTable>;
	user?: Partial<UsersTable>;
	worker_status: 'Active' | 'Inactive';
	[key: string]: any;
}

/**
 * @const defaultProperties
 * @description Default properties for a new workflow, conforming to `IWorkflow['properties']`.
 * Initializes with a basic router property.
 */
const defaultProperties: IWorkflow['properties'] = {
	basic: { router: '/' },
};

// Parameter Interfaces for each method in WorkflowsService

/** @interface NewWorkflowParams */
interface NewWorkflowParams {
	app: Express;
	socket: ISocket;
	idProject: number;
	name: string;
	description: string;
	flow: Partial<IWorkflow>;
	workspaceId?: number;
}

/** @interface GetWorkflowsParams */
interface GetWorkflowsParams {
	idProject?: number;
	uidFlow?: string;
	workspaceId?: number;
}

/** @interface InitializeWorkflowParams */
interface InitializeWorkflowParams {
	app: Express;
	uid: string;
	uidProject?: string;
	workspaceId?: number;
}

/** @interface SaveWorkflowParams */
interface SaveWorkflowParams {
	app: Express;
	uid: string;
	properties?: IWorkflow['properties'];
}

// LoadWorkflowParams is implicitly { uid?: string } via its usage.

/** @interface DebugWorkflowParams */
interface DebugWorkflowParams {
	flow: string;
	action: 'on' | 'off';
}

/** @interface GetWorkflowVariablesParams */
interface GetWorkflowVariablesParams {
	uidFlow: string;
}

/** @interface EditWorkflowParams */
interface EditWorkflowParams {
	uid: string;
	name: string;
}

/** @interface DeleteWorkflowParams */
interface DeleteWorkflowParams {
	uid: string;
}

// Interfaces for Dashboard method results

/** @interface RecentHistoryItem */
interface RecentHistoryItem {
    name: string;
    version: string;
    workflow: IWorkflow;
}
/** @interface DashboardStats */
interface DashboardStats {
    totalWorkflows: number;
    activeWorkers: number;
    weeklyExecutions: number[];
    recentHistory: RecentHistoryItem[];
}
/** @interface DashboardData */
interface DashboardData {
    stats: DashboardStats;
    workflows: WorkflowBasicInfo[];
}
/** @interface DashboardResult */
interface DashboardResult {
    stats?: DashboardStats;
    workflows?: WorkflowBasicInfo[];
    error?: string;
}


/**
 * @export
 * @interface WorkflowsService
 * @description Defines the contract for the Workflows Service.
 * This service handles comprehensive management of workflows, including CRUD, lifecycle,
 * state persistence, interaction with workers, and data retrieval for dashboards.
 */
export interface WorkflowsService {
	/** Creates a new workflow. */
	new: (params: NewWorkflowParams) => Promise<WorkflowOperationResult>;
	/** Retrieves workflows based on provided filters, returning basic information. */
	get: (params: GetWorkflowsParams) => Promise<WorkflowBasicInfo[] | { error: string }>;
	/** Initializes a workflow, preparing it for execution by a worker and retrieving its full definition. */
	initialize: (params: InitializeWorkflowParams) => Promise<IWorkflow | null | { error: string }>;
	/** Saves the current state of a workflow, including its structure and properties. */
	save: (params: SaveWorkflowParams) => Promise<WorkflowOperationResult>;
	/** Loads workflow configurations from the database and writes them to the file system. */
	load: (uid?: string) => Promise<WorkflowOperationResult>;
	/** Lists all active workflows with basic information. */
	list: () => Promise<WorkflowBasicInfo[]>;
	/** Toggles debug mode for a specific workflow worker. */
	debug: (params: DebugWorkflowParams) => Promise<WorkflowOperationResult>;
	/** Provides access to workflow environment variable management. */
	variables: () => { get: (params: GetWorkflowVariablesParams) => Promise<any | undefined>; };
	/** Provides access to virtual workflow operations (interacting with worker state). */
	virtual: VirtualWorkflowService;
	/** Edits basic properties (like name) of a workflow. */
	edit: (params: EditWorkflowParams) => Promise<WorkflowOperationResult>;
	/** Retrieves data for the workflows dashboard. */
	dashboard: () => Promise<DashboardResult>;
	/** Marks a workflow as inactive (soft delete). */
	delete: (params: DeleteWorkflowParams) => Promise<WorkflowOperationResult>;
}

/**
 * @function workflowsService
 * @description Factory function for the Workflows Service.
 * Provides a comprehensive set of methods for managing and interacting with workflows.
 * @returns {WorkflowsService} An instance of the Workflows Service.
 */
export function workflowsService(): WorkflowsService {
	return {
		/**
		 * @async
		 * @function new
		 * @description Creates a new workflow, associates it with a project, saves its initial state, and loads it.
		 * @param {NewWorkflowParams} params - Parameters for creating the new workflow.
		 * @returns {Promise<WorkflowOperationResult>} Result of the operation.
		 */
		new: async ({
			app,
			socket,
			idProject,
			name,
			description,
			flow,
			workspaceId,
		}: NewWorkflowParams): Promise<WorkflowOperationResult> => {
			try {
				// Validate project ownership if workspaceId is provided
				if (workspaceId) {
					const project = await ProjectsTable.findOne({
						where: { id: idProject, id_workspace: workspaceId, id_status: 1 },
					});
					if (!project) {
						return { error: 'Project not found in specified workspace' };
					}
				}

				// Create the workflow entry in the database
				const workflowInstance = await WorkflowsFlowTable.create({
					id_project: idProject,
					name,
					description,
					flow: flow as IWorkflow, // Assert type for 'flow'
					created_by: socket.session.id, // User from session
				});

				// Perform initial save and load operations for the new workflow
				// Note: Calling other methods of the same service like this can be problematic
				// if the service relies on being a fully constructed singleton with internal state.
				// Prefer direct function calls or ensure proper service architecture.
				await workflowsService().save({
					app,
					uid: workflowInstance.uid,
				});
				await workflowsService().load(workflowInstance.uid);
				return { msg: 'Workflow created' };
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : 'Failed to create workflow';
				return { error: message };
			}
		},
		/**
		 * @async
		 * @function get
		 * @description Retrieves a list of workflows based on specified filters.
		 * Includes project, status, and user information for each workflow.
		 * @param {GetWorkflowsParams} params - Filtering parameters.
		 * @returns {Promise<WorkflowBasicInfo[] | { error: string }>} An array of workflow information or an error object.
		 */
		get: async ({
			idProject,
			uidFlow,
			workspaceId,
		}: GetWorkflowsParams): Promise<WorkflowBasicInfo[] | { error: string }> => {
			try {
				const whereCondition: { [key: string]: any } = { id_status: 1 };
				if (idProject) whereCondition.id_project = idProject;
				if (uidFlow) whereCondition.uid = uidFlow;

				const projectWhereCondition: any = { id_status: 1 };
				if (workspaceId) {
					projectWhereCondition.id_workspace = workspaceId;
				}

				const workflowInstances = await WorkflowsFlowTable.findAll({
					attributes: ['id', 'name', 'uid', 'created_by'],
					include: [
						{ model: ProjectsTable, required: true, where: projectWhereCondition },
						{ model: StatusTable, required: true },
						{ model: UsersTable, required: true },
					],
					where: whereCondition,
					order: [['name', 'ASC']],
				});

				// Map database instances to the WorkflowBasicInfo structure
				return workflowInstances.map((workflow) => {
					const workerInstance = workersList.get(workflow.uid);
					return {
						...workflow.get({ plain: true }),
						worker_status: workerInstance?.active ? 'Active' : 'Inactive',
					} as WorkflowBasicInfo;
				});
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : 'Failed to retrieve workflows';
				return { error: message };
			}
		},
		/**
		 * @async
		 * @function initialize
		 * @description Initializes a workflow for execution.
		 * Fetches workflow details, starts a worker if not already running,
		 * and retrieves the virtual (runtime) state of the workflow from the worker.
		 * @param {InitializeWorkflowParams} params - Parameters for initialization.
		 * @returns {Promise<IWorkflow | null | { error: string }>} The full workflow definition, null if not found, or an error.
		 */
		initialize: async ({
			app,
			uid,
			uidProject,
			workspaceId,
		}: InitializeWorkflowParams): Promise<IWorkflow | null | { error: string }> => {
			try {
				const projectWhereCondition: any = { id_status: 1 };
				if (workspaceId) projectWhereCondition.id_workspace = workspaceId;

				// Fetch the workflow definition
				const workflowInstance = await WorkflowsFlowTable.findOne({
					attributes: { exclude: ['id_envs', 'id_project', 'id_status', 'id_deploy', 'created_by', 'shared_with'] },
					where: {	uid, id_status: 1 }, // Active workflow by UID
					include: [
						{ model: ProjectsTable, attributes: ['uid', 'name', 'description'], required: true, where: projectWhereCondition },
						{ model: StatusTable, attributes: ['name', 'color'], required: true },
					],
					order: [['name', 'ASC']],
				});

				if (!workflowInstance) return null; // Workflow not found

				// Validate project UID if provided
				if (uidProject && workflowInstance?.project?.uid !== uidProject) {
					return null; // Belongs to a different project
				}

				// Initialize or get existing worker for this flow
				const workerOperation = await workerService({ app }).init({ uidFlow: uid });
				if (workerOperation && 'error' in workerOperation) { // Handle worker error
					return { error: `Worker initialization failed: ${workerOperation.error}` };
				}
				const worker = workerOperation as IWorkerInfo | null;

				// Retrieve virtual state from worker
				const properties: IWorkflow['properties'] | null = await worker?.worker.getDataWorker({ type: 'getVirtualProperties', data: null }) || null;
				const nodes: IWorkflow['nodes'] | null = await worker?.worker.getDataWorker({ type: 'getVirtualNodes', data: null }) || null;
				const connections: IWorkflow['connections'] | null = await worker?.worker.getDataWorker({ type: 'getVirtualConnections', data: null }) || null;

				// Merge persisted flow with virtual state
				if (workflowInstance?.flow || nodes) {
					if (!workflowInstance.flow) (workflowInstance as any).flow = {}; // Ensure flow object exists
					workflowInstance.flow.properties = (properties && Object.keys(properties).length > 0) ? properties : defaultProperties;
					workflowInstance.flow.nodes = nodes || {};
					workflowInstance.flow.connections = connections || [];
				}

				const finalFlowData = workflowInstance.get({ plain: true }).flow as IWorkflow;
				return finalFlowData;

			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : 'Failed to initialize workflow';
				return { error: message };
			}
		},
		/**
		 * @async
		 * @function save
		 * @description Saves the current state of a workflow, including its structure (nodes, connections) and properties.
		 * It retrieves the virtual state from the worker, creates a history record, versions the workflow,
		 * updates the database, and writes the flow to a JSON file.
		 * @param {SaveWorkflowParams} params - Parameters for saving the workflow.
		 * @returns {Promise<WorkflowOperationResult>} Result of the save operation.
		 */
		save: async ({
			app,
			uid,
			properties,
		}: SaveWorkflowParams): Promise<WorkflowOperationResult> => {
			const worker = workersList.get(uid);
			if (!worker || !worker.active) return { error: 'No se encontró el worker o no está activo' };

			try {
				// Check if there are any changes in the worker before proceeding
				const statusData = await worker.worker.getDataWorker({ type: 'statusWorkflow' });
				const status = Array.isArray(statusData) ? statusData[0] : statusData;
				if (status === false) {
					return { error: 'No se han realizado ningún cambio' };
				}
			} catch (e: unknown) {
				console.warn(`Could not get worker status for ${uid}:`, e); // Log and continue if status check fails
			}

			// Retrieve current state from the virtual worker
			const flowProject: IWorkflow['project'] = await worker.worker.getDataWorker({ type: 'getVirtualProject', data: null });
			const flowNodes: IWorkflow['nodes'] = await worker.worker.getDataWorker({ type: 'getVirtualNodes', data: null });
			const flowConnections: IWorkflow['connections'] = await worker.worker.getDataWorker({ type: 'getVirtualConnections', data: null });

			const currentFlow: IWorkflow = {
				uid: worker.uidFlow,
				name: worker.nameFlow,
				version: '0.0.1',
				project: flowProject,
				properties: properties || defaultProperties,
				nodes: flowNodes || {},
				connections: flowConnections || [],
				env: {	secrets: {}, variables: {} },
			};

			const beforeWorkflow = await WorkflowsFlowTable.findOne({ where: { uid } });

			let workflowEnvs: any = {};
			let idEnvs: number | undefined = undefined;
			let version = beforeWorkflow?.version || '0.0.1';

			if (beforeWorkflow) {
				// Handle environment variables (currently 'workflowEnvs' is empty object)
				if (workflowEnvs && typeof workflowEnvs === 'object' && Object.keys(workflowEnvs).length > 0) {
					const envInstance = await WorkflowsEnvsTable.findOne({
						where: { id_flow: beforeWorkflow.id, data: workflowEnvs, id_status: 1 },
					});
					if (envInstance) idEnvs = envInstance.id;
				}

				// TODO: Implement or re-evaluate secrets extraction logic if it's required.
				// The original commented code for secrets processing is omitted here for brevity but should be reviewed.

				currentFlow.nodes = cleanNodesForStorage(currentFlow.nodes);

				// Create a history record of the workflow state before this save
				await WorkflowsHistoryTable.create({
					id_flow: beforeWorkflow.id,
					name: beforeWorkflow.name || '',
					description: beforeWorkflow.description,
					flow: beforeWorkflow.flow as IWorkflow,
					version: beforeWorkflow.version,
					id_status: beforeWorkflow.id_status,
					created_by: beforeWorkflow.created_by,
				} as IWorkflowsHistoryEntity );

				// Determine new version based on changes
				const structuralChange =
					Object.keys(currentFlow.nodes).length !== Object.keys(beforeWorkflow.flow?.nodes || {}).length ||
					Object.keys(currentFlow.connections).length !== Object.keys(beforeWorkflow.flow?.connections || []).length;
				version = calculateNewVersion(beforeWorkflow.version, structuralChange);
			}
			currentFlow.version = version;

			// Update the main workflow record
			await WorkflowsFlowTable.update(
				{
					flow: currentFlow,
					version,
					id_deploy: properties?.deploy || undefined,
					id_envs: idEnvs,
				},
				{ where: { uid } }
			);

			// Ensure directory exists and write the flow to a JSON file
			const flowFilePath = `./data/workflows/${uid}/flow.json`;
			if (!fs.existsSync(`./data/workflows/${uid}`)) {
				fs.mkdirSync(`./data/workflows/${uid}`, { recursive: true });
			}
			fs.writeFileSync(flowFilePath, JSON.stringify(currentFlow, null, 2));

			// Restart the worker to apply changes
			await workerService({ app }).restart({ uidFlow: uid });
			return { msg: 'Workflow saved' };
		},
		/**
		 * @async
		 * @function load
		 * @description Loads workflow configurations from the database and writes them to the local file system.
		 * This is typically used during application startup or when needing to refresh local caches.
		 * @param {string} [uidInput] - Optional UID of a specific workflow to load. If not provided, all active workflows are loaded.
		 * @returns {Promise<WorkflowOperationResult>} Result of the load operation.
		 */
		load: async (uidInput?: string): Promise<WorkflowOperationResult> => {
			console.log('Cargando workflows...'); // Informative log
			const whereCondition: { [key: string]: any } = { id_status: 1 };
			if (uidInput) whereCondition.uid = uidInput;

			const workflowInstances = await WorkflowsFlowTable.findAll({
				include: [
					{ model: WorkflowsEnvsTable, as: 'variables', required: false, where: { id_status: 1 } },
					{ model: ProjectsTable, required: true },
				],
				where: whereCondition,
			});

			if (!workflowInstances || workflowInstances.length === 0) return { error: 'No workflows found to load.' };

			for (const workflow of workflowInstances) {
				const currentUid = workflow.uid;
				const projectData: { [key: string]: any } = {};
				if (workflow.project) { // Ensure project data exists
					projectData[String(workflow.project.transport_type)] = workflow.project.transport_config || {};
				}
				// Reconstruct the flow object, ensuring defaults if parts are missing
				const flowData: IWorkflow = (workflow.flow as IWorkflow) || {
					uid: currentUid, name: workflow.name, version: workflow.version,
					properties: defaultProperties, nodes: {}, connections: [], project: {}, env: { secrets: {}, variables: {} }
				};
				flowData.project = projectData as IWorkflow['project']; // Assign constructed project data

				const workflowDir = `./data/workflows/${currentUid}`;
				if (!fs.existsSync(workflowDir)) {
					fs.mkdirSync(workflowDir, { recursive: true });
				}
				// Write the reconstructed flow data to its JSON file
				fs.writeFileSync(`${workflowDir}/flow.json`, JSON.stringify(flowData, null, 2));
			}
			return { msg: 'Workflows loaded and saved to file system.' };
		},
		/**
		 * @async
		 * @function list
		 * @description Retrieves a list of all active workflows with basic information, including project details and worker status.
		 * @returns {Promise<WorkflowBasicInfo[]>} An array of workflow basic information.
		 */
		list: async (): Promise<WorkflowBasicInfo[]> => {
			const workflowInstances = await WorkflowsFlowTable.findAll({
				attributes: ['uid', 'name', 'created_by'],
				include: [
					{
						attributes: ['uid', 'name', 'description'],
						model: ProjectsTable,
						required: true,
						where: { id_status: 1 },
					},
				],
				where: { id_status: 1 },
				order: [['name', 'ASC']],
			});
			return workflowInstances.map((workflow) => {
				const workerInstance = workersList.get(workflow.uid);
				return {
					...workflow.get({ plain: true }),
					worker_status: workerInstance?.active ? 'Active' : 'Inactive',
				} as WorkflowBasicInfo;
			});
		},
		/**
		 * @async
		 * @function debug
		 * @description Sends a debug action ('on' or 'off') to the specified workflow's worker.
		 * @param {DebugWorkflowParams} params - Parameters for the debug action.
		 * @returns {Promise<WorkflowOperationResult>} Result of sending the debug command.
		 */
		debug: async ({ flow, action }: DebugWorkflowParams): Promise<WorkflowOperationResult> => {
			const worker = workersList.get(flow.toLocaleLowerCase().trim());
			if (!worker || !worker.active) {
				return { error: 'No se encontró el worker o no está activo' };
			}
			// Send message to worker, assumes no direct response needed beyond acknowledgement
			worker.worker.postMessage({
				type: 'actionDebug',
				data: action === 'on',
			});
			return { msg: 'Workflow debug action sent' };
		},
		/**
		 * @function variables
		 * @description Returns a sub-service for managing workflow environment variables.
		 * @returns {{ get: (params: GetWorkflowVariablesParams) => Promise<any | undefined> }} The variables sub-service.
		 */
		variables: () => {
			return {
				/**
				 * @async
				 * @function get
				 * @description Retrieves environment variables for a specific workflow.
				 * @param {GetWorkflowVariablesParams} params - Parameters containing the workflow UID.
				 * @returns {Promise<any | undefined>} The environment variables data, or undefined if not found.
				 * @todo Define a specific type for the returned variables data instead of `any`.
				 */
				get: async ({ uidFlow }: GetWorkflowVariablesParams): Promise<any | undefined> => {
					const variablesInstance = await WorkflowsEnvsTable.findOne({
						include: [
							{ model: WorkflowsFlowTable, required: true, where: { uid: uidFlow, id_status: 1 }},
						],
						where: { id_status: 1 },
					});
					return variablesInstance?.data;
				},
			};
		},
		/** Provides access to virtual workflow operations. */
		virtual: virtualWorkflowService,
		/**
		 * @async
		 * @function edit
		 * @description Edits the name of an existing workflow.
		 * @param {EditWorkflowParams} params - Parameters for editing the workflow.
		 * @returns {Promise<WorkflowOperationResult>} Result of the edit operation.
		 */
		edit: async ({ uid, name }: EditWorkflowParams): Promise<WorkflowOperationResult> => {
			try {
				const workflow = await WorkflowsFlowTable.findOne({ where: { uid, id_status: 1 } });
				if (!workflow) {
					return { error: 'Workflow no encontrado' };
				}
				await workflow.update({ name });
				return { msg: 'Workflow actualizado exitosamente' };
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : 'Error updating workflow';
				return { error: message };
			}
		},
		/**
		 * @async
		 * @function dashboard
		 * @description Retrieves data for the workflows dashboard, including statistics and recent activity.
		 * @returns {Promise<DashboardResult>} Data for the dashboard or an error object.
		 */
		dashboard: async (): Promise<DashboardResult> => {
			try {
				// Fetch all active workflows for general stats
				const activeWorkflows = await WorkflowsFlowTable.findAll({
					include: [
						{ model: ProjectsTable, required: true },
						{ model: StatusTable, required: true },
					],
					where: { id_status: 1 },
				});

				// Fetch recent workflow history for trend analysis
				const recentHistoryRaw = await WorkflowsHistoryTable.findAll({
					include: [ { model: WorkflowsFlowTable, required: true, where: { id_status: 1 } } ],
					where: { id_status: 1 },
					order: [['id', 'DESC']],
					limit: 50, // Limit to last 50 for performance
				});

				const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
				const weeklyStats: number[] = daysOfWeek.map(() => 0);

				// Aggregate history by day of the week
				recentHistoryRaw.forEach((entry) => {
					const dayIndex = new Date(entry.created_at || Date.now()).getDay();
					weeklyStats[dayIndex] = (weeklyStats[dayIndex] || 0) + 1;
				});

				const stats: DashboardStats = {
					totalWorkflows: activeWorkflows.length,
					activeWorkers: Array.from(workersList.values()).filter((w) => w.active).length,
					weeklyExecutions: weeklyStats,
					recentHistory: recentHistoryRaw.slice(0, 10).map(h => ({ // Top 10 recent history items
						name: h.name,
						version: h.version,
						workflow: h.flow as IWorkflow,
					})),
				};

				// Prepare top 10 workflows for dashboard display
				const dashboardWorkflows: WorkflowBasicInfo[] = activeWorkflows.slice(0, 10).map(wf => ({
                    ...wf.get({ plain: true }),
                    worker_status: workersList.get(wf.uid)?.active ? 'Active' : 'Inactive',
                } as WorkflowBasicInfo ));

				return { stats, workflows: dashboardWorkflows };
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : 'Error fetching dashboard data';
				return { error: message };
			}
		},
		/**
		 * @async
		 * @function delete
		 * @description Marks a workflow as inactive (soft delete).
		 * @param {DeleteWorkflowParams} params - Parameters containing UID of the workflow to delete.
		 * @returns {Promise<WorkflowOperationResult>} Result of the delete operation.
		 */
		delete: async ({ uid }: DeleteWorkflowParams): Promise<WorkflowOperationResult> => {
			try {
				const workflow = await WorkflowsFlowTable.findOne({ where: { uid, id_status: 1 } });
				if (!workflow) {
					return { error: 'Workflow no encontrado o ya inactivo' };
				}
				await workflow.update({ id_status: 2 }); // Assuming 2 means 'inactive'
				// TODO: Consider stopping the associated worker if it's active.
				// Example: await workerService({ app: null }).close({ uidFlow: uid });
				return { msg: 'Workflow eliminado exitosamente' };
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : 'Error deleting workflow';
				return { error: message };
			}
		},
	};
}

/**
 * @function cleanNodesForStorage
 * @description Simplifies node properties for storage, typically keeping only essential 'value' fields.
 * Also removes transient layout properties like height and width.
 * @param {IWorkflow['nodes']} nodes - The nodes object from a workflow.
 * @returns {IWorkflow['nodes']} A new nodes object with cleaned properties.
 */
function cleanNodesForStorage(nodes: IWorkflow['nodes']): IWorkflow['nodes'] {
	const cleanedNodes: IWorkflow['nodes'] = {};
	if (!nodes) return cleanedNodes; // Handle case where nodes might be null or undefined

	for (const [key, item] of Object.entries(nodes)) {
		cleanedNodes[key] = {
			...item, // Spread the original item
			properties: item.properties // Process properties if they exist
				? Object.fromEntries(
						Object.entries(item.properties).map(([propKey, propItem]) => {
							// Ensure propItem is an object and has a 'value' property before accessing it
							if (typeof propItem === 'object' && propItem !== null && 'value' in propItem) {
								return [propKey, { value: (propItem as { value: any }).value }];
							}
							// If propItem is not in the expected shape, decide how to handle it.
							// Option 1: Keep it as is (might store more than needed)
							// return [propKey, propItem];
							// Option 2: Omit it or set to a default (as done by original logic implicitly if no 'value')
							return [propKey, {}]; // Or some other default like { value: undefined }
						})
					)
				: {}, // Default to empty object if item.properties is null/undefined
		};
		// Remove transient properties that are not part of the stored schema
		delete (cleanedNodes[key] as any).height;
		delete (cleanedNodes[key] as any).width;
	}
	return cleanedNodes;
}

/**
 * @function calculateNewVersion
 * @description Calculates a new version string based on the previous version and whether a structural change occurred.
 * Increments minor version for structural changes (rolling over to major if minor reaches 10),
 * otherwise increments patch version.
 * @param {string | undefined} currentVersionStr - The current version string (e.g., "1.0.0") or undefined if no previous version.
 * @param {boolean} structuralChange - True if a structural change (nodes/connections count) occurred, false otherwise.
 * @returns {string} The new version string.
 */
function calculateNewVersion(currentVersionStr: string | undefined, structuralChange: boolean): string {
	let [majorStr, minorStr, patchStr] = (currentVersionStr || '0.0.0').split('.');
	let major = Number.parseInt(majorStr || '0');
	let minor = Number.parseInt(minorStr || '0');
	let patch = Number.parseInt(patchStr || '0');

	if (structuralChange) {
		minor++;
		if (minor >= 10) { // Assuming minor rolls over at 10 to major
			minor = 0;
			major++;
		}
		patch = 0; // Reset patch on minor/major change
	} else {
		patch++;
	}
	return `${major}.${minor}.${patch}`;
}
