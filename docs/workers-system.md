# Sistema de Workers para Ejecución de Workflows

Este documento describe la implementación del sistema de workers para la ejecución distribuida de workflows en Horizon v1.

## Resumen del Sistema

El sistema permite la ejecución de workflows en procesos worker separados con comunicación bidireccional entre el servidor principal y los workers. Esto proporciona:

- **Aislamiento**: Cada workflow se ejecuta en su propio proceso
- **Escalabilidad**: Múltiples workflows pueden ejecutarse simultáneamente
- **Monitoreo**: Dashboard en tiempo real de workers activos
- **Comunicación**: Los workers pueden solicitar información al servidor
- **Gestión**: Control completo del ciclo de vida de los workers

## Arquitectura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client UI     │    │  Main Server    │    │     Worker      │
│   Dashboard     │◄──►│  WorkerManager  │◄──►│   Process       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Database &    │
                       │   File System   │
                       └─────────────────┘
```

## Componentes Implementados

### 1. WorkerManager (`server/src/services/workerManager.ts`)

Gestiona el ciclo de vida de los workers:

- **Creación de Workers**: Genera procesos worker con configuración específica
- **Comunicación**: Maneja mensajes bidireccionales con workers
- **Monitoreo**: Rastrea estado, memoria, CPU y métricas
- **Gestión de Puertos**: Asigna puertos únicos a cada worker
- **Cleanup**: Limpieza automática al terminar workers

#### Métodos principales:

- `createWorker(options)`: Crea un nuevo worker
- `stopWorker(workerId)`: Detiene un worker específico
- `sendRequestToWorker(workerId, route, data)`: Envía solicitud a worker
- `handleWorkerRequest(workerId, route, data, requestId)`: Procesa solicitudes de workers
- `getActiveWorkers()`: Obtiene lista de workers activos

### 2. Worker Routes (`server/src/routes/workers.ts`)

Rutas Socket.IO para gestión de workers:

- `workers:list` - Lista todos los workers activos
- `workers:get` - Obtiene información de worker específico
- `workers:stop` - Detiene un worker
- `workers:restart` - Reinicia un worker
- `workers:dashboard` - Datos para dashboard
- `workers:stats` - Estadísticas de workers
- `workers:send-message` - Envía mensaje a worker

### 3. Worker Process (`worker/index.ts`)

Proceso worker modificado con comunicación:

- **Comunicación con Servidor**: Clase `WorkerServerComm` para solicitudes
- **Inicialización**: Setup de comunicación al iniciar
- **Monitoreo**: Envío periódico de estadísticas
- **Manejo de Señales**: Shutdown graceful
- **Helper Functions**: Funciones para solicitar datos del servidor

### 4. Worker Communication Helper (`worker/shared/functions/serverComm.ts`)

Funciones helper para workers:

- `getNodesFromServer()` - Obtiene lista de nodos
- `getNodeFromServer(type)` - Obtiene nodo específico
- `getWorkflowFromServer(id)` - Obtiene workflow
- `sendWorkerLog(level, message)` - Envía logs
- `reportProgress(progress)` - Reporta progreso
- `sendMetrics(metrics)` - Envía métricas

### 5. Workers Dashboard (`client/src/components/WorkersDashboard.vue`)

Dashboard Vue para monitoreo:

- **Vista General**: Cards con estadísticas principales
- **Tabla de Workers**: Lista detallada con acciones
- **Distribución por Workflow**: Vista de workers por workflow
- **Alertas de Rendimiento**: Notificaciones de alto uso de memoria
- **Actividad Reciente**: Timeline de eventos
- **Comunicación**: Modal para enviar mensajes a workers

## Flujo de Ejecución

### 1. Ejecutar Workflow

```typescript
// Cliente solicita ejecución
socket.emit("workflows:execute", { workflowId: "xxx" });

// Servidor crea worker
const worker = await workerManager.createWorker({
  workflowId,
  executionId,
  version,
});

// Worker inicia y se conecta
worker.sendReady();
```

### 2. Comunicación Worker → Servidor

```typescript
// Worker solicita datos
const nodes = await getNodesFromServer();

