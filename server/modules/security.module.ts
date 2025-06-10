import type { ISocket } from '@shared/interface/socket.interface.js'
import type { ISecurityUserEntity } from '@entities/security.interface.js'
import type { IWorkspaceEntity } from '@entities/workspace.interface.js'
import { Users_Table } from '../database/entity/security.users.entity.js'
import { secretKeyServer } from '../server_init.js'
import { Workspace_Table } from '../database/entity/workspace.entity.js'
import { WorkspaceUser_Table } from '../database/entity/workspace.users.entity.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import NodeCache from 'node-cache'
import crypto from 'node:crypto'

const cacheUser = new NodeCache({ stdTTL: 60 })
const cacheWorkspace = new NodeCache({ stdTTL: 60 })

const algorithm = 'aes-256-cbc'
const secretKey = crypto.createHash('sha256').update(String(secretKeyServer)).digest('base64').substr(0, 32)
const iv = crypto.createHash('sha256').update(String(secretKeyServer)).digest('base64').substr(0, 16)

/**
 * Encrypts the given text using AES-256-CBC algorithm.
 *
 * @param {string} text - The text to encrypt.
 * @returns {string} - The encrypted text in hexadecimal format.
 */
export function encrypt(text: string): string {
	const cipher = crypto.createCipheriv(algorithm, secretKey, iv)
	let encrypted = cipher.update(text, 'utf8', 'hex')
	encrypted += cipher.final('hex')
	return encrypted
}

/**
 * Decrypts the given encrypted text using AES-256-CBC algorithm.
 *
 * @param {string} encryptedText - The encrypted text in hexadecimal format.
 * @returns {string} - The decrypted text.
 */
export function decrypt(encryptedText: string): string {
	const decipher = crypto.createDecipheriv(algorithm, secretKey, iv)
	let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
	decrypted += decipher.final('utf8')
	return decrypted
}

export async function socketSecurity({
	event,
	socket,
	params,
	callback,
	next
}: {
	event: string
	socket: ISocket
	params: any
	callback: (value: any) => void
	next: () => void
}) {
	try {
		if (event === 'server/security/session') {
			try {
				const { token } = params
				const user = await verifyTokenUser({ token })
				if (!user) {
					console.log('No se encontró el usuario')
					socket.disconnect()
					return callback?.({ error: 'No se encontró el usuario' })
				}
				socket.token = token
				return callback?.({ msg: 'Token válido' })
			} catch (error) {
				console.log({ error })
				socket.disconnect()
				let message = 'Error'
				if (error instanceof Error) message = error.toString()
				return callback?.({ error: message })
			}
		} else {
			const { token } = socket
			const { user, workspace } = await verifyTokenUser({ token })
			if (!user) {
				socket.disconnect()
				return callback?.({ error: 'No se encontró el usuario' })
			}
			socket.session = { ...user, workspace }
			return next()
		}
	} catch (error) {}
}

/**
 * Retrieves a user by their username. If the user is found in the cache, it returns the cached user.
 * Otherwise, it queries the database for the user, caches the result, and returns the user.
 *
 * @param {Object} param - The parameter object.
 * @param {string} param.username - The username of the user to retrieve.
 * @returns {Promise<Object|null>} The user object if found, otherwise null.
 */
export async function getUserByName({ username }: { username: string }): Promise<ISecurityUserEntity | null> {
	if (cacheUser.get(username)) return cacheUser.get(username) as ISecurityUserEntity
	const user = await Users_Table.findOne({
		attributes: ['id', 'name', 'alias', 'password'],
		where: {
			name: username
		},
		raw: true
	})
	if (!user) return null
	cacheUser.set(username, user)
	return user
}

export async function getWorkspace({ idUser }: { idUser: number }) {
	return await WorkspaceUser_Table.findAll({
		attributes: ['id_workspace', 'role'],
		include: [
			{
				model: Workspace_Table,
				required: true,
				where: {
					id_status: 1
				}
			}
		],
		where: {
			id_user: idUser
		}
	})
}

export async function getWorkspaceById({ id }: { id: number }) {
	if (cacheWorkspace.get(id)) return cacheWorkspace.get(id) as IWorkspaceEntity
	const workspace = await Workspace_Table.findOne({
		attributes: ['id', 'name', 'description', 'is_default'],
		where: {
			id_status: 1,
			id
		}
	})
	if (!workspace) return null
	cacheWorkspace.set(id, workspace)
	return workspace
}

/**
 * Verifies if the provided password matches the stored password for the given username.
 *
 * @param {Object} params - The parameters for the function.
 * @param {string} params.username - The username of the user.
 * @param {string} params.password - The password to verify.
 * @returns {Promise<boolean>} - Returns a promise that resolves to `true` if the password matches, otherwise `false`.
 */
export async function verifyPassword({ username, password }: { username: string; password: string }) {
	const user = await getUserByName({ username })
	if (!user) return false
	return bcrypt.compareSync(password, user.password)
}

/**
 * Generates a JSON Web Token (JWT) based on the provided encryption data.
 *
 * @param {Object} params - The parameters for token generation.
 * @param {Object} params.encrypt - The data to be encrypted and included in the token payload.
 * @returns {Promise<string | null>} - A promise that resolves to the generated token string, or null if an error occurs.
 */
export async function generateToken({ data }: { data: { [key: string]: any } }) {
	try {
		const hash = jwt.sign({ data: encrypt(JSON.stringify(data)) }, secretKeyServer, {
			expiresIn: 12 * 60 * 60
		})
		return hash
	} catch (error) {
		console.log({ error })
		return null
	}
}

/**
 * Verifies the provided JWT token.
 *
 * @param token - The JWT token to verify.
 * @returns The decoded token if verification is successful, otherwise `null`.
 */
export async function verifyToken({ token }: { token: string }) {
	try {
		const decoded: any = jwt.verify(token, secretKeyServer)
		return JSON.parse(decrypt(decoded.data.toString()))
	} catch (error) {
		return null
	}
}

/**
 * Verifies a token and retrieves the associated user.
 *
 * @param token - The token to be verified.
 * @returns The user associated with the token if verification is successful, otherwise null.
 */
export async function verifyTokenUser({
	token
}: { token: string }): Promise<{ user: ISecurityUserEntity | undefined; workspace: number | undefined }> {
	const decoded = (await verifyToken({ token })) as any
	if (!decoded) return { user: undefined, workspace: undefined }
	const user = await getUserByName({ username: decoded.name })
	if (!user || decoded.id !== user.id) throw new Error('Usuario no válido')
	return { user, workspace: decoded.workspace }
}
