import type { IGlobalStatusEntity } from '@entities/global.interface.js'
import { DataTypes } from 'sequelize'
import { db } from '../index.js'

export const Status_Table = db.define<IGlobalStatusEntity>(
	'status',
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false
		},
		description: {
			type: DataTypes.STRING
		},
		color: {
			type: DataTypes.STRING
		}
	},
	{
		tableName: 'status',
		schema: 'global'
	}
)
