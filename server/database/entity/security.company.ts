import type { ISecurityCompanyEntity } from '@entities/security.interface.js'
import { DataTypes } from 'sequelize'
import { db } from '../index.js'

export const Company_Table = db.define<ISecurityCompanyEntity>(
	'company',
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
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
		version: {
			type: DataTypes.STRING(20),
			allowNull: false,
			defaultValue: '0.0.1'
		},
		properties: {
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
		tableName: 'company',
		schema: 'security'
	}
)
