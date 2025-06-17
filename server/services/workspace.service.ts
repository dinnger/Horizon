import type { IWorkspaceEntity, IWorkspaceUserEntity, WorkspaceUserRole } from '@entities/workspace.interface.js';
import { Workspace_Table as WorkspaceTable } from '../database/entity/workspace.entity.js';
import { WorkspaceUser_Table as WorkspaceUserTable } from '../database/entity/workspace.users.entity.js';
import { Status_Table as StatusTable } from '../database/entity/global.status.entity.js';
import { Users_Table as UsersTable } from '../database/entity/security.users.entity.js';

/**
 * @interface WorkspaceOperationResult
 * @description Standard result for workspace operations.
 * @property {string} [msg] - Success message.
 * @property {string} [error] - Error message, if any.
 * @property {IWorkspaceEntity} [workspace] - The created or retrieved workspace entity.
 */
interface WorkspaceOperationResult {
	msg?: string;
	error?: string;
	workspace?: IWorkspaceEntity;
}

/** @interface NewWorkspaceParams */
interface NewWorkspaceParams {
	name: string;
	description?: string;
	created_by: number;
}

/** @interface GetWorkspacesParams */
interface GetWorkspacesParams {
	user_id: number;
}

/** @interface GetWorkspaceByIdParams */
interface GetWorkspaceByIdParams {
	id: number;
	user_id: number;
}

/** @interface UpdateWorkspaceParams */
interface UpdateWorkspaceParams {
	id: number;
	name?: string;
	description?: string;
	user_id: number; // User performing the update, for permission checks
}

/** @interface DeleteWorkspaceParams */
interface DeleteWorkspaceParams {
	id: number;
	user_id: number; // User performing the delete, for permission checks
}

/** @interface AddUserToWorkspaceParams */
interface AddUserToWorkspaceParams {
	workspace_id: number;
	user_id: number; // User to be added
	role?: WorkspaceUserRole; // Role of the user in the workspace
	added_by: number; // User performing the action
}

/** @interface RemoveUserFromWorkspaceParams */
interface RemoveUserFromWorkspaceParams {
	workspace_id: number;
	user_id: number; // User to be removed
	removed_by: number; // User performing the action
}

/** @interface UpdateUserRoleInWorkspaceParams */
interface UpdateUserRoleInWorkspaceParams {
	workspace_id: number;
	user_id: number; // User whose role is to be updated
	role: WorkspaceUserRole; // New role
	updated_by: number; // User performing the action
}

/** @interface GetWorkspaceUsersParams */
interface GetWorkspaceUsersParams {
	workspace_id: number;
	user_id: number; // User requesting the list, for permission checks
}

/**
 * @export
 * @interface WorkspaceService
 * @description Defines the contract for the Workspace Service.
 * This service handles CRUD operations for workspaces and manages user associations within workspaces.
 */
export interface WorkspaceService {
	new: (params: NewWorkspaceParams) => Promise<WorkspaceOperationResult>;
	getWorkspaces: (params: GetWorkspacesParams) => Promise<IWorkspaceEntity[] | WorkspaceOperationResult>;
	getWorkspaceById: (params: GetWorkspaceByIdParams) => Promise<IWorkspaceEntity | null | WorkspaceOperationResult>;
	update: (params: UpdateWorkspaceParams) => Promise<WorkspaceOperationResult>;
	delete: (params: DeleteWorkspaceParams) => Promise<WorkspaceOperationResult>;
	addUser: (params: AddUserToWorkspaceParams) => Promise<WorkspaceOperationResult>;
	removeUser: (params: RemoveUserFromWorkspaceParams) => Promise<WorkspaceOperationResult>;
	updateUserRole: (params: UpdateUserRoleInWorkspaceParams) => Promise<WorkspaceOperationResult>;
	getWorkspaceUsers: (params: GetWorkspaceUsersParams) => Promise<IWorkspaceUserEntity[] | WorkspaceOperationResult>;
}

