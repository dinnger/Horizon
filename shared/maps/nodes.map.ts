import type { INodeClass } from '@shared/interface/node.interface.js'
import path from 'node:path'
import { glob } from 'glob'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dirPath = path.join(__dirname, '../plugins/nodes/')
const files = glob.sync('**/index.js', { cwd: dirPath })

const nodesClass: { [key: string]: INodeClass & { class: any } } = {}
const nodesDependencies: { [key: string]: string[] } = {}

for (const file of files) {
	if (file && file.replace(/\\/g, '/').indexOf('/_') > -1) continue
	const type = file
		.replace(/\\/g, '/')
		.toString()
		.replace(`${dirPath.replace(/\\/g, '/')}/`, '')
		.split('/')
		.slice(0, -1)
		.join('/')
	const module = await import(`file://${path.resolve(dirPath, file)}`)
	const model = module.default

	try {
		const data = new model()
		nodesClass[type] = {
			...data,
			class: model
		}
	} catch (error) {
		console.log(`Error al cargar el nodo ${file}`, error)
	}
}

export function getNodeClass(): { [key: string]: INodeClass & { class: any } } {
	return Object.fromEntries(Object.entries(nodesClass).map(([key, value]) => [key, { ...value }]))
}

// Dependencias por nodo independiente de su clase
export function setNodeClassDependencies(node: string, dependencies: string[]) {
	nodesDependencies[node] = dependencies
}

export function getNodeClassDependencies(node: string): string[] {
	return nodesDependencies[node]
}
