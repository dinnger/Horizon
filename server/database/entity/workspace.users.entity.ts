import type { IWorkspaceUserEntity } from '@entities/workspace.interface.js'
import { DataTypes } from 'sequelize'
import { db } from '../index.js'

export const WorkspaceUser_Table = db.define<IWorkspaceUserEntity>(
	'workspace_user',
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		id_workspace: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		id_user: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		role: {
			type: DataTypes.ENUM('owner', 'admin', 'member', 'viewer'),
			defaultValue: 'member'
		},
		is_active: {
			type: DataTypes.BOOLEAN,
			defaultValue: true
		},
		joined_at: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW
		}
	},
	{
		tableName: 'workspace_users',
		schema: 'security',
		timestamps: false,
		indexes: [
			{
				unique: true,
				fields: ['id_workspace', 'id_user'],
				name: 'workspace_user_unique'
			}
		]
	}
)
