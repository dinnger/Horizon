import type { INodeClass, INodeClassProperty, INodeClassPropertyType } from '@shared/interface/node.interface.js'
import type { FileArray } from 'express-fileupload'
import type { Request as ExpressRequest, Response, NextFunction } from 'express'

interface Request extends ExpressRequest {
	files?: FileArray | null
}

interface IProperties extends INodeClassProperty {
	url: Extract<INodeClassPropertyType, { type: 'box' }>
	endpoint: Extract<INodeClassPropertyType, { type: 'string' }>
	type: Extract<INodeClassPropertyType, { type: 'options' }>
	timeout: Extract<INodeClassPropertyType, { type: 'number' }>
	security: Extract<INodeClassPropertyType, { type: 'options' }>
	securityBasicUser: Extract<INodeClassPropertyType, { type: 'string' }>
	securityBasicPass: Extract<INodeClassPropertyType, { type: 'string' }>
	securityBearerToken: Extract<INodeClassPropertyType, { type: 'string' }>
	securityJWTSecret: Extract<INodeClassPropertyType, { type: 'string' }>
	// Opciones avanzadas
	advancedOptions: Extract<INodeClassPropertyType, { type: 'switch' }>
	// Opciones de redirección
	enableRedirect: Extract<INodeClassPropertyType, { type: 'switch' }>
	redirectUrl: Extract<INodeClassPropertyType, { type: 'string' }>
	redirectStatusCode: Extract<INodeClassPropertyType, { type: 'options' }>
	// Opciones de proxy
	enableProxy: Extract<INodeClassPropertyType, { type: 'switch' }>
	proxyUrl: Extract<INodeClassPropertyType, { type: 'string' }>
	proxyPreserveHeaders: Extract<INodeClassPropertyType, { type: 'switch' }>
}

export default class implements INodeClass {
	dependencies = ['jsonwebtoken', 'axios']
	info = {
		name: 'Webhook',
		desc: 'Call webhook',
		icon: '󰘯',
		group: 'Triggers',
		color: '#3498DB',
		connectors: {
			inputs: ['input'],
			outputs: ['response', 'error']
		},
		flags: {
			isTrigger: true
		}
	}
	properties: IProperties = {
		url: {
			name: 'URL asignada:',
			type: 'box'
		},
		endpoint: {
			name: 'Endpoint:',
			type: 'string',
			value: '/'
		},
		type: {
			name: 'Tipo de llamada:',
			type: 'options',
			options: [
				{
					label: 'GET',
					value: 'get'
				},
				{
					label: 'POST',
					value: 'post'
				},
				{
					label: 'PATCH',
					value: 'patch'
				},
				{
					label: 'PUT',
					value: 'put'
				},
				{
					label: 'DELETE',
					value: 'delete'
				}
			],
			value: 'get'
		},
		timeout: {
			name: 'Tiempo de espera (seg):',
			type: 'number',
			value: 50
		},
		security: {
			name: 'Seguridad:',
			type: 'options',
			options: [
				{
					label: 'Ninguna',
					value: 'null'
				},
				{
					label: 'Básico',
					value: 'basic'
				},
				{
					label: 'JWT Bearer',
					value: 'jwt'
				},
				{
					label: 'Bearer Token',
					value: 'bearer'
				}
			],
			value: 'null'
		},
		securityBasicUser: {
			name: 'Usuario',
			type: 'string',
			value: '',
			show: false
		},
		securityBasicPass: {
			name: 'Contraseña',
			type: 'string',
			value: '',
			show: false
		},
		securityBearerToken: {
			name: 'Token',
			type: 'string',
			value: '',
			show: false
		},
		securityJWTSecret: {
			name: 'Secreto',
			type: 'string',
			value: '',
			show: false
		},
		// Opciones avanzadas
		advancedOptions: {
			name: 'Opciones avanzadas',
			type: 'switch',
			value: false
		},
		// Opciones de redirección
		enableRedirect: {
			name: 'Habilitar redirección',
			type: 'switch',
			value: false,
			show: false
		},
		redirectUrl: {
			name: 'URL de redirección',
			type: 'string',
			value: '',
			description: 'URL a la que se redireccionará',
			show: false
		},
		redirectStatusCode: {
			name: 'Código de estado',
			type: 'options',
			options: [
				{
					label: '301 - Movido permanentemente',
					value: 301
				},
				{
					label: '302 - Encontrado (redirección temporal)',
					value: 302
				},
				{
					label: '303 - Ver otro',
					value: 303
				},
				{
					label: '307 - Redirección temporal',
					value: 307
				},
				{
					label: '308 - Redirección permanente',
					value: 308
				}
			],
			value: 302,
			show: false
		},
		// Opciones de proxy
		enableProxy: {
			name: 'Habilitar proxy',
			type: 'switch',
			value: false,
			show: false
		},
		proxyUrl: {
			name: 'URL de destino del proxy',
			type: 'string',
			value: '',
			description: 'URL a la que se reenviarán las peticiones',
			show: false
		},
		proxyPreserveHeaders: {
			name: 'Preservar cabeceras',
			type: 'switch',
			value: true,
			show: false
		},
		// Opciones CORS
		enableCors: {
			name: 'Habilitar CORS',
			type: 'switch',
			value: false,
			show: false
		},
		corsOrigin: {
			name: 'Access-Control-Allow-Origin',
			type: 'string',
			value: '*',
			show: false
		},
		corsMethods: {
			name: 'Access-Control-Allow-Methods',
			type: 'string',
			value: 'GET,POST,PUT,DELETE,OPTIONS',
			show: false
		},
		corsHeaders: {
			name: 'Access-Control-Allow-Headers',
			type: 'string',
			value: 'Content-Type,Authorization',
			show: false
		},
		// Respuesta personalizada
		customResponse: {
			name: 'Habilitar respuesta personalizada',
			type: 'switch',
			value: false,
			show: false
		},
		responseStatusCode: {
			name: 'Código de estado',
			type: 'number',
			value: 200,
			show: false
		},
		responseContentType: {
			name: 'Content-Type',
			type: 'options',
			options: [
				{
					label: 'application/json',
					value: 'application/json'
				},
				{
					label: 'text/html',
					value: 'text/html'
				},
				{
					label: 'text/plain',
					value: 'text/plain'
				},
				{
					label: 'application/xml',
					value: 'application/xml'
				}
			],
			value: 'application/json',
			show: false
		},
		responseBody: {
			name: 'Cuerpo de respuesta',
			type: 'code',
			lang: 'json',
			value: '{\n  "success": true\n}',
			show: false
		}
	}

