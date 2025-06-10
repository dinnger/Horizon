import type { IDeploy } from '@shared/interface/deploy.interface.js'

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
			title: 'Docker',
			desc: 'Despliega el flujo en un contenedor docker.',
			icon: '󰡨'
		}

		this.properties = {
			type: {
				name: 'Tipo de validación de paralelismo:',
				type: 'options',
				options: [
					{
						label: 'Esperar todas las ejecuciones',
						value: 'allParallel'
					},
					{
						label: 'Primer resultado',
						value: 'firstParallel'
					}
				],
				value: 'allParallel'
			}
		}
	}

	async onExecute({ context }: Parameters<IDeploy['onExecute']>[0]) {
		console.log(context)
	}
}
