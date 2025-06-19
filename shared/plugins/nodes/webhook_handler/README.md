# Webhook Handler Node

Este módulo implementa un nodo de webhook para el sistema Hozion. La lógica se ha separado en múltiples archivos para mejorar la mantenibilidad y organización del código.

## Estructura de archivos

### `index.ts` - Clase principal

Contiene la clase principal que implementa `INodeClass`. Es el punto de entrada del nodo y coordina todas las funcionalidades importando desde los otros módulos.

### `interfaces.ts` - Interfaces TypeScript

Define todas las interfaces utilizadas en el módulo:

- `Request`: Extensión de Express Request con soporte para archivos
- `IProperties`: Interface que define todas las propiedades del nodo

### `properties.ts` - Configuración de propiedades

Contiene la definición completa de todas las propiedades del nodo webhook, incluyendo:

- Configuración básica (URL, endpoint, tipo, timeout)
- Opciones de seguridad
- Opciones avanzadas (CORS, redirección, proxy)

### `security.ts` - Validación de seguridad

Implementa todas las funciones relacionadas con la autenticación y autorización:

- `validateBasicAuth()`: Validación de autenticación básica
- `validateBearerToken()`: Validación de tokens Bearer
- `validateJWT()`: Validación de tokens JWT
- `handleSecurityError()`: Manejo de errores de seguridad

### `handlers.ts` - Manejadores de funcionalidades avanzadas

Contiene los manejadores para las características avanzadas:

- `configureCORS()`: Configuración de headers CORS
- `handleRedirect()`: Manejo de redirecciones
- `handleProxy()`: Funcionalidad de proxy reverso

### `utils.ts` - Utilidades

Funciones auxiliares y utilidades:

- `generateWebhookURL()`: Generación de URLs del webhook
- `buildWebhookPath()`: Construcción de rutas del webhook
- `configurePropertiesVisibility()`: Configuración de visibilidad de propiedades en la UI
- `prepareRequestData()`: Preparación de datos de la petición

## Flujo de ejecución

1. **onCreate**: Configura la visibilidad de propiedades y genera URLs
2. **onExecute**:
   - Configura la ruta del webhook
   - Maneja CORS, redirecciones y proxy
   - Valida seguridad según el tipo configurado
   - Procesa la petición y envía respuesta

## Características soportadas

- **Métodos HTTP**: GET, POST, PUT, PATCH, DELETE
- **Seguridad**: Básica, Bearer Token, JWT
- **CORS**: Configuración completa de headers
- **Redirección**: Múltiples códigos de estado
- **Proxy**: Reenvío de peticiones con preservación de headers
- **Timeout**: Configurable por petición

## Uso

El nodo se importa automáticamente en el sistema. La clase principal mantiene la compatibilidad total con la interface `INodeClass` existente, por lo que no se requieren cambios en el código que lo utiliza.
