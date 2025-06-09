import type { IServerDeploy } from '@shared/interfaz/deploy.interfaz.js'

export default class implements IServerDeploy {
	// ===============================================
	// Dependencias
	// ===============================================
	// ===============================================
	constructor(
		public info: IServerDeploy['info'],
		public properties: IServerDeploy['properties'],
		public meta: {
			nodesExecuted?: Set<string>
			executeData?: Map<string, { data: object; meta?: object; time: number }>
		} = {}
	) {
		this.info = {
			title: 'Azure',
			desc: 'Despliega el flujo en una instancia de Azure.',
			icon: '󰠅'
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

	async onExecute({ context }: Parameters<IServerDeploy['onExecute']>[0]) {
		console.log(context)
	}
}
