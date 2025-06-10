import type { Sequelize } from 'sequelize'
import { connect } from './connect.js'
import bcrypt from 'bcrypt'
import 'dotenv/config'

export const db: Sequelize = connect
// Crea los esquemas si no existen
async function initialize_connection() {
	console.log('Creando esquemas')
	await connect.createSchema('global', { logging: false })
	await connect.createSchema('workflows', { logging: false })
	await connect.createSchema('projects', { logging: false })
	await connect.createSchema('security', { logging: false })
	await connect.createSchema('workspace', { logging: false })
	const associate = await import('./associate.js')
	console.log('Creando asociaciones')
	await associate.load()
}

// Semilla de datos para status
async function initialize_status() {
	const { Status_Table } = await import('./entity/global.status.entity.js')
	const status = await Status_Table.findAll()
	if (status.length === 0) {
		await Status_Table.bulkCreate([
			{
				id: 1,
				name: 'Active',
				description: 'Estado activo',
				color: '#3498DB'
			},
			{
				id: 2,
				name: 'Inactive',
				description: 'Estado inactivo',
				color: '#F39C12'
			},
			{
				id: 3,
				name: 'Deploying',
				description: 'Estado de despliegue',
				color: '#3498DB'
			},
			{
				id: 4,
				name: 'Error',
				description: 'Estado de error',
				color: '#F39C12'
			},
			{
				id: 5,
				name: 'Canceled',
				description: 'Estado cancelado',
				color: '#F39C12'
			},
			{
				id: 6,
				name: 'Processing',
				description: 'Estado procesando',
				color: '#3498DB'
			},
			{
				id: 7,
				name: 'Finished',
				description: 'Estado finalizado',
				color: '#3498DB'
			}
		])
	}
}

// Semilla de datos para usuario
async function initialize_users() {
	const { Users_Table } = await import('./entity/security.users.entity.js')
	const users = await Users_Table.findAll()
	if (users.length === 0) {
		const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
		let password = ''
		for (let i = 0; i < 10; i++) {
			password += characters.charAt(Math.floor(Math.random() * characters.length))
		}
		console.log(`contraseña temporal ===> ${password} <===`)
		const saltRounds = 10
		const hash = bcrypt.hashSync(password, saltRounds)
		await Users_Table.create({
			id: 1,
			name: 'admin',
			alias: 'admin',
			password: hash,
			is_temporal: true,
			id_google: null,
			id_status: 1,
			last_login: null
		})
	}
}

// Semilla de datos para workspace por defecto
async function initialize_workspaces() {
	const { Workspace_Table } = await import('./entity/workspace.entity.js')
	const { WorkspaceUser_Table } = await import('./entity/workspace.users.entity.js')
	const workspaces = await Workspace_Table.findAll()
	if (workspaces.length === 0) {
		const defaultWorkspace = await Workspace_Table.create({
			id: 1,
			name: 'Default Workspace',
			description: 'Default workspace for all users',
			created_by: 1,
			id_status: 1
		})

		// Assign the admin user as owner of the default workspace
		await WorkspaceUser_Table.create({
			id_workspace: defaultWorkspace.id,
			id_user: 1,
			role: 'owner'
		})
	}
}

export const verify_connection = async () => {
	try {
		await connect.authenticate()
		await initialize_connection()
		await initialize_status()
		await initialize_users()
		await initialize_workspaces()
		return true
	} catch (error) {
		console.log(error)
		return false
	}
}
