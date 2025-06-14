import type { INode, INodeConnections } from '@shared/interface/node.interface.js'
import type { ICommunicationTypes } from '@shared/interface/connect.interface.js'
import type { IWorkflow } from '@shared/interface/workflow.interface.js'
import type { IPropertiesType } from '@shared/interface/node.properties.interface.js'
import { workersList } from './worker.service.js'

export function virtualWorkflowService() {
	return {
		// workflows/virtual/property
		property: async ({
			flow,
			properties
		}: {
			flow: string
			properties: IWorkflow['properties']
		}) => {
			if (!flow) return { error: 'No se especificó el flujo' }
			const worker = workersList.get(flow.toLocaleLowerCase().trim())
			if (!worker) return { error: 'No se encontró el worker' }
			const changes = await worker.worker.getDataWorker({
				type: 'propertyWorkflow',
				data: { properties }
			})
			return { changes }
		},

		// worflows/virtual/actions
		actions: async ({
			type,
			flow,
			node
		}: {
			type: ICommunicationTypes
			flow: string
			node: INode
		}) => {
			if (!flow) return { error: 'No se especificó el flujo' }
			const worker = workersList.get(flow.toLocaleLowerCase().trim())
			if (!worker) return { error: 'No se encontró el worker' }
			const changes = await worker.worker.getDataWorker({
				type,
				data: { node }
			})
			return { changes }
		},

		// workflows/virtual/nodeAdd
		nodeAdd: async ({
			flow,
			node
		}: {
			flow: string
			node: INode
		}) => {
			if (!flow) return { error: 'No se especificó el flujo' }
			const worker = workersList.get(flow.toLocaleLowerCase().trim())
			if (!worker) return { error: 'No se encontró el worker' }
			const changes = await worker.worker.getDataWorker({
				type: 'virtualAddNode',
				data: { node }
			})
			return { changes }
		},

		// workflows/virtual/nodeRemove
		nodeRemove: async ({
			flow,
			node
		}: {
			flow: string
			node: INode
		}) => {
			if (!flow) return { error: 'No se especificó el flujo' }
			const worker = workersList.get(flow.toLocaleLowerCase().trim())
			if (!worker) return { error: 'No se encontró el worker' }
			const changes = await worker.worker.getDataWorker({
				type: 'virtualRemoveNode',
				data: { idNode: node.id }
			})
			return { changes }
		},

		// workflows/virtual/nodeUpdate
		nodeUpdate: async ({
			flow,
			type,
			data
		}: {
			flow: string
			type: ICommunicationTypes
			data: any
		}) => {
			if (!flow) return { error: 'No se especificó el flujo' }
			const worker = workersList.get(flow.toLocaleLowerCase().trim())
			if (!worker) return { error: 'No se encontró el worker' }
			const changes = await worker.worker.getDataWorker({
				type,
				data: { type, ...data }
			})
			return { changes }
		},

		// workflows/virtual/nodeProperty
		nodeProperty: async ({
			flow,
			node,
			key,
			value
		}: {
			flow: string
			node: { id: string; type: string }
			key: string
			value: IPropertiesType
		}) => {
			if (!flow) return { error: 'No se especificó el flujo' }
			const worker = workersList.get(flow.toLocaleLowerCase().trim())
			if (!worker) return { error: 'No se encontró el worker' }
			const changes = await worker.worker.getDataWorker({
				type: 'virtualChangeProperties',
				data: { node, key, value }
			})
			return changes
		},

		// workflows/virtual/action
		action: async ({
			flow,
			node,
			action,
			event
		}: {
			flow: string
			node: { id: string; type: string }
			action: string
			event: any
		}) => {
			if (!flow) return { error: 'No se especificó el flujo' }
			const worker = workersList.get(flow.toLocaleLowerCase().trim())
			if (!worker) return { error: 'No se encontró el worker' }
			const data = await worker.worker.getDataWorker({
				type: 'actionNode',
				data: { node, action, event }
			})
			return data
		},

		// workflows/virtual/connectionAdd
		connectionAdd: async ({
			flow,
			data
		}: {
			flow: string
			data: INodeConnections
		}) => {
			if (!flow) return { error: 'No se especificó el flujo' }
			const worker = workersList.get(flow.toLocaleLowerCase().trim())
			if (!worker) return { error: 'No se encontró el worker' }
			const changes = await worker.worker.getDataWorker({
				type: 'virtualAddConnection',
				data
			})
			return { changes }
		},

		// workflows/virtual/connectionRemove
		connectionRemove: async ({
			flow,
			id
		}: {
			flow: string
			id: string
		}) => {
			if (!flow) return { error: 'No se especificó el flujo' }
			const worker = workersList.get(flow.toLocaleLowerCase().trim())
			if (!worker) return { error: 'No se encontró el worker' }
			const changes = await worker.worker.getDataWorker({
				type: 'removeConnection',
				data: { id }
			})
			return { changes }
		}
	}
}