/**
 * @function workspaceService
 * @description Factory function for the Workspace Service.
 * Provides methods for managing workspaces and their users.
 * @returns {WorkspaceService} An instance of the Workspace Service.
 */
export function workspaceService(): WorkspaceService {
	return {
		/**
		 * @async
		 * @function new
		 * @description Creates a new workspace and assigns the creator as its owner.
		 * @param {NewWorkspaceParams} params - Parameters for the new workspace.
		 * @returns {Promise<WorkspaceOperationResult>} Result of the operation, including the created workspace.
		 */
		new: async ({
			name,
			description,
			created_by,
		}: NewWorkspaceParams): Promise<WorkspaceOperationResult> => {
			try {
				const workspace = await WorkspaceTable.create({
					name,
					description,
					created_by,
					id_status: 1, // Default to active status
				});

				// Automatically add the creator as an owner of the workspace
				await WorkspaceUserTable.create({
					id_workspace: workspace.id,
					id_user: created_by,
					role: 'owner',
				});

				return { msg: 'Workspace created', workspace: workspace.get({ plain: true }) };
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : 'Error creating workspace';
				return { error: message };
			}
		},

		/**
		 * @async
		 * @function getWorkspaces
		 * @description Retrieves all workspaces a user is associated with.
		 * Includes status, creator, and user association details.
		 * @param {GetWorkspacesParams} params - Parameters containing the user's ID.
		 * @returns {Promise<IWorkspaceEntity[] | WorkspaceOperationResult>} An array of workspace entities or an error object.
		 */
		get_workspaces: async ({ user_id }: GetWorkspacesParams): Promise<IWorkspaceEntity[] | WorkspaceOperationResult> => {
			try {
				const workspaces = await WorkspaceTable.findAll({
					include: [
						{ model: StatusTable, required: true },
						{ model: UsersTable, required: true, as: 'creator' }, // Assuming 'creator' alias for created_by user
						{
							model: WorkspaceUserTable,
							as: 'users', // Alias for WorkspaceUserTable association
							required: true, // Ensures only workspaces the user is part of are returned
							where: { id_user: user_id }, // Filter by user_id in WorkspaceUserTable
						},
					],
					// where: { id_status: 1 } // Optionally filter only active workspaces if needed at top level
				});
				return workspaces.map(ws => ws.get({ plain: true }));
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : 'Error fetching workspaces';
				return { error: message };
			}
		},

		/**
		 * @async
		 * @function getWorkspaceById
		 * @description Retrieves a specific workspace by its ID, ensuring the requesting user is part of it.
		 * @param {GetWorkspaceByIdParams} params - Parameters containing workspace ID and user ID.
		 * @returns {Promise<IWorkspaceEntity | null | WorkspaceOperationResult>} The workspace entity, null if not found, or an error object.
		 */
		get_workspace_by_id: async ({ id, user_id }: GetWorkspaceByIdParams): Promise<IWorkspaceEntity | null | WorkspaceOperationResult> => {
			try {
				const workspace = await WorkspaceTable.findOne({
					where: { id },
					include: [
						{ model: StatusTable, required: true },
						{ model: UsersTable, required: true, as: 'creator' },
						{
							model: WorkspaceUserTable,
							as: 'users',
							required: true, // Ensures the workspace is only returned if the user is part of it.
							where: { id_user: user_id },
						},
					],
				});
				return workspace ? workspace.get({ plain: true }) : null;
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : 'Error fetching workspace by ID';
				return { error: message };
			}
		},

		/**
		 * @async
		 * @function update
		 * @description Updates a workspace's name and/or description.
		 * Requires the user performing the update to be an owner or admin of the workspace.
		 * @param {UpdateWorkspaceParams} params - Parameters for updating the workspace.
		 * @returns {Promise<WorkspaceOperationResult>} Result of the operation.
		 */
		update: async ({
			id,
			name,
			description,
			user_id,
		}: UpdateWorkspaceParams): Promise<WorkspaceOperationResult> => {
			try {
				// Verify user's role in the workspace
				const userWorkspace = await WorkspaceUserTable.findOne({
					where: { id_workspace: id, id_user: user_id },
				});

				if (!userWorkspace || (userWorkspace.role !== 'owner' && userWorkspace.role !== 'admin')) {
					return { error: 'Insufficient permissions to update workspace' };
				}

				const updateData: Partial<IWorkspaceEntity> = {};
				if (name !== undefined) updateData.name = name;
				if (description !== undefined) updateData.description = description;

				// Perform update if there's data to update
				if (Object.keys(updateData).length > 0) {
					await WorkspaceTable.update(updateData, { where: { id, id_status: 1 } }); // Only update active workspaces
				}

				return { msg: 'Workspace updated' };
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : 'Error updating workspace';
				return { error: message };
			}
		},

		/**
		 * @async
		 * @function delete
		 * @description Marks a workspace as inactive (soft delete).
		 * Requires the user performing the action to be an owner of the workspace.
		 * @param {DeleteWorkspaceParams} params - Parameters for deleting the workspace.
		 * @returns {Promise<WorkspaceOperationResult>} Result of the operation.
		 */
		delete: async ({ id, user_id }: DeleteWorkspaceParams): Promise<WorkspaceOperationResult> => {
			try {
				// Verify if the user is an owner
				const userWorkspace = await WorkspaceUserTable.findOne({
					where: { id_workspace: id, id_user: user_id, role: 'owner' },
				});

				if (!userWorkspace) {
					return { error: 'Only workspace owners can delete a workspace' };
				}

				// Soft delete the workspace
				const [affectedRows] = await WorkspaceTable.update({ id_status: 2 }, { where: { id, id_status: 1 } });
				if (affectedRows === 0) {
					return { error: 'Workspace not found or already inactive.' };
				}
				return { msg: 'Workspace deleted' };
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : 'Error deleting workspace';
				return { error: message };
			}
		},

		/**
		 * @async
		 * @function addUser
		 * @description Adds a user to a workspace with a specified role.
		 * Requires the user performing the action to be an owner or admin.
		 * @param {AddUserToWorkspaceParams} params - Parameters for adding a user.
		 * @returns {Promise<WorkspaceOperationResult>} Result of the operation.
		 */
		add_user: async ({
			workspace_id,
			user_id, // User to be added
			role = 'member', // Default role
			added_by, // User performing the action
		}: AddUserToWorkspaceParams): Promise<WorkspaceOperationResult> => {
			try {
				// Verify permission of the user performing the action
				const adderWorkspace = await WorkspaceUserTable.findOne({
					where: { id_workspace: workspace_id, id_user: added_by },
				});

				if (!adderWorkspace || (adderWorkspace.role !== 'owner' && adderWorkspace.role !== 'admin')) {
					return { error: 'Insufficient permissions to add users to workspace' };
				}

				// Check if user is already part of the workspace
				const existingUser = await WorkspaceUserTable.findOne({
					where: { id_workspace: workspace_id, id_user: user_id },
				});

				if (existingUser) {
					return { error: 'User is already in this workspace' };
				}

				// Add the user to the workspace
				await WorkspaceUserTable.create({
					id_workspace: workspace_id,
					id_user: user_id,
					role,
				});

				return { msg: 'User added to workspace' };
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : 'Error adding user to workspace';
				return { error: message };
			}
		},

		/**
		 * @async
		 * @function removeUser
		 * @description Removes a user from a workspace.
		 * Requires the user performing the action to be an owner or admin.
		 * Prevents removal of the last owner.
		 * @param {RemoveUserFromWorkspaceParams} params - Parameters for removing a user.
		 * @returns {Promise<WorkspaceOperationResult>} Result of the operation.
		 */
		remove_user: async ({
			workspace_id,
			user_id, // User to be removed
			removed_by, // User performing the action
		}: RemoveUserFromWorkspaceParams): Promise<WorkspaceOperationResult> => {
			try {
				// Verify permission of the user performing the removal
				const removerWorkspace = await WorkspaceUserTable.findOne({
					where: { id_workspace: workspace_id, id_user: removed_by },
				});

				if (!removerWorkspace || (removerWorkspace.role !== 'owner' && removerWorkspace.role !== 'admin')) {
					return { error: 'Insufficient permissions to remove users from workspace' };
				}

				// Prevent removing the last owner
				if (removerWorkspace.role === 'owner' && user_id === removed_by) { // Check if trying to remove self as last owner
					const ownerCount = await WorkspaceUserTable.count({
						where: { id_workspace: workspace_id, role: 'owner' },
					});
					if (ownerCount <= 1) {
						return { error: 'Cannot remove the last owner of the workspace' };
					}
				}

				// Perform the removal
				const deletedCount = await WorkspaceUserTable.destroy({
					where: { id_workspace: workspace_id, id_user: user_id },
				});

				if (deletedCount === 0) {
					return { error: 'User not found in this workspace or already removed.' };
				}
				return { msg: 'User removed from workspace' };
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : 'Error removing user from workspace';
				return { error: message };
			}
		},

		/**
		 * @async
		 * @function updateUserRole
		 * @description Updates a user's role within a workspace.
		 * Requires the user performing the action to be an owner of the workspace.
		 * @param {UpdateUserRoleInWorkspaceParams} params - Parameters for updating the user's role.
		 * @returns {Promise<WorkspaceOperationResult>} Result of the operation.
		 */
		update_user_role: async ({
			workspace_id,
			user_id, // User whose role is being updated
			role, // New role
			updated_by, // User performing the update
		}: UpdateUserRoleInWorkspaceParams): Promise<WorkspaceOperationResult> => {
			try {
				// Verify the user performing the update is an owner
				const updaterWorkspace = await WorkspaceUserTable.findOne({
					where: { id_workspace: workspace_id, id_user: updated_by, role: 'owner' },
				});

				if (!updaterWorkspace) {
					return { error: 'Only workspace owners can update user roles' };
				}

				// Cannot change the role of the last owner to something else if they are the one being updated
				if (user_id === updated_by && role !== 'owner') {
					const ownerCount = await WorkspaceUserTable.count({
                        where: { id_workspace: workspace_id, role: 'owner' },
                    });
                    if (ownerCount <= 1) {
                        return { error: "Cannot change the role of the last owner." };
                    }
				}


				// Update the user's role
				const [affectedRows] = await WorkspaceUserTable.update( { role }, {
					where: { id_workspace: workspace_id, id_user: user_id },
				});

				if (affectedRows === 0) {
                    return { error: "User not found in workspace or role is already set to the desired value." };
                }
				return { msg: 'User role updated' };
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : 'Error updating user role';
				return { error: message };
			}
		},

		/**
		 * @async
		 * @function getWorkspaceUsers
		 * @description Retrieves all users associated with a specific workspace.
		 * Requires the requesting user to be a member of the workspace.
		 * @param {GetWorkspaceUsersParams} params - Parameters containing workspace ID and requesting user's ID.
		 * @returns {Promise<IWorkspaceUserEntity[] | WorkspaceOperationResult>} An array of workspace user entities or an error object.
		 */
		get_workspace_users: async ({ workspace_id, user_id }: GetWorkspaceUsersParams): Promise<IWorkspaceUserEntity[] | WorkspaceOperationResult> => {
			try {
				// Verify if the requesting user is part of the workspace
				const userAccess = await WorkspaceUserTable.findOne({
					where: { id_workspace: workspace_id, id_user: user_id },
				});

				if (!userAccess) {
					return { error: 'Access denied to workspace users' };
				}

				// Fetch all users in the workspace
				const users = await WorkspaceUserTable.findAll({
					where: { id_workspace: workspace_id },
					include: [{ model: UsersTable, required: true, attributes: ['id', 'username', 'email', 'name', 'avatar'] }], // Select specific user attributes
				});
				return users.map(u => u.get({ plain: true }));
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : 'Error fetching workspace users';
				return { error: message };
			}
		},
	};
}
