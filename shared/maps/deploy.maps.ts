import type { IDeployExec } from '@shared/interface/deploy.interface.js'
import { glob } from 'glob'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dirPath = path.join(__dirname, '../plugins/deploys/')
const files = glob.sync('*.js', { cwd: dirPath })

const pluginsRegistry: { [key: string]: IDeployExec } = {}

for (const file of files) {
	if (file && file.indexOf('/_') > -1) continue

	const name = file.replace(/\\/g, '/').split('/').pop()?.replace('.ts', '').replace('.js', '').toLocaleLowerCase() || ''

	const module = await import(`file://${path.resolve(dirPath, file)}`)
	const model = module.default
	// const model = require(`${dirPath}${file}`).default
	try {
		const data = new model()
		pluginsRegistry[`${name}`] = {
			name,
			info: data.info,
			properties: data.properties,
			class: model
		}
	} catch (error) {}
}

export function getDeploysClass() {
	return Object.fromEntries(
		Object.entries(pluginsRegistry).map(([key, value]) => [
			key,
			{
				name: value.name,
				info: value.info,
				properties: { ...value.properties },
				class: value.class
			}
		])
	)
}
