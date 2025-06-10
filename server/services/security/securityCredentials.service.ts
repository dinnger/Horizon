import type { ISocket } from '@shared/interface/socket.interface.js'
import type { Express } from 'express'
import type { INodeClass } from '@shared/interface/node.interface.js'
import NodeCache from 'node-cache'
import { Credentials_Table } from '../../database/entity/security.credentials.entity.js'
import { decrypt, encrypt } from '../../modules/security.module.js'
import { clientService } from '../client.service.js'
import { CoreDependencies } from '../../../worker/modules/core/dependency.module.js'
import { getCredentials, getCredentialsActions, getCredentialsClass, getCredentialsProperties } from '@shared/maps/security.map.js'
import type { IClientStepContent } from '@shared/interface/client.interface.js'

const cacheCredential = new NodeCache({ stdTTL: 60 })

function decryptProperties(properties: string) {
	try {
		return JSON.parse(decrypt(properties))
	} catch (error) {
		console.error('Error al desencriptar propiedades:', error)
		return {}
	}
}

export function securityCredentialsService({ app }: { app?: Express }) {
	return {
		// security/credentials/list
		list: async () => {
			return getCredentials()
		},
		// security/credentials/getById
		getById: async ({ id }: { id: number }) => {
			try {
				const credential = await Credentials_Table.findOne({
					where: {
						id,
						id_status: 1
					}
				})

				if (!credential) {
					throw new Error('Credencial no encontrada')
				}

				// Desencriptar las propiedades
				const plainCredential = credential.get({ plain: true })
				if (plainCredential.properties) {
					plainCredential.properties = decryptProperties(plainCredential.properties)
				}

				return plainCredential
			} catch (error: any) {
				return { error: error.message }
			}
		},
		// security/credentials/getByType
		getByType: async ({ type, showProperty }: { type: string; showProperty?: boolean }) => {
			try {
				// Cache
				if (cacheCredential.get(type)) return cacheCredential.get(type) as any

				const exclude = ['properties', 'id_status', 'created_by']
				if (showProperty) exclude.shift()
				const credentials = await Credentials_Table.findAll({
					attributes: { exclude },
					where: { id_status: 1, type }
				})

				if (showProperty) {
					for (const credential of credentials) {
						credential.properties = decryptProperties(credential.properties)
					}
				}

				cacheCredential.set(type, credentials)
				return credentials
			} catch (error: any) {
				return { error: error.message }
			}
		},
		// security/credentials/getByType
		getByName: async ({
			type,
			name,
			showProperty,
			showResult
		}: {
			type: string
			name: string
			showProperty?: boolean
			showResult?: boolean
		}) => {
			try {
				// Cache
				if (cacheCredential.get(`${type}_${name}`)) {
					return cacheCredential.get(`${type}_${name}`) as any
				}

				const exclude = ['id_status', 'created_by']
				if (!showProperty) exclude.push('properties')
				if (!showResult) exclude.push('result')

				const credential = await Credentials_Table.findOne({
					attributes: { exclude },
					where: { id_status: 1, type, name }
				})

				if (credential && showProperty) {
					credential.properties = decryptProperties(credential.properties)
				}
				if (credential && showResult) {
					credential.result = decryptProperties(credential.result)
				}

				cacheCredential.set(`${type}_${name}`, credential)
				return credential
			} catch (error: any) {
				return { error: error.message }
			}
		},
		// security/credentials/getProperties
		getProperties: async ({ name }: { name: string }) => {
			return getCredentialsProperties(name)
		},
		// security/credentials/getActions
		getActions: async ({ name }: { name: string }) => {
			return getCredentialsActions(name)
		},
		// security/credentials/getAll
		getAll: async () => {
			try {
				const credentials = await Credentials_Table.findAll({
					where: { id_status: 1 }
				})

				// Desencriptar las propiedades de cada credencial
				const decryptedCredentials = credentials.map((credential) => {
					const plainCredential: any = credential.get({ plain: true })
					plainCredential.properties = undefined
					return plainCredential
				})

				return { credentials: decryptedCredentials }
			} catch (error: any) {
				return { error: error.message }
			}
		},
		// security/credentials/validName
		validName: async ({ name, type }: { name: string; type: string }) => {
			try {
				const existingCredential = await Credentials_Table.findOne({
					where: {
						name,
						type,
						id_status: 1
					}
				})
				if (existingCredential) {
					return { error: 'Ya existe una credencial con el mismo nombre' }
				}
				return { valid: true }
			} catch (error: any) {
				return { error: error.message }
			}
		},
		// security/credentials/save
		// save: async ({
		// 	name,
		// 	type,
		// 	action,
		// 	data,
		// 	socket
		// }: { name: string; type: string; action: 'new' | 'save'; data: IClientStepContent; socket: ISocket }) => {
		// 	try {
		// 		// Intentamos ejecutar el método onCreate del plugin de credenciales
		// 		const credentialClass = getCredentialsClass(type)
		// 		if (!credentialClass) return { error: 'No se encontró el plugin de credenciales' }

		// 		const instance: INodeClass = new (credentialClass as any)()
		// 		if (!instance?.onCredential) return { error: 'No se encontró el método onCredential' }

		// 		if ((data.properties.element as any) === undefined) return { error: 'La propiedad element no es del tipo IPropertiesType' }
		// 		for (const [key, value] of Object.entries(data.properties.element as any)) {
		// 			if (instance?.credentials?.[key]?.value) {
		// 				instance.credentials[key].value = value as any
		// 			}
		// 		}

		// 		const result = await instance.onCredential({
		// 			action,
		// 			dependency: CoreDependencies('create')
		// 			// client: clientService({ socket })
		// 		})
		// 		if (typeof result === 'object' && 'alert' in result) return result

		// 		if (typeof result === 'object' && 'save' in result) {
		// 			// Verificar si ya existe una credencial con el mismo nombre
		// 			const existingCredential = await Credentials_Table.findOne({
		// 				where: {
		// 					name,
		// 					type
		// 				}
		// 			})
		// 			if (existingCredential) {
		// 				return { error: 'Ya existe una credencial con el mismo nombre' }
		// 			}

		// 			// Encriptar las propiedades antes de guardar
		// 			const encryptedProperties = encrypt(JSON.stringify(result.save))
		// 			const encryptedResult = encrypt(JSON.stringify(result))

		// 			// Guardamos en la base de datos
		// 			await Credentials_Table.create({
		// 				name,
		// 				type,
		// 				properties: encryptedProperties,
		// 				result: encryptedResult,
		// 				id_status: 1,
		// 				created_by: socket.session.id
		// 			})
		// 			return { save: `Credencial ${name} guardada` }
		// 		}
		// 		return { error: 'No se reconoció el tipo de credencial' }

		// 		// properties = {}
		// 		// for (const [key, value] of Object.entries(selectedTab.properties)) {
		// 		// 	properties[key] = (value as any).value
		// 		// }
		// 	} catch (error: any) {
		// 		console.error('Error al guardar credencial:', error)
		// 		return { error: error.message }
		// 	}
		// },
		// security/credentials/delete
		delete: async ({ id }: { id: number }) => {
			try {
				const credential = await Credentials_Table.findByPk(id)
				if (!credential) {
					throw new Error('Credencial no encontrada')
				}

				// Marcamos como inactivo en lugar de eliminar
				await credential.update({ id_status: 0 })
				return { success: true }
			} catch (error: any) {
				return { error: error.message }
			}
		}
	}
}
