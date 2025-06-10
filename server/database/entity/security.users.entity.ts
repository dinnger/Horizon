import { DataTypes } from 'sequelize'
import { db } from '../index.js'
import type { ISecurityUserEntity } from '@entities/security.interface.js'

export const Users_Table = db.define<ISecurityUserEntity>(
	'users',
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
		alias: {
			type: DataTypes.STRING(255),
			allowNull: false
		},
		password: {
			type: DataTypes.STRING(255)
		},
		is_temporal: {
			type: DataTypes.BOOLEAN
		},
		id_google: {
			type: DataTypes.JSONB,
			allowNull: true
		},
		id_status: {
			type: DataTypes.INTEGER,
			defaultValue: 1
		},
		last_login: {
			type: DataTypes.DATE,
			allowNull: true
		}
	},
	{
		defaultScope: {
			attributes: {
				exclude: ['password', 'id_google', 'last_login', 'is_temporal']
			}
		},
		tableName: 'users',
		schema: 'security'
	}
)
