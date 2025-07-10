# Interfaces Estandarizadas - Horizon v1

## Descripción

Este directorio contiene las interfaces estandarizadas para todo el proyecto Horizon v1. La estandarización tiene como objetivo eliminar la duplicación de código, mejorar la consistencia y facilitar el mantenimiento del proyecto.

## Estructura de Directorios

```
shared/interfaces/
├── node/
│   └── node.interface.ts          # Interfaces de nodos
├── project/
│   └── project.interface.ts       # Interfaces de proyectos
├── user/
│   └── user-settings.interface.ts # Interfaces de configuración de usuario
├── workflow/
│   └── workflow.interface.ts      # Interfaces de workflows
├── standardized.ts                # Archivo principal de interfaces estandarizadas
├── index.ts                       # Interfaces legacy (compatibilidad)
└── MIGRATION_GUIDE.md            # Guía de migración
```

## Uso

### Importar Interfaces Estandarizadas

```typescript
// Importar interfaces específicas
import {
  INodeWorker,
  IProjectClient,
  IUserSettingsClient,
  IWorkflowFull,
} from "@shared/interfaces/standardized.js";

// Usar en el código
const node: INodeWorker = {
  id: "node-1",
  name: "My Node",
  type: "custom",
  // ...
};
```

### Interfaces Principales

#### Nodos (Node)

- `INodeBase`: Interface base para todos los nodos
- `INodeFull`: Nodo completo con toda la información
- `INodeCanvas`: Nodo específico para el canvas
- `INodeWorker`: Nodo específico para el worker
- `INodeConnection`: Conexión entre nodos

#### Proyectos (Project)

- `IProjectBase`: Interface base para proyectos
- `IProjectClient`: Proyecto específico para el cliente
- `IProjectServer`: Proyecto específico para el servidor
- `IProjectTransportConfig`: Configuración de transporte

#### Configuración de Usuario (User Settings)

- `IUserSettingsBase`: Interface base para configuraciones
- `IUserSettingsClient`: Configuración específica para el cliente
- `IUserSettingsServer`: Configuración específica para el servidor
- `IUserTheme`: Configuración de tema

#### Workflows

- `IWorkflowBase`: Interface base para workflows
- `IWorkflowFull`: Workflow completo
- `IWorkflowWorker`: Workflow específico para el worker
- `IWorkflowClient`: Workflow específico para el cliente

## Patrón de Nomenclatura

Las interfaces siguen el patrón: `I[Entity][Context]Interface`

- **Entity**: Tipo de entidad (Node, Project, User, Workflow)
- **Context**: Contexto específico (Client, Server, Worker, Canvas)

Ejemplos:

- `INodeWorker`: Interface de nodo para el worker
- `IProjectClient`: Interface de proyecto para el cliente
- `IUserSettingsServer`: Interface de configuración de usuario para el servidor

## Migración

### Interfaces Legacy

Para mantener compatibilidad, se mantienen las interfaces legacy con alias:

```typescript
// Interfaces legacy (serán depreciadas)
export interface NodeClass extends INodeWorker {}
export interface Project extends IProjectClient {}
export interface UserSettings extends IUserSettingsClient {}
```

### Script de Migración

Se proporciona un script de migración automática:

```bash
node migrate-interfaces.js
```

### Migración Manual

Para migrar manualmente:

1. Cambiar las importaciones:

   ```typescript
   // Antes
   import { NodeClass } from "./old-path";

   // Después
   import { INodeWorker } from "@shared/interfaces/standardized.js";
   ```

2. Actualizar el uso:

   ```typescript
   // Antes
   const node: NodeClass = {...}

   // Después
   const node: INodeWorker = {...}
   ```

## Ventajas de la Estandarización

1. **Eliminación de Duplicación**: No más interfaces duplicadas en diferentes módulos
2. **Consistencia**: Todas las interfaces siguen el mismo patrón
3. **Mantenibilidad**: Centralización facilita el mantenimiento
4. **Escalabilidad**: Estructura modular para fácil extensión
5. **Compatibilidad**: Transición gradual sin romper el código existente

## Mejores Prácticas

1. **Usar interfaces estandarizadas** para nuevo código
2. **Migrar gradualmente** el código existente
3. **Documentar cambios** en las interfaces
4. **Versionar interfaces** para cambios importantes
5. **Validar con TypeScript** antes de hacer commit

## Contribuir

Al añadir nuevas interfaces:

1. Seguir el patrón de nomenclatura establecido
2. Colocar en el directorio correcto según la entidad
3. Añadir documentación JSDoc
4. Exportar desde `standardized.ts`
5. Crear alias legacy si es necesario

## Soporte

Para dudas sobre la migración o uso de las interfaces:

1. Consultar `MIGRATION_GUIDE.md`
2. Revisar el `INTERFACE_STANDARDIZATION_REPORT.md`
3. Revisar ejemplos en el código existente

---

**Nota**: Las interfaces legacy serán depreciadas en futuras versiones. Se recomienda migrar a las interfaces estandarizadas lo antes posible.
