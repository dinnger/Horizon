export type ICommunicationTypes =
	// Obtención de datos virtuales del workflow
	| 'getVirtualProperties' // Obtiene las propiedades virtuales del workflow
	| 'getVirtualNodes' // Obtiene los nodos virtuales del workflow
	| 'getVirtualConnections' // Obtiene las conexiones virtuales entre nodos
	| 'getVirtualProject' // Obtiene la configuración del proyecto virtual

	// Estado e información del workflow
	| 'statusWorkflow' // Verifica si el workflow ha cambiado desde la última guardada
	| 'infoWorkflow' // Obtiene información completa del workflow (nodos, propiedades, variables)
	| 'propertyWorkflow' // Actualiza las propiedades del workflow

	// Gestión de errores
	| 'connectionError' // Maneja errores en las conexiones entre nodos

	// Operaciones virtuales de nodos
	| 'virtualChangePosition' // Actualiza la posición de un nodo en el canvas
	| 'virtualChangeMeta' // Modifica los metadatos de un nodo
	| 'virtualAddNode' // Añade un nuevo nodo al workflow virtual
	| 'virtualRemoveNode' // Elimina un nodo del workflow virtual
	| 'virtualActionNode' // Ejecuta una acción específica en un nodo
	| 'virtualChangeProperties' // Modifica las propiedades de un nodo

	// Operaciones virtuales de conexiones
	| 'virtualAddConnection' // Añade una nueva conexión entre nodos
	| 'virtualRemoveConnection' // Elimina una conexión entre nodos

	// Operaciones de nodos
	| 'duplicateNode' // Duplica un nodo existente en el workflow
	| 'dataNode' // Visualiza los datos de un nodo específico
	| 'statsNode' // Muestra estadísticas de ejecución de un nodo

	// Depuración y control
	| 'actionDebug' // Activa/desactiva el modo de depuración del workflow

	// Eventos de monitoreo
	| 'getTrace' // Muestra la animación y seguimiento de ejecución de nodos
	| 'memory' // Reporta el uso de memoria del proceso worker
	| 'getDebug' // Obtiene información de depuración del workflow
	| 'getLogs' // Obtiene los logs del workflow