	async onCreate({ context, environment }: Parameters<NonNullable<INodeClass['onCreate']>>[0]) {
		// Configuración de seguridad
		this.properties.securityBasicUser.show = false
		this.properties.securityBasicPass.show = false
		this.properties.securityBearerToken.show = false
		this.properties.securityJWTSecret.show = false

		if (this.properties.security.value === 'basic') {
			this.properties.securityBasicUser.show = true
			this.properties.securityBasicPass.show = true
		}
		if (this.properties.security.value === 'bearer') {
			this.properties.securityBearerToken.show = true
		}
		if (this.properties.security.value === 'jwt') {
			this.properties.securityJWTSecret.show = true
		}

		// Configuración de opciones avanzadas
		const showAdvanced = this.properties.advancedOptions.value === true

		// Redirección
		this.properties.enableRedirect.show = showAdvanced
		this.properties.redirectUrl.show = showAdvanced && this.properties.enableRedirect.value === true
		this.properties.redirectStatusCode.show = showAdvanced && this.properties.enableRedirect.value === true

		// Proxy
		this.properties.enableProxy.show = showAdvanced
		this.properties.proxyUrl.show = showAdvanced && this.properties.enableProxy.value === true
		this.properties.proxyPreserveHeaders.show = showAdvanced && this.properties.enableProxy.value === true

		// CORS
		this.properties.enableCors.show = showAdvanced
		this.properties.corsOrigin.show = showAdvanced && this.properties.enableCors.value === true
		this.properties.corsMethods.show = showAdvanced && this.properties.enableCors.value === true
		this.properties.corsHeaders.show = showAdvanced && this.properties.enableCors.value === true

		// Respuesta personalizada
		this.properties.customResponse.show = showAdvanced
		this.properties.responseStatusCode.show = showAdvanced && this.properties.customResponse.value === true
		this.properties.responseContentType.show = showAdvanced && this.properties.customResponse.value === true
		this.properties.responseBody.show = showAdvanced && this.properties.customResponse.value === true

		// Generar URL
		const base = context.properties.basic?.router || ''
		const prefix = `/f_${context.uid}/api`

		let endpoint: string = String(this.properties.endpoint.value).toString() || ''
		if (endpoint[0] === '/') endpoint = endpoint.slice(1)
		const env = environment?.SERVER_URL || ''
		const serverUrl = env.slice(-1) !== '/' ? env : env.slice(0, -1)
		const router = environment.SERVER_BASE || ''
		const baseUrl = router.slice(-1) !== '/' ? `${router}/` : router
		const url = `${serverUrl}${prefix}/${baseUrl}${endpoint}`
		const urlProd = `( HOST )${base}/${endpoint}`
		this.properties.url.value = [
			{
				label: 'Desarrollo:',
				value: url,
				isCopy: true
			},
			{
				label: 'Producción:',
				value: urlProd,
				isCopy: true
			}
		]
	}

