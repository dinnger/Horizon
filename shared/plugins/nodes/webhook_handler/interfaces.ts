import type { INodeClassProperty, INodeClassPropertyType } from '@shared/interface/node.interface.js'
import type { FileArray } from 'express-fileupload'
import type { Request as ExpressRequest } from 'express'

export interface Request extends ExpressRequest {
	files?: FileArray | null
}

export interface IProperties extends INodeClassProperty {
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
	// Opciones CORS
	enableCors: Extract<INodeClassPropertyType, { type: 'switch' }>
	corsOrigin: Extract<INodeClassPropertyType, { type: 'string' }>
	corsMethods: Extract<INodeClassPropertyType, { type: 'string' }>
	corsHeaders: Extract<INodeClassPropertyType, { type: 'string' }>
}
