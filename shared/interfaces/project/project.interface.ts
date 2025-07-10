/**
 * Configuración de transporte para proyectos
 */
export interface IProjectTransportConfig {
	// TCP
	host?: string
	port?: number

	// RabbitMQ
	amqpUrl?: string
	exchange?: string
	queue?: string
	routingKey?: string

	// Kafka
	brokers?: string[]
	clientId?: string
	groupId?: string
	topic?: string

	// NATS
	natsUrl?: string
	subject?: string

	// HTTP/REST
	baseUrl?: string
	timeout?: number

	// WebSocket
	wsUrl?: string

	// MQTT
	mqttUrl?: string

	// Common
	username?: string
	password?: string
	ssl?: boolean
	retries?: number
	retryDelay?: number
}

/**
 * Tipos de transporte soportados
 */
export type IProjectTransportType = 
	| 'none' 
	| 'tcp' 
	| 'rabbitmq' 
	| 'kafka' 
	| 'nats' 
	| 'http' 
	| 'websocket' 
	| 'mqtt'

/**
 * Patrones de transporte soportados
 */
export type IProjectTransportPattern = 
	| 'request-response' 
	| 'publish-subscribe' 
	| 'push-pull' 
	| 'stream'

/**
 * Estados de proyecto
 */
export type IProjectStatus = 'active' | 'inactive' | 'archived'

/**
 * Interfaz base para un proyecto
 */
export interface IProjectBase {
	id: string
	name: string
	description: string
	workspaceId?: string
	status: IProjectStatus
	transportType?: IProjectTransportType
	transportPattern?: IProjectTransportPattern
	transportConfig?: IProjectTransportConfig
	createdAt: Date
	updatedAt: Date
}

/**
 * Interfaz para proyecto del cliente
 */
export interface IProjectClient extends IProjectBase {
	// Propiedades específicas del cliente
}

/**
 * Interfaz para proyecto del servidor
 */
export interface IProjectServer extends IProjectBase {
	// Propiedades específicas del servidor
}

/**
 * Interfaz para crear un proyecto
 */
export interface IProjectCreate extends Omit<IProjectBase, 'id' | 'createdAt' | 'updatedAt'> {
	id?: string
	createdAt?: Date
	updatedAt?: Date
}

/**
 * Interfaz para actualizar un proyecto
 */
export interface IProjectUpdate extends Partial<Omit<IProjectBase, 'id' | 'createdAt' | 'updatedAt'>> {
	updatedAt?: Date
}

/**
 * Interfaz legacy para compatibilidad - será depreciada
 * @deprecated Usar IProjectClient en su lugar
 */
export interface Project extends IProjectClient {}

/**
 * Interfaz legacy para compatibilidad - será depreciada
 * @deprecated Usar IProjectTransportConfig en su lugar
 */
export interface ProjectTransportConfig extends IProjectTransportConfig {}

/**
 * Interfaz legacy para compatibilidad - será depreciada
 * @deprecated Usar IProjectServer en su lugar
 */
export interface ProjectAttributes extends IProjectServer {}
