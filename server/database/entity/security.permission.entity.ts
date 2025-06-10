import type { CreationOptional, Model } from 'sequelize'
import { DataTypes } from 'sequelize'
import { db } from '../index.js'

import type { ISecurityPermissionEntity } from '@entities/security.interface.js'

export const Permission_Table = db.define<ISecurityPermissionEntity>(
	'users',
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		slug: {
			type: DataTypes.STRING(255),
			allowNull: false,
			unique: true,
			set(value: string) {
				this.setDataValue('slug', value.toLocaleLowerCase())
			}
		},
		name: {
			type: DataTypes.STRING(255),
			allowNull: false,
			set(value: string) {
				this.setDataValue('name', value.toLocaleLowerCase())
			}
		},
		description: {
			type: DataTypes.STRING(255)
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
		tableName: 'permissions',
		schema: 'security'
	}
)
