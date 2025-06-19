import type { INodeClass } from '@shared/interface/node.interface.js'
import type { Response, NextFunction } from 'express'
import type { IProperties, Request } from './interfaces.js'
import { nodeProperties } from './properties.js'
import { validateBasicAuth, validateBearerToken, validateJWT, handleSecurityError, type SecurityValidationResult } from './security.js'
import { configureCORS, handleRedirect, handleProxy } from './handlers.js'
import { generateWebhookURL, buildWebhookPath, configurePropertiesVisibility, prepareRequestData } from './utils.js'

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

	properties: IProperties = nodeProperties
	async onCreate({ context, environment }: Parameters<NonNullable<INodeClass['onCreate']>>[0]) {
		configurePropertiesVisibility(this.properties)
		generateWebhookURL(context, environment, this.properties)
	}
	async onExecute({ app, context, execute, logger, environment, dependency, outputData }: Parameters<INodeClass['onExecute']>[0]) {
		const jwt = await dependency.getRequire('jsonwebtoken')
		const axios = await dependency.getRequire('axios')

		try {
			const timeout = this.properties.timeout.value || 50
			const url = buildWebhookPath(environment, context, this.properties)
			console.log('WEBHOOK:', this.properties.type.value, url)

			app[this.properties.type.value as keyof typeof app](url, async (req: Request, res: Response, next: NextFunction) => {
				// Configurar CORS si está habilitado
				if (configureCORS(req, res, this.properties)) {
					return // Se manejó una petición OPTIONS
				}

				// Manejar redirección si está habilitada
				if (handleRedirect(req, res, this.properties)) {
					return // Se manejó la redirección
				}

				// Preparar datos de la petición
				const data = prepareRequestData(req)

				// Proxy si está habilitado
				if (await handleProxy(req, res, this.properties, axios, outputData)) {
					return // Se manejó el proxy
				}

				// Validar Seguridad
				await this.handleSecurity(req, res, data, jwt, logger, timeout, outputData)

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

	private async handleSecurity(
		req: Request,
		res: Response,
		data: any,
		jwt: any,
		logger: any,
		timeout: number,
		outputData: (channel: string, data: any, context?: any) => void
	): Promise<void> {
		if (this.properties.security.value === 'basic') {
			const result = validateBasicAuth(req, this.properties, timeout)
			if (!result.isValid) {
				handleSecurityError(result, res, outputData, logger, timeout, req)
				return
			}
			data.security = result.securityData
			outputData('response', data, { req, res })
		} else if (this.properties.security.value === 'bearer') {
			const result = validateBearerToken(req, this.properties, timeout)
			if (!result.isValid) {
				handleSecurityError(result, res, outputData, logger, timeout, req)
				return
			}
			data.security = result.securityData
			outputData('response', data, { req, res })
		} else if (this.properties.security.value === 'jwt') {
			validateJWT(req, this.properties, jwt, (result: SecurityValidationResult) => {
				if (!result.isValid) {
					handleSecurityError(result, res, outputData, logger, timeout, req)
					return
				}
				data.security = result.securityData
				outputData('response', data, { req, res })
			})
		} else {
			// Sin seguridad
			outputData('response', data, { req, res })
		}
	}
}
