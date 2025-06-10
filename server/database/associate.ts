import { Deployments_Table } from './entity/global.deployments.entity.js'
import { Status_Table } from './entity/global.status.entity.js'
import { ProjectsTable } from './entity/projects.projects.entity.js'
import { Company_Table } from './entity/security.company.js'
import { Permission_Table } from './entity/security.permission.entity.js'
import { Roles_Table } from './entity/security.roles.entity.js'
import { Users_Table } from './entity/security.users.entity.js'
import { WorkflowsFlowTable } from './entity/workflows.flows.entity.js'
import { DeploymentsQueue_Table } from './entity/global.deploymentsQueue.entity.js'
import { WorkflowsHistoryTable } from './entity/workflows.history.entity.js'
import { Secret_Table } from './entity/security.secret.entity.js'
import { WorkflowsEnvsTable } from './entity/workflows.envs.entity.js'
import envs from '../../shared/utils/envs.js'
import { Credentials_Table } from './entity/security.credentials.entity.js'
import { Workspace_Table } from './entity/workspace.entity.js'
import { WorkspaceUser_Table } from './entity/workspace.users.entity.js'

export const load = async () => {
	await Users_Table.sync({ alter: true })
	await Company_Table.sync({ alter: true })
	await Status_Table.sync({ alter: true })
	await Roles_Table.sync({ alter: true })
	await Permission_Table.sync({ alter: true })
	await WorkflowsFlowTable.sync({ alter: true })
	await ProjectsTable.sync({ alter: true })
	await Deployments_Table.sync({ alter: true })
	await DeploymentsQueue_Table.sync({ alter: true })
	await WorkflowsHistoryTable.sync({ alter: true })
	await Secret_Table.sync({ alter: true })
	await WorkflowsEnvsTable.sync({ alter: true })
	await Credentials_Table.sync({ alter: true })
	await Workspace_Table.sync({ alter: true })
	await WorkspaceUser_Table.sync({ alter: true })

	const constraints = envs.DATABASE_DIALECT !== 'sqlite'

	Company_Table.hasOne(Users_Table, {
		foreignKey: 'id',
		sourceKey: 'created_by',
		constraints
	})

	Company_Table.hasOne(Status_Table, {
		foreignKey: 'id',
		sourceKey: 'id_status',
		constraints
	})

	Users_Table.hasOne(Status_Table, {
		foreignKey: 'id',
		sourceKey: 'id_status',
		constraints
	})

	Roles_Table.hasOne(Users_Table, {
		foreignKey: 'id',
		sourceKey: 'created_by',
		constraints
	})

	Roles_Table.hasOne(Status_Table, {
		foreignKey: 'id',
		sourceKey: 'id_status',
		constraints
	})

	Permission_Table.hasOne(Users_Table, {
		foreignKey: 'id',
		sourceKey: 'created_by',
		constraints
	})

	Permission_Table.hasOne(Status_Table, {
		foreignKey: 'id',
		sourceKey: 'id_status',
		constraints
	})

	Deployments_Table.hasOne(Users_Table, {
		foreignKey: 'id',
		sourceKey: 'created_by',
		constraints
	})

	Deployments_Table.hasOne(Status_Table, {
		foreignKey: 'id',
		sourceKey: 'id_status',
		constraints
	})

	DeploymentsQueue_Table.hasOne(WorkflowsFlowTable, {
		foreignKey: 'id',
		sourceKey: 'id_flow',
		constraints
	})

	DeploymentsQueue_Table.hasOne(WorkflowsHistoryTable, {
		foreignKey: 'id',
		sourceKey: 'id_flow_history',
		constraints
	})

	DeploymentsQueue_Table.hasOne(Deployments_Table, {
		foreignKey: 'id',
		sourceKey: 'id_deployment',
		constraints
	})

	DeploymentsQueue_Table.hasOne(Users_Table, {
		foreignKey: 'id',
		sourceKey: 'created_by',
		constraints
	})

	DeploymentsQueue_Table.hasOne(Status_Table, {
		foreignKey: 'id',
		sourceKey: 'id_status',
		constraints
	})

	WorkflowsFlowTable.hasOne(ProjectsTable, {
		foreignKey: 'id',
		sourceKey: 'id_project',
		constraints
	})

	WorkflowsFlowTable.hasOne(WorkflowsEnvsTable, {
		foreignKey: 'id',
		sourceKey: 'id_envs',
		as: 'variables',
		constraints
	})

	WorkflowsFlowTable.hasOne(Status_Table, {
		foreignKey: 'id',
		sourceKey: 'id_status',
		constraints
	})

	WorkflowsFlowTable.hasOne(Users_Table, {
		foreignKey: 'id',
		sourceKey: 'created_by',
		constraints
	})

	WorkflowsFlowTable.hasOne(Deployments_Table, {
		foreignKey: 'id',
		sourceKey: 'id_deploy',
		constraints
	})

	WorkflowsHistoryTable.hasOne(WorkflowsFlowTable, {
		foreignKey: 'id',
		sourceKey: 'id_flow',
		constraints
	})

	WorkflowsHistoryTable.hasOne(Users_Table, {
		foreignKey: 'id',
		sourceKey: 'created_by',
		constraints
	})

	WorkflowsHistoryTable.hasOne(Status_Table, {
		foreignKey: 'id',
		sourceKey: 'id_status',
		constraints
	})

	ProjectsTable.hasMany(WorkflowsFlowTable, {
		foreignKey: 'id_project',
		sourceKey: 'id',
		constraints
	})

	ProjectsTable.hasOne(Status_Table, {
		foreignKey: 'id',
		sourceKey: 'id_status',
		constraints
	})

	ProjectsTable.hasOne(Users_Table, {
		foreignKey: 'id',
		sourceKey: 'created_by',
		constraints
	})

	Secret_Table.hasOne(Users_Table, {
		foreignKey: 'id',
		sourceKey: 'created_by',
		constraints
	})

	Secret_Table.hasOne(Status_Table, {
		foreignKey: 'id',
		sourceKey: 'id_status',
		constraints
	})

	Credentials_Table.hasOne(Users_Table, {
		foreignKey: 'id',
		sourceKey: 'created_by',
		constraints
	})

	Credentials_Table.hasOne(Status_Table, {
		foreignKey: 'id',
		sourceKey: 'id_status',
		constraints
	})

	WorkflowsEnvsTable.hasOne(Status_Table, {
		foreignKey: 'id',
		sourceKey: 'id_status',
		constraints
	})

	WorkflowsEnvsTable.hasOne(Users_Table, {
		foreignKey: 'id',
		sourceKey: 'created_by',
		constraints
	})
	WorkflowsEnvsTable.hasOne(WorkflowsFlowTable, {
		foreignKey: 'id',
		sourceKey: 'id_flow',
		constraints
	})

	WorkspaceUser_Table.hasOne(Workspace_Table, {
		foreignKey: 'id',
		sourceKey: 'id_workspace',
		constraints
	})

	Workspace_Table.hasMany(WorkspaceUser_Table, {
		foreignKey: 'id_workspace',
		sourceKey: 'id',
		constraints
	})

	// Workspace associations
	Workspace_Table.hasOne(Users_Table, {
		foreignKey: 'id',
		sourceKey: 'created_by',
		constraints
	})

	Workspace_Table.hasOne(Status_Table, {
		foreignKey: 'id',
		sourceKey: 'id_status',
		constraints
	})

	// Many-to-many relationship between users and workspaces
	Workspace_Table.belongsToMany(Users_Table, {
		through: WorkspaceUser_Table,
		foreignKey: 'id_workspace',
		otherKey: 'id_user',
		as: 'users'
	})

	Users_Table.belongsToMany(Workspace_Table, {
		through: WorkspaceUser_Table,
		foreignKey: 'id_user',
		otherKey: 'id_workspace',
		as: 'workspaces'
	})

	// Workspace foreign key relationships
	ProjectsTable.hasOne(Workspace_Table, {
		foreignKey: 'id',
		sourceKey: 'id_workspace',
		constraints
	})

	WorkflowsFlowTable.hasOne(Workspace_Table, {
		foreignKey: 'id',
		sourceKey: 'id_workspace',
		constraints
	})

	WorkflowsHistoryTable.hasOne(Workspace_Table, {
		foreignKey: 'id',
		sourceKey: 'id_workspace',
		constraints
	})

	WorkflowsEnvsTable.hasOne(Workspace_Table, {
		foreignKey: 'id',
		sourceKey: 'id_workspace',
		constraints
	})

	Secret_Table.hasOne(Workspace_Table, {
		foreignKey: 'id',
		sourceKey: 'id_workspace',
		constraints
	})

	Credentials_Table.hasOne(Workspace_Table, {
		foreignKey: 'id',
		sourceKey: 'id_workspace',
		constraints
	})

	Permission_Table.hasOne(Workspace_Table, {
		foreignKey: 'id',
		sourceKey: 'id_workspace',
		constraints
	})

	Roles_Table.hasOne(Workspace_Table, {
		foreignKey: 'id',
		sourceKey: 'id_workspace',
		constraints
	})
}
