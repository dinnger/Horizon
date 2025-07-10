import { DataTypes, Model, type Optional } from 'sequelize'
import { sequelize } from '../config/database'
import Workspace from './Workspace'
import type { IProjectServer, IProjectCreate } from '@shared/interfaces/standardized.js'

// Interfaces legacy para compatibilidad
export interface ProjectAttributes extends IProjectServer {}
export interface ProjectCreationAttributes extends IProjectCreate {}

export class Project extends Model<ProjectAttributes, ProjectCreationAttributes> implements ProjectAttributes {
	public id!: string
	public name!: string
	public description!: string
	public workspaceId!: string
	public status!: 'active' | 'inactive' | 'archived'
	public transportType?: 'tcp' | 'rabbitmq' | 'kafka' | 'nats' | 'http' | 'websocket' | 'mqtt'
	public transportPattern?: 'request-response' | 'publish-subscribe' | 'push-pull' | 'stream'
	public transportConfig?: object

	// timestamps!
	public readonly createdAt!: Date
	public readonly updatedAt!: Date
}

Project.init(
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false
		},
		description: {
			type: DataTypes.TEXT,
			allowNull: false
		},
		workspaceId: {
			type: DataTypes.UUID,
			allowNull: false,
			references: {
				model: Workspace,
				key: 'id'
			},
			onUpdate: 'CASCADE',
			onDelete: 'CASCADE'
		},
		status: {
			type: DataTypes.ENUM('active', 'inactive', 'archived'),
			allowNull: false,
			defaultValue: 'active'
		},
		transportType: {
			type: DataTypes.ENUM('tcp', 'rabbitmq', 'kafka', 'nats', 'http', 'websocket', 'mqtt'),
			allowNull: true
		},
		transportPattern: {
			type: DataTypes.ENUM('request-response', 'publish-subscribe', 'push-pull', 'stream'),
			allowNull: true
		},
		transportConfig: {
			type: DataTypes.JSON,
			allowNull: true
		},
		createdAt: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW
		},
		updatedAt: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW
		}
	},
	{
		sequelize,
		modelName: 'Project',
		tableName: 'projects',
		indexes: [
			{
				fields: ['workspace_id']
			},
			{
				fields: ['status']
			},
			{
				fields: ['workspace_id', 'status']
			}
		]
	}
)

// Associations
Project.belongsTo(Workspace, { foreignKey: 'workspaceId', as: 'workspace' })
Workspace.hasMany(Project, { foreignKey: 'workspaceId', as: 'projects' })

export default Project
