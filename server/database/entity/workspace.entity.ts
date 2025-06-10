import type { IWorkspaceEntity } from '@entities/workspace.interface.js'
import { DataTypes, Op } from 'sequelize'
import { db } from '../index.js'
import envs from '../../../shared/utils/envs.js'

export const Workspace_Table = db.define<IWorkspaceEntity>(
	'workspace',
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		name: {
			type: DataTypes.STRING(255),
			allowNull: false,
			validate: {
				isUniqueWhenStatusIsOne: async function (value: string) {
					if (this.id_status === 1) {
						const existingWorkspace = await Workspace_Table.findOne({
							where: {
								id: {
									[Op.not]: this.id as number
								},
								name: {
									[envs.DATABASE_DIALECT === 'postgres' ? Op.iLike : Op.like]: `%${value}%`
								},
								id_status: 1
							}
						})
						if (existingWorkspace) {
							throw new Error('Name must be unique when id_status is 1')
						}
					}
				}
			}
		},
		description: {
			type: DataTypes.STRING(500)
		},
		settings: {
			type: DataTypes.JSONB,
			defaultValue: {}
		},
		is_default: {
			type: DataTypes.BOOLEAN,
			defaultValue: false
		},
		id_status: {
			type: DataTypes.INTEGER,
			defaultValue: 1
		},
		created_by: {
			type: DataTypes.INTEGER
		},
		created_at: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW
		},
		updated_at: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW
		}
	},
	{
		tableName: 'workspaces',
		schema: 'security',
		timestamps: true,
		createdAt: 'created_at',
		updatedAt: 'updated_at'
	}
)
