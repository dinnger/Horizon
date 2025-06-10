import type { Request, Response } from 'express'
import express from 'express'
import { decrypt } from '../modules/security.module.js'
import { clientsCredentialsList } from '../services/client.service.js'

export function credentialController() {
	const router = express.Router()

	router.get('/open', async (req: Request, res: Response) => {
		const { token } = req.query
		// redirect to url with query params and additional headers
		if (!token || typeof token !== 'string') {
			res.status(400).send('Token is required')
			return
		}

		const { uri, uid, headers, queryParams, meta } = JSON.parse(decrypt(token))

		if (!uri || typeof uri !== 'string') {
			res.status(400).send('URL is required')
			return
		}

		let redirectUrl = uri

		// Add query parameters if they exist
		if (queryParams && typeof queryParams === 'object') {
			const urlObj = new URL(redirectUrl)
			for (const [key, value] of Object.entries(queryParams)) {
				urlObj.searchParams.append(key, String(value))
			}
			redirectUrl = urlObj.toString()
		}

		// Set additional headers if they exist
		if (headers && typeof headers === 'object') {
			for (const [key, value] of Object.entries(headers)) {
				res.setHeader(key, String(value))
			}
		}
		req.session.credentials = { uid, meta }
		res.redirect(redirectUrl)
	})

	router.get('/callback', async (req: Request, res: Response) => {
		const { uid, meta } = req.session.credentials
		if (!uid || !meta) {
			res.send('No se encontró el usuario')
			return
		}
		const callback = clientsCredentialsList.get(uid)
		if (!callback) {
			res.send('No se encontró la credencial')
			return
		}
		callback({ data: req.query, meta })
		res.send('<script>window.close();</script > ')
	})
	return router
}
