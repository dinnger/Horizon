import type { IWorkflowsEnvsEntity } from '@entities/workflows.envs.interface.js'
import DataTypes from 'sequelize'
import { db } from '../index.js'

export const WorkflowsEnvsTable = db.define<IWorkflowsEnvsEntity>(
	'envs',
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		id_flow: {
			type: DataTypes.INTEGER
		},
		data: {
			type: DataTypes.JSONB
		},
		id_status: {
			type: DataTypes.INTEGER,
			defaultValue: 1
		},
		created_by: {
			type: DataTypes.INTEGER
		},
		id_workspace: {
			type: DataTypes.INTEGER,
			allowNull: true
		}
	},
	{
		schema: 'workflows'
	}
)
