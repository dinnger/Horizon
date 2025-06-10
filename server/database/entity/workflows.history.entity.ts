import type { IWorkflowsWorkflowsHistoryEntity } from '@entities/workflows.history.interface.js'
import DataTypes from 'sequelize'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../index.js'

export type { IWorkflowsWorkflowsHistoryEntity as default }

export const WorkflowsHistoryTable = db.define<IWorkflowsWorkflowsHistoryEntity>(
	'history',
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		id_flow: {
			type: DataTypes.INTEGER
		},
		name: {
			type: DataTypes.STRING(20),
			allowNull: false
		},
		description: {
			type: DataTypes.STRING(255)
		},
		flow: {
			type: DataTypes.JSONB
		},
		version: {
			type: DataTypes.STRING(20),
			defaultValue: '0.0.1'
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
