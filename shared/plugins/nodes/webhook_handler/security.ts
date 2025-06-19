import type { Response } from 'express'
import type { Request, IProperties } from './interfaces.js'

export interface SecurityValidationResult {
	isValid: boolean
	error?: string
	securityData?: any
	statusCode?: number
}

export function validateBasicAuth(request: Request, properties: IProperties, timeout: number): SecurityValidationResult {
	const authHeader = request.headers?.authorization

	if (!authHeader || !authHeader.startsWith('Basic ')) {
		return {
			isValid: false,
			error: 'Autenticación básica requerida',
			statusCode: 401
		}
	}

	try {
		const credentials = Buffer.from(authHeader.split(' ')[1], 'base64').toString('utf-8')
		const [username, password] = credentials.split(':')

		if (username !== properties.securityBasicUser.value || password !== properties.securityBasicPass.value) {
			return {
				isValid: false,
				error: 'Credenciales básicas inválidas',
				statusCode: 401
			}
		}

		return {
			isValid: true,
			securityData: { username, authenticated: true }
		}
	} catch (error) {
		return {
			isValid: false,
			error: 'Error procesando autenticación básica',
			statusCode: 401
		}
	}
}

export function validateBearerToken(request: Request, properties: IProperties, timeout: number): SecurityValidationResult {
	const authHeader = request.headers?.authorization

	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return {
			isValid: false,
			error: 'Bearer token requerido',
			statusCode: 401
		}
	}

	const token = authHeader.split(' ')[1]
	if (token !== properties.securityBearerToken.value) {
		return {
			isValid: false,
			error: 'Bearer token inválido',
			statusCode: 401
		}
	}

	return {
		isValid: true,
		securityData: { token, authenticated: true }
	}
}

export function validateJWT(
	request: Request,
	properties: IProperties,
	jwt: any,
	callback: (result: SecurityValidationResult) => void
): void {
	if (!request.headers?.authorization) {
		callback({
			isValid: false,
			error: 'JWT token requerido',
			statusCode: 401
		})
		return
	}

	const authHeader = request.headers.authorization
	if (!authHeader.startsWith('Bearer ')) {
		callback({
			isValid: false,
			error: 'Formato JWT inválido',
			statusCode: 401
		})
		return
	}

	jwt.verify(authHeader.split(' ')[1], properties.securityJWTSecret.value as string, (err: Error | null, decoded: object | undefined) => {
		if (err) {
			callback({
				isValid: false,
				error: 'JWT token inválido',
				statusCode: 401
			})
			return
		}

		callback({
			isValid: true,
			securityData: decoded as object
		})
	})
}

export function handleSecurityError(
	result: SecurityValidationResult,
	res: Response,
	outputData: (channel: string, data: any, context?: any) => void,
	logger: any,
	timeout: number,
	req: Request
): void {
	logger.error(
		{
			responseTime: timeout * 1000,
			responseCode: result.statusCode
		},
		result.error
	)

	res.status(result.statusCode!).send(`Unauthorized: ${result.error}`)

	outputData(
		'error',
		{
			error: result.error,
			responseTime: timeout * 1000,
			responseCode: result.statusCode
		},
		{ req, res }
	)
}
