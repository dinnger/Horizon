import type { INode } from '@shared/interface/node.interface.js'
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
				type: 'addNode',
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
				type: 'removeNode',
				data: { idNode: node.id }
			})
			return { changes }
		},

		// workflows/virtual/nodeUpdate
		nodeUpdate: async ({
			flow,
			type,
			idNode,
			value
		}: {
			flow: string
			type: 'position'
			idNode: string
			value: any
		}) => {
			if (!flow) return { error: 'No se especificó el flujo' }
			const worker = workersList.get(flow.toLocaleLowerCase().trim())
			if (!worker) return { error: 'No se encontró el worker' }
			const changes = await worker.worker.getDataWorker({
				type: 'updateNode',
				data: { type, idNode, value }
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
				type: 'propertyNode',
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
			id,
			id_node_origin,
			output,
			id_node_destiny,
			input
		}: {
			flow: string
			id: string
			id_node_origin: string
			output: string
			id_node_destiny: string
			input: string
		}) => {
			if (!flow) return { error: 'No se especificó el flujo' }
			const worker = workersList.get(flow.toLocaleLowerCase().trim())
			if (!worker) return { error: 'No se encontró el worker' }
			const changes = await worker.worker.getDataWorker({
				type: 'addConnection',
				data: { id, id_node_origin, output, id_node_destiny, input }
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
