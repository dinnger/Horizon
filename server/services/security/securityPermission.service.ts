import type { ISocket } from '@shared/interface/socket.interface.js';
import { Users_Table as UsersTable } from '../../database/entity/security.users.entity.js';
import { Status_Table as StatusTable } from '../../database/entity/global.status.entity.js';
import { Permission_Table as PermissionTable } from '../../database/entity/security.permission.entity.js';

/**
 * @interface NewPermissionParams
 * @description Parameters for creating a new permission.
 * @property {string} slug - A unique slug for the permission (e.g., 'create-user').
 * @property {string} name - A human-readable name for the permission (e.g., 'Create User').
 * @property {string} description - A description of what the permission allows.
 * @property {ISocket} socket - The socket of the user performing the action, used to retrieve session data like user ID.
 */
interface NewPermissionParams {
	slug: string;
	name: string;
	description: string;
	socket: ISocket;
}

/**
 * @interface PermissionOperationResult
 * @description Result of operations that create or modify permissions.
 * @property {string} [msg] - Success message.
 * @property {string} [error] - Error message, if any.
 */
interface PermissionOperationResult {
	msg?: string;
	error?: string;
}

/**
 * @interface PermissionInfo
 * @description Detailed information about a permission, including associated user and status.
 * This structure is used when listing permissions.
 * @property {number} id - The unique ID of the permission.
 * @property {string} slug - The permission's unique slug.
 * @property {string} name - The human-readable name of the permission.
 * @property {string} description - The description of the permission.
 * @property {Partial<UsersTable>} user - Partial information of the user who created the permission.
 * @property {Partial<StatusTable>} status - Partial information of the permission's status.
 */
interface PermissionInfo {
	id: number;
	slug: string;
	name: string;
	description: string;
	user: Partial<UsersTable>;
	status: Partial<StatusTable>;
	// Add other fields if necessary
}

/**
 * @interface GetAllPermissionsParams
 * @description Parameters for retrieving all permissions.
 * @property {ISocket} socket - The user's socket, potentially for authorization checks in the future (currently unused in query).
 */
interface GetAllPermissionsParams {
	socket: ISocket;
}

/**
 * @interface GetAllPermissionsResult
 * @description Result of the operation to retrieve all permissions.
 * @property {PermissionInfo[]} [permissions] - An array of permission information objects.
 * @property {string} [error] - Error message, if any.
 */
interface GetAllPermissionsResult {
	permissions?: PermissionInfo[];
	error?: string;
}

/**
 * @export
 * @interface SecurityPermissionService
 * @description Defines the contract for the Security Permission Service.
 * This service handles the creation and listing of permissions.
 * @property {(params: NewPermissionParams) => Promise<PermissionOperationResult>} new - Creates a new permission.
 * @property {(params: GetAllPermissionsParams) => Promise<GetAllPermissionsResult>} all - Retrieves all active permissions.
 */
export interface SecurityPermissionService {
	new: (params: NewPermissionParams) => Promise<PermissionOperationResult>;
	all: (params: GetAllPermissionsParams) => Promise<GetAllPermissionsResult>;
}

/**
 * @function securityPermissionService
 * @description Factory function for the Security Permission Service.
 * Provides methods to manage system permissions.
 * @returns {SecurityPermissionService} An instance of the Security Permission Service.
 */
export function securityPermissionService(): SecurityPermissionService {
	return {
		/**
		 * @async
		 * @function new
		 * @description Creates a new permission in the system.
		 * @param {NewPermissionParams} params - The parameters for the new permission.
		 * @returns {Promise<PermissionOperationResult>} A promise that resolves with a success or error message.
		 */
		new: async ({
			slug,
			name,
			description,
			socket,
		}: NewPermissionParams): Promise<PermissionOperationResult> => {
			try {
				// Create a new permission record in the database
				await PermissionTable.create({
					slug,
					name,
					description,
					id_status: 1, // Default to active status
					created_by: socket.session.id, // Record creator from socket session
				});
				return { msg: 'Permiso creado exitosamente' };
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : 'Error creating permission';
				return { error: message };
			}
		},
		/**
		 * @async
		 * @function all
		 * @description Retrieves all active permissions, including creator and status information.
		 * @param {GetAllPermissionsParams} params - Parameters for the retrieval (currently includes socket, though unused in query).
		 * @returns {Promise<GetAllPermissionsResult>} A promise that resolves with a list of permissions or an error message.
		 */
		all: async ({ socket }: GetAllPermissionsParams): Promise<GetAllPermissionsResult> => {
			try {
				// Fetch all active permissions
				const permissionsData = await PermissionTable.findAll({
					attributes: ['id', 'slug', 'name', 'description'],
					include: [
						{
							model: UsersTable,
							required: true,
							// TODO: Consider selecting specific attributes from UsersTable (e.g., username, id) instead of all.
						},
						{
							model: StatusTable,
							required: true,
							// TODO: Consider selecting specific attributes from StatusTable (e.g., name) instead of all.
						},
					],
					where: {
						id_status: 1, // Only active permissions
					},
					order: [['name', 'ASC']], // Order alphabetically by name
				});
				// The 'as any as PermissionInfo[]' cast assumes direct structural compatibility.
				// For stronger typing, explicitly map `permissionsData` to `PermissionInfo[]`.
				return { permissions: permissionsData as any as PermissionInfo[] };
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : 'Error fetching permissions';
				return { error: message };
			}
		},
	};
}
