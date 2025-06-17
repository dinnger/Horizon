import type { IProjectsProjectsEntity } from '@entities/projects.interface.js';
import type { ISocket } from '@shared/interface/socket.interface.js';
import { ProjectsTable } from '../database/entity/projects.projects.entity.js';
import { Status_Table as StatusTable } from '../database/entity/global.status.entity.js';
import { Users_Table as UsersTable } from '../database/entity/security.users.entity.js';
import { WorkflowsFlowTable } from '../database/entity/workflows.flows.entity.js';
import amqp from 'amqplib';

/**
 * @interface NewProjectParams
 * @description Parameters for creating a new project.
 * @property {ISocket} socket - The user's socket connection.
 * @property {string} name - The name of the project.
 * @property {string} description - A description for the project.
 * @property {string} [transportType] - The type of transport mechanism (e.g., 'empty', 'rabbitMQ').
 * @property {string} [transportPattern] - Pattern for the transport mechanism.
 * @property {object} [transportConfig] - Configuration for the transport mechanism.
 */
interface NewProjectParams {
	socket: ISocket;
	name: string;
	description: string;
	transportType?: string;
	transportPattern?: string;
	transportConfig?: object | undefined;
}

/**
 * @interface ProjectOperationResult
 * @description Standard result for project operations that might return a message or an error.
 * @property {string} [msg] - Success message.
 * @property {string} [error] - Error message, if any.
 */
interface ProjectOperationResult {
	msg?: string;
	error?: string;
}

/**
 * @interface GetProjectByUidParams
 * @description Parameters for fetching a project by its UID.
 * @property {string} uid - The unique identifier of the project.
 */
interface GetProjectByUidParams {
	uid: string;
}

/**
 * @interface DeleteProjectParams
 * @description Parameters for deleting a project.
 * @property {string} uid - The unique identifier of the project to delete.
 */
interface DeleteProjectParams {
	uid: string;
}

/**
 * @interface TestRabbitMQParams
 * @description Parameters for testing a RabbitMQ connection.
 * @property {string} url - The connection URL for RabbitMQ.
 */
interface TestRabbitMQParams {
	url: string;
}

/**
 * @interface ProjectVariablesResult
 * @description Result of fetching project variables, includes transport details or an error.
 * @property {string} [type] - The transport type.
 * @property {string} [pattern] - The transport pattern.
 * @property {object} [config] - The transport configuration.
 * @property {string} [error] - Error message, if any.
 */
interface ProjectVariablesResult {
	type?: string;
	pattern?: string;
	config?: object;
	error?: string;
}

/**
 * @interface GetVariablesParams
 * @description Parameters for fetching project variables related to a specific workflow.
 * @property {string} uidFlow - The unique identifier of the workflow.
 */
interface GetVariablesParams {
	uidFlow: string;
}

/**
 * @interface ProjectsTestService
 * @description Defines the structure for test-related sub-services within ProjectsService.
 * @property {(params: TestRabbitMQParams) => Promise<ProjectOperationResult>} rabbitMQ - Tests a RabbitMQ connection.
 */
interface ProjectsTestService {
	rabbitMQ: (params: TestRabbitMQParams) => Promise<ProjectOperationResult>;
}

/**
 * @interface ProjectsVariablesService
 * @description Defines the structure for variables-related sub-services within ProjectsService.
 * @property {(params: GetVariablesParams) => Promise<ProjectVariablesResult>} get - Fetches project variables for a flow.
 */
interface ProjectsVariablesService {
	get: (params: GetVariablesParams) => Promise<ProjectVariablesResult>;
}

/**
 * @export
 * @interface ProjectsService
 * @description Defines the contract for the Projects Service.
 * This service handles CRUD operations for projects, connection testing, and variable retrieval.
 * @property {(params: NewProjectParams) => Promise<ProjectOperationResult>} new - Creates a new project.
 * @property {() => Promise<IProjectsProjectsEntity[] | ProjectOperationResult>} getProjects - Retrieves all active projects.
 * @property {(params: GetProjectByUidParams) => Promise<IProjectsProjectsEntity | null | ProjectOperationResult>} getProjectByUid - Retrieves a specific project by its UID.
 * @property {(params: DeleteProjectParams) => Promise<ProjectOperationResult>} delete - Marks a project as inactive.
 * @property {() => ProjectsTestService} test - Returns sub-service for testing connections.
 * @property {() => ProjectsVariablesService} variables - Returns sub-service for project variables.
 */
export interface ProjectsService {
	new: (params: NewProjectParams) => Promise<ProjectOperationResult>;
	getProjects: () => Promise<IProjectsProjectsEntity[] | ProjectOperationResult>;
	getProjectByUid: (params: GetProjectByUidParams) => Promise<IProjectsProjectsEntity | null | ProjectOperationResult>;
	delete: (params: DeleteProjectParams) => Promise<ProjectOperationResult>;
	test: () => ProjectsTestService;
	variables: () => ProjectsVariablesService;
}

/**
 * @function projectsService
 * @description Factory function for the Projects Service.
 * Provides methods for managing projects, including CRUD operations, testing connections, and variable retrieval.
 * @returns {ProjectsService} An instance of the Projects Service.
 */
