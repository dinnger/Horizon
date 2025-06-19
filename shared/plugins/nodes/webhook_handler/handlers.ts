import type { Response } from 'express'
import type { Request, IProperties } from './interfaces.js'

export function configureCORS(req: Request, res: Response, properties: IProperties): boolean {
	if (properties.advancedOptions.value === true && properties.enableCors.value === true) {
		res.header('Access-Control-Allow-Origin', properties.corsOrigin.value as string)
		res.header('Access-Control-Allow-Methods', properties.corsMethods.value as string)
		res.header('Access-Control-Allow-Headers', properties.corsHeaders.value as string)

		// Responder inmediatamente a las solicitudes OPTIONS (preflight)
		if (req.method === 'OPTIONS') {
			res.sendStatus(200)
			return true // Indica que se manejó la petición
		}
	}
	return false // Indica que debe continuar procesando
}

export function handleRedirect(req: Request, res: Response, properties: IProperties): boolean {
	if (properties.advancedOptions.value === true && properties.enableRedirect.value === true && properties.redirectUrl.value) {
		const redirectUrl = properties.redirectUrl.value as string
		const statusCode = properties.redirectStatusCode.value as number
		console.log(`Redirigiendo a: ${redirectUrl} con código: ${statusCode}`)
		res.redirect(statusCode, redirectUrl)
		return true // Indica que se manejó la petición
	}
	return false // Indica que debe continuar procesando
}

export async function handleProxy(
	req: Request,
	res: Response,
	properties: IProperties,
	axios: any,
	outputData: (channel: string, data: any, context?: any) => void
): Promise<boolean> {
	if (properties.advancedOptions.value === true && properties.enableProxy.value === true && properties.proxyUrl.value) {
		try {
			const targetUrl = `${properties.proxyUrl.value}${req.path}`
			console.log(`Proxy: ${req.method} ${targetUrl}`)

			let headers: { [key: string]: any } = {}
			if (properties.proxyPreserveHeaders.value === true) {
				headers = { ...req.headers }
				// Eliminar headers que pueden causar problemas
				if ('host' in headers) headers.host = undefined
			}

			const proxyResponse = await axios({
				method: req.method.toLowerCase(),
				url: targetUrl,
				headers,
				data: req.body,
				params: req.query
			})

			// Enviar respuesta del proxy
			res.status(proxyResponse.status)
			for (const header in proxyResponse.headers) {
				res.header(header, proxyResponse.headers[header])
			}
			res.send(proxyResponse.data)

			// También enviar los datos al flujo de trabajo
			const data = {
				headers: req.headers,
				params: req.params,
				query: req.query,
				body: req.body,
				files: req.files,
				method: req.method,
				endpoint: req.path,
				time: Date.now(),
				security: {},
				proxyResponse: {
					status: proxyResponse.status,
					headers: proxyResponse.headers,
					data: proxyResponse.data
				}
			}

			outputData('response', data, { req, res })
			return true // Indica que se manejó la petición
		} catch (error: any) {
			outputData(
				'error',
				{
					error: `Error de proxy: ${error.message}`,
					originalError: error.response?.data || error.message
				},
				{ req, res }
			)
			return true // Indica que se manejó la petición (con error)
		}
	}
	return false // Indica que debe continuar procesando
}
