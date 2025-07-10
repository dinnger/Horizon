# Acceso al Dashboard de Workers

## Cómo Acceder

El Dashboard de Workers está ahora disponible en la aplicación web de Horizon v1.

### Navegación

1. **Iniciar sesión** en la aplicación
2. En el menú lateral izquierdo, buscar el icono **Workers** (icono de servidor con líneas de actividad)
3. Hacer clic en **"Workers"** para acceder al dashboard

### URL Directa

También puedes acceder directamente mediante la URL:

```
http://localhost:5173/workers
```

## Características del Dashboard

### 📊 Vista General (Overview Cards)

- **Workers Activos**: Número total de workers ejecutándose
- **Ejecutándose**: Workers en estado de ejecución
- **Con Errores**: Workers que han encontrado errores
- **Memoria Total**: Uso total de memoria de todos los workers

### 📋 Tabla de Workers Activos

Muestra información detallada de cada worker:

- **ID**: Identificador único del worker (primeros 8 caracteres)
- **Workflow**: ID del workflow que está ejecutando
- **Estado**: Estado actual (iniciando, ejecutando, deteniendo, error)
- **Puerto**: Puerto asignado al worker
- **Tiempo Activo**: Tiempo transcurrido desde el inicio
- **Memoria**: Uso actual de memoria
- **Acciones**: Botones para enviar mensajes, reiniciar o detener

### 🔄 Acciones Disponibles

#### Por Worker:

- **Enviar Mensaje**: Abre modal para enviar comandos específicos
- **Reiniciar**: Reinicia el worker manteniendo la configuración
- **Detener**: Termina el worker

#### Generales:

- **Actualizar**: Refresca manualmente los datos
- **Auto-actualizar**: Activar/desactivar actualización automática cada 5 segundos

### 📈 Distribución por Workflow

Muestra cómo se distribuyen los workers por workflow:

- Número de workers por workflow
- Estado individual de cada worker
- Puerto asignado a cada worker

### ⚠️ Alertas de Rendimiento

Se muestran automáticamente cuando:

- Workers usan más de 100MB de memoria
- Se detectan problemas de rendimiento

### 📱 Actividad Reciente

Timeline de workers iniciados en las últimas 24 horas con:

- ID del worker
- Workflow asociado
- Hora de inicio

## Comunicación con Workers

### Rutas Disponibles para Mensajes

Al usar "Enviar Mensaje", puedes usar estas rutas:

```json
{
  "nodes:list": {},
  "nodes:get": { "type": "node-type" },
  "system:health": {},
  "worker:status": {}
}
```

### Ejemplo de Mensaje

**Ruta**: `nodes:list`
**Datos**: `{}`

Esto solicitará al worker la lista de nodos disponibles.

## Estados de Workers

- 🟡 **starting**: Worker iniciándose
- 🟢 **running**: Worker ejecutándose normalmente
- 🟠 **stopping**: Worker deteniéndose
- 🔴 **error**: Worker con errores
- ⚫ **stopped**: Worker detenido

## Actualización en Tiempo Real

El dashboard se actualiza automáticamente:

- **Cada 5 segundos** cuando auto-actualizar está activado
- **Eventos en tiempo real** para crear, detener y reiniciar workers
- **Métricas de rendimiento** enviadas por los workers

## Solución de Problemas

### Dashboard no muestra datos

1. Verificar que el servidor esté ejecutándose
2. Comprobar permisos de usuario para acceder a workers
3. Revisar conexión de WebSocket
4. Usar el botón "Reintentar" en el estado de error

### Workers no aparecen

1. Ejecutar un workflow para crear workers automáticamente
2. Verificar que los workflows se estén ejecutando correctamente
3. Revisar logs del servidor para errores de workers

### No se pueden enviar mensajes

1. Verificar que el worker esté en estado "running"
2. Comprobar que el JSON del mensaje sea válido
3. Revisar que la ruta sea compatible con el worker

## Integración con Workflows

Los workers se crean automáticamente cuando:

1. Se ejecuta un workflow desde la interfaz
2. El sistema necesita procesar un workflow en segundo plano
3. Se reinicia un worker manualmente

Para crear workers, simplemente ejecuta workflows desde la vista de workflows. El dashboard mostrará automáticamente los workers creados para la ejecución.

## Seguridad

- Solo usuarios autenticados pueden acceder al dashboard
- Los permisos se verifican en cada operación
- Las acciones destructivas (detener, reiniciar) requieren confirmación
- Los mensajes a workers son validados antes del envío
