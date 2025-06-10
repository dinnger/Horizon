import { DataTypes } from 'sequelize'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../index.js'
import type { IProjectsProjectsEntity } from '@entities/projects.interface.js'

export const ProjectsTable = db.define<IProjectsProjectsEntity>(
	'projects',
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		uid: {
			type: DataTypes.STRING(255),
			allowNull: false,
			defaultValue: () => uuidv4()
		},
		name: {
			type: DataTypes.STRING(255),
			allowNull: false,
			unique: true
		},
		description: {
			type: DataTypes.STRING(255)
		},
		shared_with: {
			type: DataTypes.ARRAY(DataTypes.INTEGER)
		},
		version: {
			type: DataTypes.STRING(20),
			defaultValue: '0.0.1'
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
		},
		transport_type: {
			type: DataTypes.STRING(50),
			defaultValue: 'empty'
		},
		transport_pattern: {
			type: DataTypes.STRING(50),
			allowNull: true
		},
		transport_config: {
			type: DataTypes.JSONB,
			allowNull: true
		}
	},
	{
		tableName: 'projects',
		schema: 'projects',
		indexes: [
			{
				unique: true,
				fields: [db.fn('lower', db.col('name')), 'id_workspace'],
				name: 'nameUniqueProject'
			}
		]
	}
)