// WorkerManager procesa solicitud
response = await this.handleNodesListRequest(data);

// Respuesta se envía de vuelta al worker
worker.process.send({ type: "response", data: response });
```

### 3. Monitoreo en Dashboard

```typescript
// Dashboard solicita datos
socket.emit('workers:dashboard', {})

// Servidor responde con estadísticas
callback({
  overview: { totalActive: 5, running: 3, errors: 0 },
  performance: { totalMemoryUsage: 512000000 },
  workflows: { distribution: {...} }
})
```

## Configuración

### Variables de Entorno

```bash
# Worker Configuration
WORKER_ID=auto-generated
SERVER_PORT=3000
NODE_ENV=development
SERVER_CLUSTERS=4

# Port Range for Workers
WORKER_PORT_START=3001
WORKER_PORT_END=4000
```

### Worker Creation Options

```typescript
interface WorkerOptions {
  workflowId: string; // ID del workflow a ejecutar
  executionId?: string; // ID de la ejecución
  version?: string; // Versión específica del workflow
}
```

## Uso

### 1. Ejecutar Workflow con Worker

```typescript
// Desde cliente
const response = await socket.emit("workflows:execute", {
  workflowId: "workflow-123",
  trigger: "manual",
});

// El sistema automáticamente:
// 1. Crea worker
// 2. Guarda workflow en archivo
// 3. Inicia ejecución
// 4. Monitorea progreso
```

### 2. Monitorear Workers

```typescript
// Obtener dashboard
const dashboard = await socket.emit("workers:dashboard", {});

// Listar workers activos
const workers = await socket.emit("workers:list", {});

// Detener worker
await socket.emit("workers:stop", { workerId: "worker-123" });
```

### 3. Comunicación desde Worker

```typescript
// Dentro del worker
import {
  getNodesFromServer,
  reportProgress,
} from "./shared/functions/serverComm";

// Obtener nodos
const nodes = await getNodesFromServer();

// Reportar progreso
await reportProgress({
  nodeId: "node-123",
  stepName: "Processing data",
  percentage: 45,
  message: "Procesando 100 registros...",
});
```

## Beneficios

### 1. Aislamiento y Estabilidad

- Workers ejecutan en procesos separados
- Fallos en un workflow no afectan otros
- Mejor gestión de memoria y recursos

### 2. Escalabilidad

- Múltiples workflows simultáneos
- Distribución automática de puertos
- Clustering para mejor rendimiento

### 3. Monitoreo y Observabilidad

- Dashboard en tiempo real
- Métricas de memoria y CPU
- Logs centralizados
- Alertas de rendimiento

### 4. Comunicación Bidireccional

- Workers pueden solicitar datos del servidor
- Actualizaciones de progreso en tiempo real
- Gestión centralizada de recursos

### 5. Gestión del Ciclo de Vida

- Inicio/parada controlada de workers
- Reinicio automático en caso de fallo
- Cleanup automático de recursos

## Próximos Pasos

1. **Persistencia**: Guardar métricas y logs en base de datos
2. **Balanceador de Carga**: Distribución inteligente de workers
3. **Auto-scaling**: Creación automática de workers basada en carga
4. **Notificaciones**: Sistema de alertas avanzado
5. **API REST**: Endpoints adicionales para gestión externa
6. **Clustering**: Soporte para múltiples instancias del servidor
7. **Health Checks**: Verificación periódica de salud de workers

## Troubleshooting

### Problemas Comunes

1. **Worker no inicia**: Verificar puertos disponibles y permisos
2. **Comunicación falla**: Revisar configuración de socket y IPC
3. **Alto uso de memoria**: Configurar límites y cleanup automático
4. **Workers zombi**: Implementar timeouts y cleanup forzado

### Logs Importantes

```bash
# Worker creado
Worker abc123 creado para workflow xyz en puerto 3001

# Comunicación establecida
Worker abc123: Recibida lista de nodos (25 nodos)

# Worker terminado
Worker abc123 terminó con código 0
```

Este sistema proporciona una base sólida para la ejecución distribuida y escalable de workflows con monitoreo completo y comunicación bidireccional.
