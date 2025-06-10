import { DataTypes } from 'sequelize'
import { db } from '../index.js'
import type { ISecurityRoleEntity } from '@entities/security.interface.js'

export const Roles_Table = db.define<ISecurityRoleEntity>(
	'users',
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		name: {
			type: DataTypes.STRING(255),
			allowNull: false,
			unique: true,
			set(value: string) {
				this.setDataValue('name', value.toLocaleLowerCase())
			}
		},
		description: {
			type: DataTypes.STRING(255)
		},
		tags: {
			type: DataTypes.JSONB
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
		tableName: 'roles',
		schema: 'security'
	}
)
