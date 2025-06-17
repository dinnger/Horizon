import type { ISocket } from '@shared/interface/socket.interface.js';
import { Roles_Table as RolesTable } from '../../database/entity/security.roles.entity.js';
import { Users_Table as UsersTable } from '../../database/entity/security.users.entity.js';
import { Status_Table as StatusTable } from '../../database/entity/global.status.entity.js';

/**
 * @interface NewRoleParams
 * @description Parameters for creating a new role.
 * @property {string} name - The name of the role.
 * @property {string} description - A description for the role.
 * @property {string[]} tags - An array of tags associated with the role.
 * @property {ISocket} socket - The socket of the user performing the action, used to retrieve session data.
 */
interface NewRoleParams {
	name: string;
	description: string;
	tags: string[];
	socket: ISocket;
}

/**
 * @interface RoleOperationResult
 * @description Result of operations that create or modify roles.
 * @property {string} [msg] - Success message.
 * @property {string} [error] - Error message, if any.
 */
interface RoleOperationResult {
	msg?: string;
	error?: string;
}

/**
 * @interface RoleInfo
 * @description Detailed information about a role, including associated user and status.
 * This structure is used when listing roles.
 * @property {number} id - The unique ID of the role.
 * @property {string} name - The name of the role.
 * @property {string} description - The description of the role.
 * @property {string[]} tags - Tags associated with the role.
 * @property {Partial<UsersTable>} user - Partial information of the user who created the role.
 * @property {Partial<StatusTable>} status - Partial information of the role's status.
 */
interface RoleInfo {
	id: number;
	name: string;
	description: string;
	tags: string[];
	user: Partial<UsersTable>;
	status: Partial<StatusTable>;
}

/**
 * @interface GetAllRolesParams
 * @description Parameters for retrieving all roles.
 * @property {ISocket} socket - The user's socket, potentially for authorization (currently unused in query).
 */
interface GetAllRolesParams {
	socket: ISocket;
}

/**
 * @interface GetAllRolesResult
 * @description Result of the operation to retrieve all roles.
 * @property {RoleInfo[]} [roles] - An array of role information objects.
 * @property {string} [error] - Error message, if any.
 */
interface GetAllRolesResult {
	roles?: RoleInfo[];
	error?: string;
}

/**
 * @export
 * @interface SecurityRoleService
 * @description Defines the contract for the Security Role Service.
 * This service handles the creation and listing of user roles.
 * @property {(params: NewRoleParams) => Promise<RoleOperationResult>} new - Creates a new role.
 * @property {(params: GetAllRolesParams) => Promise<GetAllRolesResult>} all - Retrieves all active roles.
 */
export interface SecurityRoleService {
	new: (params: NewRoleParams) => Promise<RoleOperationResult>;
	all: (params: GetAllRolesParams) => Promise<GetAllRolesResult>;
}

/**
 * @function securityRoleService
 * @description Factory function for the Security Role Service.
 * Provides methods to manage user roles.
 * @returns {SecurityRoleService} An instance of the Security Role Service.
 */
export function securityRoleService(): SecurityRoleService {
	return {
		/**
		 * @async
		 * @function new
		 * @description Creates a new role in the system.
		 * @param {NewRoleParams} params - The parameters for the new role.
		 * @returns {Promise<RoleOperationResult>} A promise that resolves with a success or error message.
		 */
		new: async ({
			name,
			description,
			tags,
			socket,
		}: NewRoleParams): Promise<RoleOperationResult> => {
			try {
				// Create a new role record in the database
				await RolesTable.create({
					name,
					description,
					tags,
					id_status: 1, // Default to active status
					created_by: socket.session.id, // Record creator from socket session
				});
				return { msg: 'Role creado exitosamente' };
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : 'Error creating role';
				return { error: message };
			}
		},
		/**
		 * @async
		 * @function all
		 * @description Retrieves all active roles, including creator and status information.
		 * @param {GetAllRolesParams} params - Parameters for the retrieval.
		 * @returns {Promise<GetAllRolesResult>} A promise that resolves with a list of roles or an error message.
		 */
		all: async ({ socket }: GetAllRolesParams): Promise<GetAllRolesResult> => {
			try {
				// Fetch all active roles
				const roles = await RolesTable.findAll({
					attributes: ['id', 'name', 'description', 'tags'],
					include: [
						{
							model: UsersTable,
							required: true,
							// TODO: Consider selecting specific attributes from UsersTable.
						},
						{
							model: StatusTable,
							required: true,
							// TODO: Consider selecting specific attributes from StatusTable.
						},
					],
					where: {
						id_status: 1, // Only active roles
					},
					order: [['name', 'ASC']], // Order alphabetically by name
				});
				// The 'as any as RoleInfo[]' cast assumes direct structural compatibility.
				// For stronger typing, explicitly map `roles` to `RoleInfo[]`.
				return { roles: roles as any as RoleInfo[] };
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : 'Error fetching roles';
				return { error: message };
			}
		},
	};
}
