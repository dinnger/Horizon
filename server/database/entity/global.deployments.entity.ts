import type { IGlobalDeploymentsEntity } from '@entities/global.deployments.interface.js'
import { DataTypes, Op } from 'sequelize'
import { db } from '../index.js'
import envs from '@shared/utils/envs.js'

export const Deployments_Table = db.define<IGlobalDeploymentsEntity>(
	'deployments',
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
						const existingDeployment = await Deployments_Table.findOne({
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
		plugin_name: {
			type: DataTypes.STRING
		},
		plugin: {
			type: DataTypes.STRING
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
		tableName: 'deployments',
		schema: 'global'
	}
)
