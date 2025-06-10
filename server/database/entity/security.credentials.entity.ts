import { DataTypes } from 'sequelize'
import { db } from '../index.js'
import type { ISecurityCredentialEntity } from '@entities/security.interface.js'

export const Credentials_Table = db.define<ISecurityCredentialEntity>(
	'credentials',
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		name: {
			type: DataTypes.STRING(255),
			allowNull: false
		},
		type: {
			type: DataTypes.STRING(255),
			allowNull: false
		},
		properties: {
			type: DataTypes.STRING,
			allowNull: false
		},
		result: {
			type: DataTypes.STRING,
			allowNull: false
		},
		id_workspace: {
			type: DataTypes.INTEGER,
			allowNull: true
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
		tableName: 'credentials',
		schema: 'security'
	}
)
