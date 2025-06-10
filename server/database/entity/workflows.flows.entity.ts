import type { IWorkflowsFlowsEntity } from '@entities/workflows.flows.interface.js'
import DataTypes from 'sequelize'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../index.js'

export type { IWorkflowsFlowsEntity as default }

export const WorkflowsFlowTable = db.define<IWorkflowsFlowsEntity>(
	'workflow',
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		id_project: {
			type: DataTypes.INTEGER
		},
		uid: {
			type: DataTypes.STRING(255),
			allowNull: false,
			defaultValue: () => uuidv4()
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
		shared_with: {
			type: DataTypes.ARRAY(DataTypes.INTEGER)
		},
		version: {
			type: DataTypes.STRING(20),
			defaultValue: '0.0.1'
		},
		id_deploy: {
			type: DataTypes.INTEGER
		},
		id_envs: {
			type: DataTypes.INTEGER
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
		schema: 'workflows',
		indexes: [
			{
				unique: true,
				fields: ['name', 'id_project'],
				name: 'nameUnique'
			}
		]
	}
)
