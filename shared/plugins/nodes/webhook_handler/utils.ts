import type { IProperties } from './interfaces.js'

export function generateWebhookURL(context: any, environment: any, properties: IProperties): void {
	// Generar URL
	const base = context.properties.basic?.router || ''
	const prefix = `/f_${context.uid}/api`

	let endpoint: string = String(properties.endpoint.value).toString() || ''
	if (endpoint[0] === '/') endpoint = endpoint.slice(1)
	const env = environment?.SERVER_URL || ''
	const serverUrl = env.slice(-1) !== '/' ? env : env.slice(0, -1)
	const router = environment.SERVER_BASE || ''
	const baseUrl = router.slice(-1) !== '/' ? `${router}/` : router
	const url = `${serverUrl}${prefix}/${baseUrl}${endpoint}`
	const urlProd = `( HOST )${base}/${endpoint}`

	properties.url.value = [
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

export function buildWebhookPath(environment: any, context: any, properties: IProperties): string {
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

	const serverBase = environment.SERVER_BASE || ''
	const baseUrl = serverBase.slice(-1) !== '/' ? `${serverBase}/` : serverBase
	const endpointValue: string = (properties.endpoint.value as string) || ''
	const endpoint = endpointValue[0] === '/' ? endpointValue.slice(1) : endpointValue

	return `${environment.isDev ? prefix : base}${baseUrl}${endpoint}`
}

export function configurePropertiesVisibility(properties: IProperties): void {
	// Configuración de seguridad
	properties.securityBasicUser.show = false
	properties.securityBasicPass.show = false
	properties.securityBearerToken.show = false
	properties.securityJWTSecret.show = false

	if (properties.security.value === 'basic') {
		properties.securityBasicUser.show = true
		properties.securityBasicPass.show = true
	}
	if (properties.security.value === 'bearer') {
		properties.securityBearerToken.show = true
	}
	if (properties.security.value === 'jwt') {
		properties.securityJWTSecret.show = true
	}

	// Configuración de opciones avanzadas
	const showAdvanced = properties.advancedOptions.value === true

	// Redirección
	properties.enableRedirect.show = showAdvanced
	properties.redirectUrl.show = showAdvanced && properties.enableRedirect.value === true
	properties.redirectStatusCode.show = showAdvanced && properties.enableRedirect.value === true

	// Proxy
	properties.enableProxy.show = showAdvanced
	properties.proxyUrl.show = showAdvanced && properties.enableProxy.value === true
	properties.proxyPreserveHeaders.show = showAdvanced && properties.enableProxy.value === true

	// CORS
	properties.enableCors.show = showAdvanced
	properties.corsOrigin.show = showAdvanced && properties.enableCors.value === true
	properties.corsMethods.show = showAdvanced && properties.enableCors.value === true
	properties.corsHeaders.show = showAdvanced && properties.enableCors.value === true
}

export function prepareRequestData(req: any): any {
	return {
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
}
