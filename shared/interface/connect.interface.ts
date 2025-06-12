export type ICommunicationTypes =
	| 'getVirtualProperties'
	| 'getVirtualNodes'
	| 'getVirtualConnections'
	| 'getVirtualProject'
	| 'statusWorkflow'
	| 'infoWorkflow'
	| 'propertyWorkflow'
	| 'connectionError'
	| 'virtualChangePosition'
	| 'virtualChangeMeta'
	| 'addNode'
	| 'duplicateNode'
	| 'removeNode'
	| 'actionNode'
	| 'dataNode'
	| 'statsNode'
	| 'virtualChangeProperties'
	| 'addConnection'
	| 'removeConnection'
	// Actions
	| 'actionDebug'
	// Eventos
	| 'trace' // trace: Mostrar la animación de los nodos
	| 'memory' // memory: Mostrar la memoria del proceso
	| 'getDebug' // debug: Mostrar la información de depuración
	| 'getLogs'
