import type { ISecuritySecretEntity } from '@entities/security.secret.interface.js'
import { utils_map_json } from '../../../shared/utils/utilities.js'
import { Status_Table } from '../../database/entity/global.status.entity.js'
import { Secret_Table } from '../../database/entity/security.secret.entity.js'
import { Users_Table } from '../../database/entity/security.users.entity.js'
import { decrypt, encrypt } from '../../modules/security.module.js'

export function securitySecretService() {
	return {
		// security/secret/new
		new: async ({
			name,
			description,
			type,
			subType,
			value
		}: {
			name: string
			description: string
			type: 'DATABASE' | 'VARIABLES'
			subType?: 'MYSQL' | 'POSTGRES' | 'SQLITE' | 'MARIADB' | 'MSSQL' | 'ORACLE'
			value: string
		}) => {
			try {
				const eValue = encrypt(value)
				await Secret_Table.create({
					name,
					description,
					type,
					subType: type === 'DATABASE' ? subType : undefined,
					value: eValue,
					created_by: 1
				})
				return { msg: 'Modelo creado exitosamente' }
			} catch (error) {
				let message = 'Error'
				if (error instanceof Error) message = error.toString()
				return { error: message }
			}
		},
		// security/secret/get
		get: async ({ id }: { id: number }) => {
			try {
				const secret = await Secret_Table.findOne({
					where: {
						id,
						id_status: 1
					}
				})
				if (secret?.value) secret.value = decrypt(secret.value)
				return { secret }
			} catch (error) {
				let message = 'Error'
				if (error instanceof Error) message = error.toString()
				return { error: message }
			}
		},
		// security/secret/getByName
		getByName: async ({ type, subType, name }: { type: string; subType?: string; name: string }): Promise<object | null> => {
			try {
				const secrets = await Secret_Table.findOne({
					attributes: ['type', 'subType', 'name', 'value'],
					where: {
						type: type.toUpperCase(),
						subType: subType ? subType.toUpperCase() : undefined,
						name: name.toUpperCase(),
						id_status: 1
					}
				})
				if (!secrets?.value) return null
				const secretValue = decrypt(secrets.value)
				const secret = {
					type: secrets.type,
					subType: secrets.subType,
					name: secrets.name,
					value: JSON.parse(secretValue)
				}
				const vars = createEnvs(secret as ISecuritySecretEntity)
				return vars
			} catch (error) {
				let message = 'Error'
				if (error instanceof Error) message = error.toString()
				console.log(error)
				return null
			}
		},
		// security/secret/list
		list: async ({ showValues }: { showValues?: boolean } = {}) => {
			try {
				const exclude = ['id_status', 'created_by']
				if (!showValues) exclude.push('value')
				const list = await Secret_Table.findAll({
					attributes: { exclude },
					include: [
						{
							attributes: { exclude: ['id'] },
							model: Status_Table,
							required: true
						},
						{
							attributes: {
								exclude: ['id_status', 'id_google', 'last_login', 'is_temporal', 'password']
							},
							model: Users_Table,
							required: true,
							where: { id_status: 1 }
						}
					],
					where: {
						id_status: 1
					},
					order: [['name', 'ASC']]
				})

				if (showValues) {
					for (const item of list) {
						item.value = decrypt(item.value)
					}
				}
				return [...list]
			} catch (error) {
				console.error({ error })
				return []
			}
		},
		// security/secret/edit
		edit: async ({
			id,
			name,
			description,
			type,
			subType,
			value
		}: {
			id: number
			name: string
			description: string
			type: 'DATABASE' | 'VARIABLES'
			subType: 'MYSQL' | 'POSTGRES' | 'SQLITE' | 'MARIADB' | 'MSSQL' | 'ORACLE'
			value: string
		}) => {
			try {
				const eValue = encrypt(value)
				await Secret_Table.update(
					{
						id,
						name,
						description,
						type,
						subType: type === 'DATABASE' ? subType : undefined,
						value: eValue
					},
					{ where: { id } }
				)
				return { msg: 'Modelo actualizado exitosamente' }
			} catch (error) {
				let message = 'Error'
				if (error instanceof Error) message = error.toString()
				return { error: message }
			}
		},
		// security/secret/delete
		delete: async ({ id }: { id: number }) => {
			try {
				await Secret_Table.update(
					{
						id_status: 2
					},
					{ where: { id } }
				)
				return { msg: 'Modelo eliminado exitosamente' }
			} catch (error) {
				let message = 'Error'
				if (error instanceof Error) message = error.toString()
				return { error: message }
			}
		}
	}
}

function createEnvs(secrets: ISecuritySecretEntity | ISecuritySecretEntity[]): object {
	const list: { [key: string]: any } = {}
	let temp: any = null

	const convertJson = (value: string) => {
		let val = value
		try {
			val = JSON.parse(value)
		} catch (error) {}
		return val
	}

	const convertSecret = (secret: ISecuritySecretEntity) => {
		const value = convertJson(secret.value)
		const type = secret?.type?.toUpperCase()
		if (!list[type]) list[type] = {}
		temp = list[type]
		if (secret.subType) {
			if (!temp[secret.subType.toUpperCase()]) temp[secret.subType.toUpperCase()] = {}
			temp = temp[secret.subType.toUpperCase()]
		}
		temp[secret.name.toUpperCase()] = value
		temp = undefined
	}

	if (Array.isArray(secrets)) {
		for (const secret of secrets) {
			convertSecret(secret)
		}
	} else {
		const secret = secrets as ISecuritySecretEntity
		convertSecret(secret)
	}

	const vars = utils_map_json({
		json: JSON.stringify(list)
	})
	return vars
}
