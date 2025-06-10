import type { IDeploy } from '@shared/interface/deploy.interface.js'
import fs from 'node:fs'
import zl from 'zip-lib'

export default class implements IDeploy {
	// ===============================================
	// Dependencias
	// ===============================================
	// ===============================================
	constructor(
		public info: IDeploy['info'],
		public properties: IDeploy['properties'],
		public meta: {
			nodesExecuted?: Set<string>
			executeData?: Map<string, { data: object; meta?: object; time: number }>
		} = {}
	) {
		this.info = {
			title: 'Local',
			desc: 'Despliega el flujo localmente como un servicio.',
			icon: '󰒍'
		}

		this.properties = {
			path: {
				name: 'Ruta:',
				type: 'string',
				value: './'
			},
			isZip: {
				name: 'Comprimir:',
				type: 'switch',
				value: true
			}
		}
	}

	async onExecute({ context }: Parameters<IDeploy['onExecute']>[0]) {
		// crear archivo zip a partir de carpeta context.path
		if (this.properties.isZip.value) {
			await zl.archiveFolder(context.path, `${this.properties.path.value as string}/${context.flow}.zip`)
			return
		}
		// copiar carpeta context.path a context.path
		const destinyPath = `${this.properties.path.value}/${context.flow}`
		if (!fs.existsSync(destinyPath)) {
			fs.mkdirSync(destinyPath, { recursive: true })
		}
		fs.cpSync(context.path, destinyPath, {
			recursive: true,
			force: true
		})
	}
}
