import type { INode, INodeClass } from '@shared/interface/node.interface.js'
import type { IWorkflow } from '@shared/interface/workflow.interface.js'
import fs from 'node:fs'
import { queueService } from './queue.service.js'
import { v4 as uid4 } from 'uuid'
import { getNodeClass } from '@shared/maps/nodes.map.js'
import { DeploymentsQueue_Table } from '../../database/entity/global.deploymentsQueue.entity.js'

const originPathEnv = './.env.prod'
const originPathPackage = './package.json'
const originPathShared = './dist/shared/'
const originPathWorker = './dist/worker/'
/**
 * Processes the queue by retrieving a list of items with a specific status,
 * and updates the status of each item in the DeploymentsQueue_Table to a new status.
 *
 * @async
 * @function queueProcess
 * @returns {Promise<void>} A promise that resolves when the queue processing is complete.
 * @throws Will log an error to the console if the queue processing fails.
 */
export async function queueProcess() {
	const list = await queueService().list({ status: [6] })
	for (const item of list?.deploys || []) {
		const uid = uid4()
		const path = `./data/deployments/${uid}`
		// crear carpeta en data/deployments
		fs.mkdirSync(path, { recursive: true })
		try {
			if (item.flow?.nodes) {
				const nodes = item.flow.nodes
				if (nodes) {
					await queueExtract({
						path,
						nodes,
						flow: item.flow
					})
				}
			}
			await DeploymentsQueue_Table.update(
				{
					id_status: 3,
					meta: {
						path
					}
				},
				{ where: { id: item.id } }
			)
		} catch (error) {
			let message = 'Error'
			if (error instanceof Error) message = error.toString()
			fs.rmSync(`./data/deployments/${uid}`, { recursive: true })
			await DeploymentsQueue_Table.update(
				{
					description: message,
					id_status: 4
				},
				{ where: { id: item.id } }
			)
			throw error
		}
	}
}

function queueExtract({
	path,
	nodes,
	flow
}: {
	path: string
	nodes: { [key: string]: INode }
	flow: IWorkflow
}) {
	const destinyWorkflow = `${path}/data/workflows/default`
	const destinyPluginsNode = `${path}/shared/plugins/nodes/`
	const shared = ['interfaces', 'utils', 'plugins/utils', 'store', 'class']

	const destinyWorker = `${path}/worker/`
	const destinyEnv = `${path}/.env`

	// Copiar shared
	for (const item of shared) {
		fs.cpSync(`${originPathShared}/${item}`, `${path}/shared/${item}`, {
			recursive: true
		})
	}

	// Copiar workers
	fs.cpSync(`${originPathWorker}`, `${destinyWorker}`, { recursive: true })

	// Copiar env
	fs.copyFileSync(`${originPathEnv}`, `${destinyEnv}`)

	// Crear flow
	fs.mkdirSync(`${destinyWorkflow}`, { recursive: true })
	// Eliminar flujo si existe
	fs.writeFileSync(`${destinyWorkflow}/flow.json`, JSON.stringify(flow, null, 2))

	// Extraer nodos
	const listNodes: { id: string; type: string; properties: any }[] = []
	for (const node of Object.values(nodes)) {
		listNodes.push({
			id: node.id || '',
			type: node.info.group,
			properties: node.properties
		})
		const pathOrigin = node.info.group.split('/').slice(0, -1).join('/')
		const pathNode = `${originPathShared}plugins/nodes/${node.info.group}`
		if (!fs.existsSync(pathNode)) {
			throw new Error(`No existe el nodo ${node.info.group}`)
		}
		fs.mkdirSync(`${destinyPluginsNode}/${pathOrigin}`, { recursive: true })
		fs.cpSync(pathNode, `${destinyPluginsNode}/${node.info.group}`, { recursive: true })
	}

	// Copiar package
	queueExtractPackage({ path, listNodes })
}

function queueExtractPackage({
	path,
	listNodes
}: {
	path: string
	listNodes: { id: string; type: string; properties: any }[]
}) {
	const nodeClass = getNodeClass()
	const destinyPackage = `${path}/package.json`

	const dependencies: Set<string> = new Set()
	for (const node of listNodes) {
		const nodeClassItem = nodeClass[node.type]
		if (!nodeClassItem) continue
		// Ejecutando onCreate para validar dependencias por ejemplo en sequelize
		const nodeC: INodeClass = new (nodeClassItem.class as any)()
		let nodeDependencies: string[] | null = null
		if (nodeC.onDeploy) {
			nodeC.properties = node.properties
			nodeC.onDeploy()
			nodeDependencies = nodeC.dependencies || []
		}
		for (const dependency of nodeDependencies || nodeClassItem.dependencies || []) {
			dependencies.add(dependency)
		}
	}

	const pack = fs.readFileSync(originPathPackage, 'utf8')
	const packJson: { dependencies: any; devDependencies: any; scripts: any } = JSON.parse(pack)

	const flowDependencies: { [key: string]: string } = {}
	for (const dependency of dependencies) {
		if (packJson.dependencies[dependency]) {
			flowDependencies[dependency] = packJson.dependencies[dependency]
		}
		if (packJson.devDependencies[dependency]) {
			flowDependencies[dependency] = packJson.devDependencies[dependency]
		}
	}

	packJson.devDependencies = undefined
	packJson.dependencies = {
		...packJson.dependencies,
		...flowDependencies
	}
	packJson.scripts = {
		start: 'node worker/index.js  --FLOW=default'
	}

	fs.writeFileSync(destinyPackage, JSON.stringify(packJson, null, 2))
}
