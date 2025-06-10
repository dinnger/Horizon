import type { ISecuritySecretEntity } from '@entities/security.secret.interface.js'
import { DataTypes, Op } from 'sequelize'
import { db } from '../index.js'
import envs from '../../../shared/utils/envs.js'

export const Secret_Table = db.define<ISecuritySecretEntity>(
	'databaseModel',
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false,
			validate: {
				isUniqueWhenStatusIsOne: async function (value: string) {
					if (this.id_status === 1) {
						const existingDeployment = await Secret_Table.findOne({
							where: {
								id: {
									[Op.not]: this.id as number
								},
								name: {
									[envs.DATABASE_DIALECT === 'postgres' ? Op.iLike : Op.like]: `%${value}%`
								},
								id_status: 1
							}
						})
						if (existingDeployment) {
							throw new Error('Name must be unique when id_status is 1')
						}
					}
				}
			}
		},
		description: {
			type: DataTypes.STRING
		},
		type: {
			type: DataTypes.STRING
		},
		subType: {
			type: DataTypes.STRING
		},
		value: {
			type: DataTypes.TEXT
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
		tableName: 'secret',
		schema: 'security'
	}
)
