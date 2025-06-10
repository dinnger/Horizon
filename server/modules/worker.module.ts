import type { Express } from 'express'
import type { MessagePort } from 'node:worker_threads'
import type { ICommunicationTypes } from '@shared/interface/connect.interface.js'
import envs from '../../shared/utils/envs.js'
import path from 'node:path'
import { ioSocket } from './socket.module.js'
import { MessageChannel, Worker } from 'node:worker_threads'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { workflowsService } from '../services/workflows.service.js'
import { securityCredentialsService } from '../services/security/securityCredentials.service.js'
import { fileURLToPath } from 'node:url'
import { projectsService } from '../services/projects.service.js'
import { exec } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dirPath = path.join(__dirname, '../../worker/index.js')

export interface ICustomWorker extends Worker {
	getDataWorker: (data: { type: ICommunicationTypes; data?: any }) => Promise<unknown>
	port?: number
	flow?: string
	worker?: Worker
	active?: boolean
}

interface IMessage {
	type: string
	value: string
	room: string
	target?: string
	ports?: MessagePort[]
	data?: any
	result?: any
}

const isDev = envs.NODE_ENV === 'development'

export function initWorker({
	app,
	flow,
	port,
	workerExist,
	workersList
}: {
	app: Express
	flow: string
	port: number
	workerExist: boolean
	workersList: Map<string, any>
}): Promise<ICustomWorker> {
	// biome-ignore lint/suspicious/noAsyncPromiseExecutor: <explanation>
	return new Promise(async (resolve) => {
		if (!workerExist) {
			app.use(
				createProxyMiddleware({
					secure: false,
					target: `http://127.0.0.1:${port}`,
					changeOrigin: true,
					pathFilter: `/f_${flow}`
				})
			)
		}
		const worker = new Worker(dirPath, {
			workerData: { FLOW: flow, PORT: port }
		}) as ICustomWorker

		worker.on('exit', async (code: number) => {
			console.log(`Worker exited with code ${code}`)
			if (worker) worker.active = false
			const w = workersList.get(flow.toLocaleLowerCase().trim())
			if (w) w.active = false
			await closeWorker({ port: w?.port, workerProcess: worker })
		})

		worker.on('error', (error: Error) => {
			let msg = error?.stack || error.toString()
			if (typeof msg === 'object') msg = JSON.stringify(msg)
			console.error(`Worker error: ${msg}`)
		})

		worker.on('disconnect', () => {
			console.log('Worker disconnected')
			if (worker) worker.active = false
		})

		worker.on('message', async (message: IMessage) => {
			if (message.type === 'init' && message.data === 'worker init') {
				return resolve(worker)
			}
			if (message.type === 'emit' && message.target) {
				return ioSocket.to(message.room).emit(message.target, message.data)
			}
			if (message.ports) {
				// Indica que el worker está esperando una respuesta
				const port = message.ports[0]
				const messageType = message.type
				const messageData = message.data

				// Responder a la solicitud del servidor
				if (['workflowProject', 'workflowVariables', 'workflowCredentials', 'workflowCredentialsResult'].includes(messageType)) {
					if (messageType === 'workflowProject') {
						const responseData = await projectsService().variables().get({
							uidFlow: messageData.uidFlow
						})
						return port.postMessage(JSON.stringify(responseData))
					}
					if (messageType === 'workflowVariables') {
						const responseData = await workflowsService().variables().get({
							uidFlow: messageData.uidFlow
						})
						return port.postMessage(JSON.stringify(responseData))
					}
					if (messageType === 'workflowCredentials') {
						const responseData = await securityCredentialsService({
							app
						}).getByType({ type: messageData.type })
						return port.postMessage(JSON.stringify(responseData))
					}
					if (messageType === 'workflowCredentialsResult') {
						const { type, name } = messageData
						const responseData = await securityCredentialsService({
							app
						}).getByName({ type, name, showResult: true })
						return port.postMessage(JSON.stringify(responseData))
					}
				} else {
					console.error('WORKER.module.js', 'No se encontró el tipo de solicitud', messageType)
					port.postMessage(null)
				}
			}
		})

		worker.getDataWorker = async function (data: { type: string; data?: any }) {
			const mc = new MessageChannel()
			const res = new Promise((resolve) => {
				mc.port1.once('message', ({ data }) => {
					if (data && Array.isArray(data)) {
						const dat = data[0]?.data
						try {
							return resolve(typeof dat === 'string' ? JSON.parse(dat) : dat)
						} catch (_) {
							return resolve(dat)
						}
					}
					resolve(data)
				})
			})
			const ports = [mc.port2]
			this.postMessage({ type: data.type, data, ports }, ports)
			return await res
		}
	})
}

export function closeWorker({ port, workerProcess }: { port: number; workerProcess: Worker }) {
	return new Promise((resolve) => {
		// Si es windows cerrar el proceso por puerto con shell

		workerProcess.terminate()
		resolve(true)
	})
}