	async onExecute({ app, context, execute, logger, environment, dependency, outputData }: Parameters<INodeClass['onExecute']>[0]) {
		const jwt = await dependency.getRequire('jsonwebtoken')
		const axios = await dependency.getRequire('axios')

		try {
			// Se define el prefixo de la ruta (Si es subFlow se utiliza el id del padre)
			let base: string
			let prefix: string
			if (environment.isSubFlow) {
				base = environment.subFlowBase || ''
				prefix = `/api/f_${environment.subFlowParent}`
			} else {
				base = context.properties?.basic?.router || ''
				prefix = `/f_${context.uid}/api`
			}
			const timeout = this.properties.timeout.value || 50
			const serverBase = environment.SERVER_BASE || ''
			const baseUrl = serverBase.slice(-1) !== '/' ? `${serverBase}/` : serverBase.slice(0, -1)
			const endpointValue: string = (this.properties.endpoint.value as string) || ''
			const endpoint = endpointValue[0] === '/' ? endpointValue.slice(1) : endpointValue
			const url = `${environment.isDev ? prefix : base}${baseUrl}${endpoint}`
			console.log('WEBHOOK:', this.properties.type.value, url)

			app[this.properties.type.value as keyof typeof app](url, async (req: Request, res: Response, next: NextFunction) => {
				// Configurar CORS si está habilitado
				if (this.properties.advancedOptions.value === true && this.properties.enableCors.value === true) {
					res.header('Access-Control-Allow-Origin', this.properties.corsOrigin.value as string)
					res.header('Access-Control-Allow-Methods', this.properties.corsMethods.value as string)
					res.header('Access-Control-Allow-Headers', this.properties.corsHeaders.value as string)

					// Responder inmediatamente a las solicitudes OPTIONS (preflight)
					if (req.method === 'OPTIONS') {
						res.sendStatus(200)
						return
					}
				}

				// Manejar redirección si está habilitada
				if (
					this.properties.advancedOptions.value === true &&
					this.properties.enableRedirect.value === true &&
					this.properties.redirectUrl.value
				) {
					const redirectUrl = this.properties.redirectUrl.value as string
					const statusCode = this.properties.redirectStatusCode.value as number
					console.log(`Redirigiendo a: ${redirectUrl} con código: ${statusCode}`)
					res.redirect(statusCode, redirectUrl)
					return
				}

				// Respuesta personalizada si está habilitada
				if (this.properties.advancedOptions.value === true && this.properties.customResponse.value === true) {
					const statusCode = this.properties.responseStatusCode.value as number
					const contentType = this.properties.responseContentType.value as string
					let responseBody = this.properties.responseBody.value

					// Si es JSON y está como string, intentar parsear
					if (contentType === 'application/json' && typeof responseBody === 'string') {
						try {
							responseBody = JSON.parse(responseBody)
						} catch (e) {
							// Si no se puede parsear, dejarlo como está
						}
					}

					res.status(statusCode).contentType(contentType).send(responseBody)
					return
				}

				// Preparar datos de la petición
				const data = {
					headers: req.headers,
					params: req.params,
					query: req.query,
					body: req.body,
					files: req.files,
					method: req.method,
					endpoint: req.path,
					time: Date.now(),
					security: {}
				}

				// Proxy si está habilitado
				if (
					this.properties.advancedOptions.value === true &&
					this.properties.enableProxy.value === true &&
					this.properties.proxyUrl.value
				) {
					try {
						const targetUrl = `${this.properties.proxyUrl.value}${req.path}`
						console.log(`Proxy: ${req.method} ${targetUrl}`)

						let headers: { [key: string]: any } = {}
						if (this.properties.proxyPreserveHeaders.value === true) {
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
						outputData(
							'response',
							{
								...data,
								proxyResponse: {
									status: proxyResponse.status,
									headers: proxyResponse.headers,
									data: proxyResponse.data
								}
							},
							{ req, res }
						)

						return
					} catch (error: any) {
						return outputData(
							'error',
							{
								error: `Error de proxy: ${error.message}`,
								originalError: error.response?.data || error.message
							},
							{ req, res }
						)
					}
				}

				// Validar Seguridad
				if (this.properties.security.value === 'jwt') {
					// Validación de autenticación
					if (!data.headers?.authorization) {
						logger.error(
							{
								responseTime: timeout * 1000,
								responseCode: 506
							},
							'Solicitud Timed Out'
						)
						return outputData(
							'error',
							{
								error: 'Autenticación fallida',
								responseTime: timeout * 1000,
								responseCode: 506
							},
							{ req, res }
						)
					}

					jwt.verify(
						data.headers.authorization.split(' ')[1],
						this.properties.securityJWTSecret.value as string,
						(err: Error | null, decoded: object | undefined) => {
							if (err) return outputData('error', { error: err.toString() }, { req, res })
							data.security = decoded as object
							outputData('response', data, { req, res })
						}
					)
				} else {
					// res.send('ok')
					outputData('response', data, { req, res })
					// if (context.info.disabled) next()
				}

				// Timeout
				res.setTimeout(timeout * 1000, () => {
					execute.stop()
					logger.error(
						{
							responseTime: timeout * 1000,
							responseCode: 506
						},
						'Solicitud Timed Out'
					)
					res.status(506).send('Excedido el tiempo de respuesta')
				})
			})
		} catch (error) {
			console.log('🚀 ~ onExecute ~ error:', error)
			let message = 'Error'
			if (error instanceof Error) message = error.message
			outputData('error', { error: message })
		}
	}
}
