import type { IWorkspaceEntity, IWorkspaceUserEntity } from '@entities/workspace.interface.js'
import { Workspace_Table } from '../database/entity/workspace.entity.js'
import { WorkspaceUser_Table } from '../database/entity/workspace.users.entity.js'
import { Status_Table } from '../database/entity/global.status.entity.js'
import { Users_Table } from '../database/entity/security.users.entity.js'

export function workspaceService() {
	return {
		// workspace/new
		new: async ({
			name,
			description,
			created_by
		}: {
			name: string
			description?: string
			created_by: number
		}) => {
			try {
				const workspace = await Workspace_Table.create({
					name,
					description,
					created_by,
					id_status: 1
				})

				// Add creator as owner
				await WorkspaceUser_Table.create({
					id_workspace: workspace.id,
					id_user: created_by,
					role: 'owner'
				})

				return { msg: 'Workspace created', workspace }
			} catch (error) {
				let message = 'Error'
				if (error instanceof Error) message = error.toString()
				return { error: message }
			}
		},

		// workspace/get_workspaces
		get_workspaces: async ({ user_id }: { user_id: number }) => {
			try {
				return await Workspace_Table.findAll({
					include: [
						{
							model: Status_Table,
							required: true
						},
						{
							model: Users_Table,
							required: true
						},
						{
							model: WorkspaceUser_Table,
							as: 'users',
							required: false,
							where: {
								id: user_id
							}
						}
					]
				})
			} catch (error) {
				let message = 'Error'
				if (error instanceof Error) message = error.toString()
				return { error: message }
			}
		},

		// workspace/get_workspace_by_id
		get_workspace_by_id: async ({ id, user_id }: { id: number; user_id: number }) => {
			try {
				return await Workspace_Table.findOne({
					where: { id },
					include: [
						{
							model: Status_Table,
							required: true
						},
						{
							model: Users_Table,
							required: true
						},
						{
							model: WorkspaceUser_Table,
							as: 'users',
							required: false,
							where: {
								id: user_id
							}
						}
					]
				})
			} catch (error) {
				let message = 'Error'
				if (error instanceof Error) message = error.toString()
				return { error: message }
			}
		},

		// workspace/update
		update: async ({
			id,
			name,
			description,
			user_id
		}: {
			id: number
			name?: string
			description?: string
			user_id: number
		}) => {
			try {
				// Check if user has admin or owner role
				const userWorkspace = await WorkspaceUser_Table.findOne({
					where: {
						id_workspace: id,
						id_user: user_id
					}
				})

				if (!userWorkspace || (userWorkspace.role !== 'owner' && userWorkspace.role !== 'admin')) {
					return { error: 'Insufficient permissions' }
				}

				const updateData: Partial<IWorkspaceEntity> = {}
				if (name !== undefined) updateData.name = name
				if (description !== undefined) updateData.description = description

				await Workspace_Table.update(updateData, {
					where: { id }
				})

				return { msg: 'Workspace updated' }
			} catch (error) {
				let message = 'Error'
				if (error instanceof Error) message = error.toString()
				return { error: message }
			}
		},

		// workspace/delete
		delete: async ({ id, user_id }: { id: number; user_id: number }) => {
			try {
				// Check if user is owner
				const userWorkspace = await WorkspaceUser_Table.findOne({
					where: {
						id_workspace: id,
						id_user: user_id,
						role: 'owner'
					}
				})

				if (!userWorkspace) {
					return { error: 'Only workspace owners can delete workspace' }
				}

				// Soft delete by setting status to inactive
				await Workspace_Table.update({ id_status: 2 }, { where: { id } })

				return { msg: 'Workspace deleted' }
			} catch (error) {
				let message = 'Error'
				if (error instanceof Error) message = error.toString()
				return { error: message }
			}
		},

		// workspace/add_user
		add_user: async ({
			workspace_id,
			user_id,
			role = 'member',
			added_by
		}: {
			workspace_id: number
			user_id: number
			role?: 'owner' | 'admin' | 'member' | 'viewer'
			added_by: number
		}) => {
			try {
				// Check if the user adding has admin or owner permissions
				const adderWorkspace = await WorkspaceUser_Table.findOne({
					where: {
						id_workspace: workspace_id,
						id_user: added_by
					}
				})

				if (!adderWorkspace || (adderWorkspace.role !== 'owner' && adderWorkspace.role !== 'admin')) {
					return { error: 'Insufficient permissions to add users' }
				}

				// Check if user is already in workspace
				const existingUser = await WorkspaceUser_Table.findOne({
					where: {
						id_workspace: workspace_id,
						id_user: user_id
					}
				})

				if (existingUser) {
					return { error: 'User already in workspace' }
				}

				await WorkspaceUser_Table.create({
					id_workspace: workspace_id,
					id_user: user_id,
					role
				})

				return { msg: 'User added to workspace' }
			} catch (error) {
				let message = 'Error'
				if (error instanceof Error) message = error.toString()
				return { error: message }
			}
		},

		// workspace/remove_user
		remove_user: async ({
			workspace_id,
			user_id,
			removed_by
		}: {
			workspace_id: number
			user_id: number
			removed_by: number
		}) => {
			try {
				// Check if the user removing has admin or owner permissions
				const removerWorkspace = await WorkspaceUser_Table.findOne({
					where: {
						id_workspace: workspace_id,
						id_user: removed_by
					}
				})

				if (!removerWorkspace || (removerWorkspace.role !== 'owner' && removerWorkspace.role !== 'admin')) {
					return { error: 'Insufficient permissions to remove users' }
				}

				// Don't allow removing the last owner
				if (removerWorkspace.role === 'owner') {
					const ownerCount = await WorkspaceUser_Table.count({
						where: {
							id_workspace: workspace_id,
							role: 'owner'
						}
					})

					if (ownerCount <= 1 && user_id === removed_by) {
						return { error: 'Cannot remove the last owner of the workspace' }
					}
				}

				await WorkspaceUser_Table.destroy({
					where: {
						id_workspace: workspace_id,
						id_user: user_id
					}
				})

				return { msg: 'User removed from workspace' }
			} catch (error) {
				let message = 'Error'
				if (error instanceof Error) message = error.toString()
				return { error: message }
			}
		},

		// workspace/update_user_role
		update_user_role: async ({
			workspace_id,
			user_id,
			role,
			updated_by
		}: {
			workspace_id: number
			user_id: number
			role: 'owner' | 'admin' | 'member' | 'viewer'
			updated_by: number
		}) => {
			try {
				// Check if the user updating has owner permissions
				const updaterWorkspace = await WorkspaceUser_Table.findOne({
					where: {
						id_workspace: workspace_id,
						id_user: updated_by,
						role: 'owner'
					}
				})

				if (!updaterWorkspace) {
					return { error: 'Only workspace owners can update user roles' }
				}

				await WorkspaceUser_Table.update(
					{ role },
					{
						where: {
							id_workspace: workspace_id,
							id_user: user_id
						}
					}
				)

				return { msg: 'User role updated' }
			} catch (error) {
				let message = 'Error'
				if (error instanceof Error) message = error.toString()
				return { error: message }
			}
		},

		// workspace/get_workspace_users
		get_workspace_users: async ({ workspace_id, user_id }: { workspace_id: number; user_id: number }) => {
			try {
				// Check if user has access to this workspace
				const userWorkspace = await WorkspaceUser_Table.findOne({
					where: {
						id_workspace: workspace_id,
						id_user: user_id
					}
				})

				if (!userWorkspace) {
					return { error: 'Access denied to workspace' }
				}

				return await WorkspaceUser_Table.findAll({
					where: { id_workspace: workspace_id },
					include: [
						{
							model: Users_Table,
							required: true
						}
					]
				})
			} catch (error) {
				let message = 'Error'
				if (error instanceof Error) message = error.toString()
				return { error: message }
			}
		}
	}
}
