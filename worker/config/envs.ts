import { config } from 'dotenv'
config()

interface Envs {
	IS_DEV: boolean
	WORKER_CLUSTER: number
	WORKER_PORT: number
	SERVER_URL: string
	TRACKING_EXECUTE: boolean
}

const { NODE_ENV, WORKER_CLUSTER, WORKER_PORT, SERVER_URL, TRACKING_EXECUTE } = process.env

if (!NODE_ENV) {
	throw new Error('NODE_ENV no definido')
}

if (!SERVER_URL || SERVER_URL === '') {
	throw new Error('SERVER_URL no definido')
}

export const envs: Envs = {
	IS_DEV: NODE_ENV === 'development',
	WORKER_CLUSTER: WORKER_CLUSTER ? Number.parseInt(WORKER_CLUSTER) : 1,
	WORKER_PORT: WORKER_PORT ? Number.parseInt(WORKER_PORT) : 3000,
	SERVER_URL,
	TRACKING_EXECUTE: TRACKING_EXECUTE ? TRACKING_EXECUTE === 'true' : false
}
