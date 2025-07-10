/\*\*

- Guía de migración para interfaces estandarizadas
-
- Este archivo proporciona información sobre cómo migrar las interfaces existentes
- a las nuevas interfaces estandarizadas.
  \*/

/\*\*

- MIGRACIÓN DE INTERFACES DE NODO
-
- Cambios:
- - NodeClass → INodeWorker
- - INode (worker) → INodeWorker
- - INode (client) → INodeFull
- - INodeCanvas → INodeCanvas (mejorada)
- - IConnection → INodeConnection
-
- Nuevas interfaces:
- - INodeBase: Interface base para todos los nodos
- - INodeFull: Nodo completo con toda la información
- - INodeWorker: Nodo específico para el worker
- - INodeCanvas: Nodo específico para el canvas
- - INodeConnection: Conexión entre nodos (reemplaza IConnection)
-
- Importación:
- import { INodeWorker, INodeFull, INodeCanvas, INodeConnection } from '@shared/interfaces/standardized.js'
  \*/

/\*\*

- MIGRACIÓN DE INTERFACES DE PROYECTO
-
- Cambios:
- - Project → IProjectClient
- - ProjectAttributes → IProjectServer
- - ProjectTransportConfig → IProjectTransportConfig
-
- Nuevas interfaces:
- - IProjectBase: Interface base para proyectos
- - IProjectClient: Proyecto específico para el cliente
- - IProjectServer: Proyecto específico para el servidor
- - IProjectCreate: Para crear proyectos
- - IProjectUpdate: Para actualizar proyectos
-
- Importación:
- import { IProjectClient, IProjectServer, IProjectTransportConfig } from '@shared/interfaces/standardized.js'
  \*/

/\*\*

- MIGRACIÓN DE INTERFACES DE CONFIGURACIÓN DE USUARIO
-
- Cambios:
- - UserSettings → IUserSettingsClient
- - UserSettingsAttributes → IUserSettingsServer
- - Theme → IUserTheme
- - NotificationSettings → IUserNotificationSettings
- - PerformanceSettings → IUserPerformanceSettings
- - PrivacySettings → IUserPrivacySettings
-
- Nuevas interfaces:
- - IUserSettingsBase: Interface base para configuraciones
- - IUserSettingsClient: Configuración específica para el cliente
- - IUserSettingsServer: Configuración específica para el servidor
- - IUserSettingsCreate: Para crear configuraciones
- - IUserSettingsUpdate: Para actualizar configuraciones
-
- Importación:
- import { IUserSettingsClient, IUserSettingsServer, IUserTheme } from '@shared/interfaces/standardized.js'
  \*/

/\*\*

- MIGRACIÓN DE INTERFACES DE WORKFLOW
-
- Cambios:
- - IWorkflow → IWorkflowFull
- - IWorkflowExecutionContextInterface → IWorkflowExecutionContext
- - IWorkflowExecutionInterface → IWorkflowExecution
- - Workflow → IWorkflowClient
-
- Nuevas interfaces:
- - IWorkflowBase: Interface base para workflows
- - IWorkflowFull: Workflow completo
- - IWorkflowWorker: Workflow específico para el worker
- - IWorkflowClient: Workflow específico para el cliente
- - IWorkflowServer: Workflow específico para el servidor
- - IWorkflowCreate: Para crear workflows
- - IWorkflowUpdate: Para actualizar workflows
-
- Importación:
- import { IWorkflowFull, IWorkflowWorker, IWorkflowClient, IWorkflowExecutionContext } from '@shared/interfaces/standardized.js'
  \*/

/\*\*

- PASOS PARA LA MIGRACIÓN
-
- 1.  Actualizar las importaciones en los archivos que usan las interfaces
- 2.  Reemplazar las interfaces obsoletas por las nuevas
- 3.  Verificar que los tipos coincidan
- 4.  Eliminar las interfaces duplicadas de los archivos originales
- 5.  Actualizar las referencias en todo el proyecto
      \*/

// Re-exportar las interfaces legacy para compatibilidad temporal
export {
NodeClass,
INode,
INodeCanvas,
IConnection
} from './node/node.interface.js'

export {
Project,
ProjectAttributes,
ProjectTransportConfig
} from './project/project.interface.js'

export {
UserSettings,
UserSettingsAttributes,
Theme,
NotificationSettings,
PerformanceSettings,
PrivacySettings
} from './user/user-settings.interface.js'

export {
IWorkflow,
IWorkflowExecutionContextInterface,
IWorkflowExecutionInterface,
Workflow
} from './workflow/workflow.interface.js'
