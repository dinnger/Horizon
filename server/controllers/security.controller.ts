// router
import type { Request, Response } from 'express'
import express from 'express'
import {
	generateToken,
	getUserByName,
	getWorkspace,
	getWorkspaceById,
	verifyPassword,
	verifyTokenUser
} from '../modules/security.module.js'

export function security_controller() {
	const router = express.Router()

	router.post('/login', async (req: Request, res: Response) => {
		let { username, password } = req.body
		if (!username || !password) {
			res.status(400).send('Faltan parámetros')
			return
		}
		try {
			username = username.toLocaleLowerCase()
			const user = await getUserByName({ username })
			if (!user) {
				res.status(401).send('Usuario no encontrado')
				return
			}
			const isPasswordValid = await verifyPassword({ username, password })
			if (!isPasswordValid) {
				res.status(401).send('Contraseña incorrecta')
				return
			}

			let workspace = null
			const workspaces = await getWorkspace({ idUser: user.id })
			if (workspaces.length > 1) {
				const exist = workspaces.filter((f) => f.workspace?.is_default)
				if (exist.length > 0) {
					workspace = exist[0].id_workspace
				}
			}
			if (workspaces.length === 1) workspace = workspaces[0].id_workspace

			const token = await generateToken({
				data: { ...user, password: undefined, workspace }
			})
			res.status(200).send({ token })
		} catch (error) {
			let message = 'Error'
			if (error instanceof Error) message = error.toString()
			res.status(500).send({ error: message })
		}
	})

	router.post('/verify', async (req: Request, res: Response) => {
		const { token } = req.body
		try {
			const { user, workspace } = await verifyTokenUser({ token })
			if (!user || !workspace) {
				res.status(401).send('Token no válido')
				return
			}
			req.session.user = {
				id: user.id,
				name: user.name
			}
			req.session.workspace = workspace

			const workspaceData = await getWorkspaceById({ id: workspace })

			res.status(200).send({ user: { id: user.id, name: user.name, alias: user.alias }, workspace: workspaceData })
		} catch (error) {
			console.log(error)
			let message = 'Error'
			if (error instanceof Error) message = error.toString()
			res.status(500).send({ error: message })
		}
	})

	return router
}
