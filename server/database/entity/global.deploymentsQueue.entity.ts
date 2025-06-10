import type { IGlobalDeploymentsQueueEntity } from '@entities/global.deploymentsQueue.interface.js'
import { DataTypes } from 'sequelize'
import { db } from '../index.js'
import { file } from 'jszip'

export const DeploymentsQueue_Table = db.define<IGlobalDeploymentsQueueEntity>(
	'deploymentsQueue',
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		id_deployment: {
			type: DataTypes.INTEGER
		},
		id_flow: {
			type: DataTypes.INTEGER
		},
		id_flow_history: {
			type: DataTypes.INTEGER
		},
		description: {
			type: DataTypes.STRING
		},
		flow: {
			type: DataTypes.JSONB
		},
		meta: {
			type: DataTypes.JSONB
		},
		id_status: {
			type: DataTypes.INTEGER,
			defaultValue: 1
		},
		created_by: {
			type: DataTypes.INTEGER
		}
	},
	{
		defaultScope: {
			attributes: {
				exclude: ['file']
			}
		},
		tableName: 'deploymentsQueue',
		schema: 'global'
	}
)
