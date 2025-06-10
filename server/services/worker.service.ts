import type { Express } from 'express'
import type { ICustomWorker } from '../modules/worker.module.js'
import { closeWorker, initWorker } from '../modules/worker.module.js'
import envs from '../../shared/utils/envs.js'
import { workflowsService } from './workflows.service.js'

interface IWorker {
	port: number
	idFlow: number
	nameFlow: string
	uidFlow: string
	worker: ICustomWorker
	active: boolean
}

let port = envs.WORKER_INIT_PORT

export const workersList = new Map<string, IWorker>()

export function workerService({ app }: { app: Express | null }) {
	return {
		// worker/init
		init: async ({ uidFlow }: { uidFlow: string }): Promise<IWorker | null> => {
			const worker = workersList.get(uidFlow.toLocaleLowerCase().trim())
			if (worker?.active) return worker
			if (!app) return null

			const flows: any = await workflowsService().get({ uidFlow })
			if (flows && flows.length === 0) return null
			const flow = flows[0]

			// WorkerExist permite que el usuario pueda iniciar un worker que ya exista
			const workerExist = !!worker

			port = !workerExist ? port + 1 : worker.port

			const workerProcess = await initWorker({
				app,
				flow: uidFlow,
				port,
				workerExist,
				workersList
			})
			const workerData: IWorker = {
				port,
				idFlow: flow.id,
				nameFlow: flow.name,
				uidFlow,
				worker: workerProcess,
				active: true
			}
			workersList.set(uidFlow.toLocaleLowerCase().trim(), workerData)

			return workerData
		},
		// worker/close
		close: async ({ uidFlow }: { uidFlow: string }) => {
			if (!workersList.has(uidFlow.toLocaleLowerCase().trim()))
				return { error: 'No existe un worker' }
			try {
				const worker = workersList.get(uidFlow.toLocaleLowerCase().trim())
				if (worker) {
					if (!worker.active) return { error: 'Worker no activo' }
					await closeWorker({
						port: worker.port,
						workerProcess: worker.worker
					})
					worker.active = false
				}
				return { msg: 'Worker cerrado' }
			} catch (error) {}
		},
		// worker/restart
		restart: async ({ uidFlow }: { uidFlow: string }) => {
			const worker = workersList.get(uidFlow.toLocaleLowerCase().trim())
			try {
				if (worker) await workerService({ app }).close({ uidFlow })
				return await workerService({ app }).init({ uidFlow })
			} catch (error) {
				let message = 'Error'
				if (error instanceof Error) message = error.toString()
				return { error: message }
			}
		},
		// worker/get
		get: async (uidFlow: string) => {
			const worker = workersList.get(uidFlow.toLocaleLowerCase().trim())
			if (!worker) return null
			return worker.worker.getDataWorker({ type: 'infoWorkflow' })
		},
		// worker/getNode
		getNode: async (uidFlow: string, node: string) => {
			const worker = workersList.get(uidFlow.toLocaleLowerCase().trim())
			if (!worker) return null
			return worker.worker.getDataWorker({ type: 'infoWorkflow', data: { node } })
		}
	}
}