export function projectsService(): ProjectsService {
	return {
		/**
		 * @async
		 * @function new
		 * @description Creates a new project with the provided details.
		 * @param {NewProjectParams} params - Parameters for the new project.
		 * @returns {Promise<ProjectOperationResult>} Result of the operation.
		 */
		new: async ({
			socket,
			name,
			description,
			transportType = 'empty',
			transportPattern = undefined,
			transportConfig = undefined,
		}: NewProjectParams): Promise<ProjectOperationResult> => {
			try {
				await ProjectsTable.create({
					name,
					description,
					id_workspace: socket.session.workspace, // Assumes workspace ID is in session
					created_by: socket.session.id, // Assumes user ID is in session
					transport_type: transportType,
					transport_pattern: transportPattern,
					transport_config: transportConfig,
				});
				return { msg: 'Project created' };
			} catch (error: unknown) {
				let message = 'Error creating project';
				if (error instanceof Error) message = error.toString();
				return { error: message };
			}
		},
		/**
		 * @async
		 * @function getProjects
		 * @description Retrieves a list of all active projects with their associated status, workflows, and users.
		 * @returns {Promise<IProjectsProjectsEntity[] | ProjectOperationResult>} Array of project entities or an error object.
		 */
		getProjects: async (): Promise<IProjectsProjectsEntity[] | ProjectOperationResult> => {
			try {
				const projects = await ProjectsTable.findAll({
					include: [
						{ model: StatusTable, required: true },
						{ model: WorkflowsFlowTable, required: false }, // Workflows are optional for a project
						{ model: UsersTable },
					],
					where: { id_status: 1 }, // Only active projects
					order: [['name', 'ASC']],
				});
				return projects as IProjectsProjectsEntity[];
			} catch (error: unknown) {
				let message = 'Error fetching projects';
				if (error instanceof Error) message = error.toString();
				return { error: message };
			}
		},
		/**
		 * @async
		 * @function getProjectByUid
		 * @description Retrieves a single project by its UID, including status and user information.
		 * @param {GetProjectByUidParams} params - Parameters containing the UID of the project.
		 * @returns {Promise<IProjectsProjectsEntity | null | ProjectOperationResult>} The project entity, null if not found, or an error object.
		 */
		getProjectByUid: async ({ uid }: GetProjectByUidParams): Promise<IProjectsProjectsEntity | null | ProjectOperationResult> => {
			try {
				const project = await ProjectsTable.findOne({
					where: { uid },
					include: [
						{ model: StatusTable, required: true },
						{ model: UsersTable },
					],
					order: [['name', 'ASC']], // Order, though likely only one result
				});
				return project as IProjectsProjectsEntity | null;
			} catch (error: unknown) {
				let message = `Error fetching project with UID: ${uid}`;
				if (error instanceof Error) message = error.toString();
				return { error: message };
			}
		},
		/**
		 * @async
		 * @function delete
		 * @description Marks a project as inactive (soft delete).
		 * @param {DeleteProjectParams} params - Parameters containing the UID of the project to delete.
		 * @returns {Promise<ProjectOperationResult>} Result of the operation.
		 */
		delete: async ({ uid }: DeleteProjectParams): Promise<ProjectOperationResult> => {
			try {
				const project = await ProjectsTable.findOne({ where: { uid, id_status: 1 } });
				if (!project) return { error: 'Project not found or already inactive' };
				await project.update({ id_status: 2 }); // Assuming 2 means inactive
				return { msg: 'Project deleted' };
			} catch (error: unknown) {
				let message = `Error deleting project with UID: ${uid}`;
				if (error instanceof Error) message = error.toString();
				return { error: message };
			}
		},
		/**
		 * @function test
		 * @description Returns a sub-service for testing project-related connections.
		 * @returns {ProjectsTestService} The testing sub-service.
		 */
		test(): ProjectsTestService {
			return {
				/**
				 * @async
				 * @function rabbitMQ
				 * @description Tests a RabbitMQ connection using the provided URL.
				 * @param {TestRabbitMQParams} params - Parameters containing the RabbitMQ URL.
				 * @returns {Promise<ProjectOperationResult>} Result of the connection test.
				 */
				rabbitMQ: async ({ url }: TestRabbitMQParams): Promise<ProjectOperationResult> => {
					try {
						const conn = await amqp.connect(url);
						await conn.close(); // Ensure connection is closed after successful test
						return { msg: 'Conexión establecida' };
					} catch (error: unknown) {
						let message = 'Error testing RabbitMQ connection';
						if (error instanceof Error) message = error.message; // Use error.message for amqp errors
						return { error: message };
					}
				},
			};
		},
		/**
		 * @function variables
		 * @description Returns a sub-service for managing project variables related to workflows.
		 * @returns {ProjectsVariablesService} The variables sub-service.
		 */
		variables(): ProjectsVariablesService {
			return {
				/**
				 * @async
				 * @function get
				 * @description Retrieves transport-related variables for a project associated with a given workflow UID.
				 * @param {GetVariablesParams} params - Parameters containing the workflow UID.
				 * @returns {Promise<ProjectVariablesResult>} The project's transport variables or an error.
				 */
				get: async ({ uidFlow }: GetVariablesParams): Promise<ProjectVariablesResult> => {
					try {
						const projectVariables = await ProjectsTable.findOne({
							attributes: ['transport_type', 'transport_pattern', 'transport_config'],
							include: [
								{
									model: WorkflowsFlowTable,
									required: true, // Ensures we only get projects that have this flow
									where: { uid: uidFlow, id_status: 1 },
								},
							],
							where: { id_status: 1 }, // Project itself must be active
						});
						if (!projectVariables) {
							return { error: "Project variables not found for the given flow UID." };
						}
						return {
							type: projectVariables.transport_type,
							pattern: projectVariables.transport_pattern,
							config: projectVariables.transport_config,
						};
					} catch (error: unknown) {
						let message = `Error fetching variables for flow UID: ${uidFlow}`;
						if (error instanceof Error) message = error.toString();
						return { error: message };
					}
				},
			};
		},
	};
}
