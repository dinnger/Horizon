# 🌟 Horizon 3.1

> **Plataforma de automatización de flujos y gestión de microservicios basada en nodos**

![License: MIT Personal Use](https://img.shields.io/badge/License-MIT%20Personal%20Use-blue.svg)
![Version](https://img.shields.io/badge/version-3.0.0-green.svg)
![Node.js](https://img.shields.io/badge/node.js-%3E%3D%2022.0.0-brightgreen.svg)
![Vue.js](https://img.shields.io/badge/vue.js-3.x-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.x-blue.svg)

## 📋 Índice

- [Descripción](#-descripción)
- [Características Principales](#-características-principales)
- [Arquitectura del Sistema](#️-arquitectura-del-sistema)
- [Instalación](#-instalación)
- [Uso Básico](#-uso-básico)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Configuración](#-configuración)
- [API Reference](#-api-reference)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contribución](#-contribución)
- [Licencia](#-licencia)

## 📋 Descripción

**Horizon** es una plataforma avanzada para la creación y gestión de flujos de trabajo (workflows) mediante una interfaz visual de nodos. Diseñada para simplificar la automatización de procesos complejos, ofrece capacidades completas de gestión de proyectos y orquestación de microservicios.

### ✨ Características Principales

- 🎨 **Editor Visual de Flujos**: Interfaz intuitiva de arrastrar y soltar para crear workflows complejos
- 🔧 **Sistema de Nodos Extensible**: Amplia biblioteca de nodos preconfigurados para diferentes tareas
- 📁 **Gestión de Proyectos**: Organización completa de workflows por proyectos
- 🚀 **Orquestación de Microservicios**: Deploy y gestión automatizada de servicios
- 🔐 **Sistema de Seguridad**: Autenticación, autorización y gestión de credenciales
- 📊 **Monitoreo en Tiempo Real**: Logs detallados y seguimiento de ejecución
- 🔄 **Workers Distribuidos**: Ejecución paralela y escalable de workflows
- 🌐 **API RESTful**: Integración completa mediante endpoints REST
- 🔌 **Sistema de Plugins**: Arquitectura extensible para funcionalidades personalizadas

## 🏗️ Arquitectura del Sistema

```text
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Cliente     │    │    Servidor     │    │    Workers      │
│   (Vue.js 3)    │◄──►│   (Node.js)     │◄──►│   (Threads)     │
│                 │    │                 │    │                 │
│ • Editor Visual │    │ • API REST      │    │ • Ejecución     │
│ • Gestión UI    │    │ • WebSockets    │    │ • Procesamiento │
│ • Monitoring    │    │ • Base de Datos │    │ • Plugins       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 🧩 Componentes Principales

- **Cliente Web**: Interfaz de usuario moderna construida con Vue.js 3 y TypeScript
- **Servidor Principal**: Backend con Express.js, manejo de sesiones y WebSockets
- **Workers**: Sistema de hilos para ejecución distribuida de workflows
- **Base de Datos**: Persistencia de proyectos, workflows y configuraciones
- **Sistema de Plugins**: Arquitectura modular para nodos personalizados

## 🚀 Instalación

### Prerrequisitos

- **Node.js** >= 22.0.0
- **npm** >= 10.0.0
- **SQLite** (incluido)

### Instalación Rápida

```bash
# Clonar el repositorio
git clone <repository-url> horizon
cd horizon

# Instalar dependencias del servidor
npm install

# Instalar dependencias del cliente
cd client
npm install
cd ..

# Compilar TypeScript
npm run build

# Iniciar el servidor
npm start
```

### Modo Desarrollo

```bash
# Terminal 1: Servidor en modo desarrollo
npm run start:dev

# Terminal 2: Cliente en modo desarrollo
cd client
npm run dev
```

## 🎯 Uso Básico

### 1. Crear un Proyecto

1. Accede a la interfaz web en `http://localhost:3000`
2. Navega a la sección **Proyectos**
3. Haz clic en **Nuevo Proyecto**
4. Completa la información del proyecto

### 2. Crear un Workflow

1. Dentro de tu proyecto, selecciona **Workflows**
2. Haz clic en **Nuevo Workflow**
3. Asigna un nombre y descripción
4. Comienza a diseñar con el editor visual

### 3. Diseñar con Nodos

```text
┌─────────┐    ┌─────────┐    ┌─────────┐
│ Trigger │───►│Process  │───►│ Output  │
│  HTTP   │    │  Data   │    │  Email  │
└─────────┘    └─────────┘    └─────────┘
```

- **Arrastra nodos** desde la paleta lateral
- **Conecta nodos** haciendo clic y arrastrando entre puertos
- **Configura propiedades** haciendo doble clic en cada nodo
- **Ejecuta y prueba** tu workflow

### 4. Tipos de Nodos Disponibles

#### 🔗 **Integración**

- HTTP Request/Response
- WebHooks
- SOAP Services
- Database Connectors

#### 🎛️ **Control de Flujo**

- Condicionales
- Iteraciones
- Temporizadores
- Sub-flujos

#### 📧 **Comunicación**

- Email (SMTP/Gmail)
- Notifications
- SMS
- Socket.IO

#### 🤖 **Inteligencia Artificial**

- Modelos locales
- Generadores de contenido
- Procesamiento de texto
- Análisis de datos

#### 📊 **Datos**

- Transformadores
- Validadores
- Filtros
- Agregadores

## 📂 Estructura del Proyecto

```text
horizon/
├── 📁 client/                 # Frontend Vue.js
│   ├── 📁 src/
│   │   ├── 📁 pages/         # Páginas principales
│   │   ├── 📁 components/    # Componentes reutilizables
│   │   ├── 📁 stores/        # Gestión de estado (Pinia)
│   │   └── 📁 router/        # Configuración de rutas
│   └── 📄 package.json
├── 📁 server/                # Backend Node.js
│   ├── 📁 controllers/       # Controladores de API
│   ├── 📁 services/          # Lógica de negocio
│   ├── 📁 database/          # Modelos y entidades
│   └── 📁 modules/           # Módulos del sistema
├── 📁 worker/                # Sistema de workers
│   ├── 📁 modules/           # Módulos de ejecución
│   └── 📄 worker.ts          # Worker principal
├── 📁 shared/                # Código compartido
│   ├── 📁 interface/         # Interfaces TypeScript
│   ├── 📁 plugins/           # Plugins de nodos
│   └── 📁 utils/             # Utilidades comunes
├── 📁 data/                  # Datos de proyectos
├── 📁 logs/                  # Archivos de log
└── 📄 package.json
```

## 🔧 Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Servidor
NODE_ENV=development
SERVER_CLUSTERS=1
SERVER_PORT=3000
SERVER_URL=http://localhost:3000
SERVER_BASE=/

# Base de datos
DATABASE_DIALECT=sqlite
DATABASE_STORAGE=./horizon.sqlite

# Workers
WORKER_INIT_PORT=4000
WORKER_TRACE=true
```

### Configuración de Base de Datos

El sistema utiliza SQLite por defecto, pero puedes configurar otras bases de datos modificando la configuración en `DATABASE_DIALECT` y `DATABASE_STORAGE`.

## 🔌 API Reference

### Endpoints Principales

#### Proyectos

```http
GET    /api/projects          # Listar proyectos
POST   /api/projects          # Crear proyecto
PUT    /api/projects/:id      # Actualizar proyecto
DELETE /api/projects/:id      # Eliminar proyecto
```

#### Workflows

```http
GET    /api/workflows         # Listar workflows
POST   /api/workflows         # Crear workflow
PUT    /api/workflows/:id     # Actualizar workflow
DELETE /api/workflows/:id     # Eliminar workflow
POST   /api/workflows/:id/run # Ejecutar workflow
```

#### Workers

```http
GET    /api/workers           # Estado de workers
POST   /api/workers/start     # Iniciar worker
POST   /api/workers/stop      # Detener worker
```

### WebSocket Events

```javascript
// Conectar al servidor
const socket = io("http://localhost:3000");

// Escuchar eventos de workflows
socket.on("workflow/status", (data) => {
  console.log("Estado del workflow:", data);
});

// Ejecutar workflow
socket.emit("server/workflows/run", { uid: "workflow-id" });
```

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Test del cliente
cd client
npm run test

# Test de coverage
npm run test:coverage
```

## 📦 Deployment

### Producción Local

```bash
# Compilar para producción
npm run build

# Iniciar en modo producción
NODE_ENV=production npm start
```

### Docker (Próximamente)

```dockerfile
# Dockerfile ejemplo
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contribución

### Desarrollar Plugins

1. **Crear estructura del plugin**:

```bash
mkdir shared/plugins/nodes/mi_nodo_personalizado
cd shared/plugins/nodes/mi_nodo_personalizado
```

2. **Implementar el nodo**:

```typescript
// index.ts
import type {
  INodeClass,
  INodeClassOnExecute,
  INodeClassProperty,
  INodeClassPropertyType,
} from "@shared/interface/node.interface.js";

// Definir las propiedades del nodo
interface IProperties extends INodeClassProperty {
  texto: Extract<INodeClassPropertyType, { type: "string" }>;
  numero: Extract<INodeClassPropertyType, { type: "number" }>;
  opciones: Extract<INodeClassPropertyType, { type: "options" }>;
}

export default class implements INodeClass<IProperties> {
  constructor(
    public dependencies: string[],
    public info: INodeClass["info"],
    public properties: IProperties
  ) {
    // Dependencias npm requeridas
    this.dependencies = ["axios"]; // Ejemplo: ['axios', 'lodash']

    // Información del nodo
    this.info = {
      title: "Mi Nodo Personalizado",
      desc: "Descripción de lo que hace el nodo",
      icon: "🔧", // Icono que aparecerá en la interfaz
      group: "Personalizados", // Grupo en la paleta de nodos
      color: "#FF6B6B", // Color del nodo
      connectors: {
        inputs: ["input"], // Conectores de entrada
        outputs: ["success", "error"], // Conectores de salida
      },
      flags: {
        // Opcional: configuraciones especiales
        isTrigger: false, // Si es un nodo disparador
        isSingleton: false, // Si solo puede haber una instancia
      },
    };

    // Propiedades configurables del nodo
    this.properties = {
      texto: {
        name: "Texto de entrada",
        type: "string",
        value: "Valor por defecto",
        description: "Descripción del campo",
      },
      numero: {
        name: "Número",
        type: "number",
        value: 10,
        description: "Un valor numérico",
      },
      opciones: {
        name: "Seleccionar opción",
        type: "options",
        options: [
          { label: "Opción 1", value: "op1" },
          { label: "Opción 2", value: "op2" },
        ],
        value: "op1",
      },
    };
  }

  // Método principal de ejecución
  async onExecute({ outputData, dependency, logger }: INodeClassOnExecute) {
    try {
      // Importar dependencias
      const axios = await dependency.getRequire("axios");

      // Obtener valores de las propiedades
      const texto = this.properties.texto.value as string;
      const numero = this.properties.numero.value as number;
      const opcion = this.properties.opciones.value as string;

      // Lógica del nodo
      logger.info(`Procesando: ${texto} con número ${numero}`);

      const resultado = {
        textoProcessado: texto.toUpperCase(),
        numeroCalculado: numero * 2,
        opcionSeleccionada: opcion,
        timestamp: new Date().toISOString(),
      };

      // Enviar resultado por el conector 'success'
      outputData("success", resultado);
    } catch (error: any) {
      // Enviar error por el conector 'error'
      outputData("error", {
        error: error.message || "Error desconocido",
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Método opcional: se ejecuta cuando se crea el nodo
  async onCreate({ context, environment }) {
    // Configuración inicial del nodo
    console.log("Nodo creado en el contexto:", context.info.uid);
  }
}
```

3. **Ejemplos de nodos más complejos**:

**Nodo con credenciales (como Spotify)**:

```typescript
interface ICredentials extends INodeClassProperty {
  apiKey: Extract<INodeClassPropertyType, { type: "string" }>;
  secret: Extract<INodeClassPropertyType, { type: "string" }>;
}

export default class implements INodeClass<IProperties, ICredentials> {
  constructor(
    public accessSecrets: boolean,
    public dependencies: string[],
    public info: INodeClass["info"],
    public properties: IProperties,
    public credentials: ICredentials
  ) {
    this.accessSecrets = true; // Habilitar acceso a credenciales

    // Configurar credenciales
    this.credentials = {
      apiKey: {
        name: "API Key",
        type: "string",
        value: "",
        required: true,
      },
      secret: {
        name: "Secret",
        type: "string",
        value: "",
        required: true,
      },
    };
  }

  async onExecute({ credential, outputData }: INodeClassOnExecute) {
    // Obtener credenciales
    const { apiKey, secret } = await credential.getCredential(
      String(this.properties.authSecret.value)
    );

    // Usar credenciales en la lógica del nodo
    // ...
  }
}
```

**Nodo trigger (como Webhook)**:

```typescript
export default class implements INodeClass {
  constructor() {
    this.info = {
      // ...
      flags: {
        isTrigger: true, // Marcar como nodo disparador
      },
    };
  }

  async onExecute({ app, outputData }: INodeClassOnExecute) {
    // Configurar endpoint HTTP
    const endpoint = this.properties.endpoint.value as string;

    app.get(endpoint, (req, res) => {
      // Procesar request y enviar datos al flujo
      outputData(
        "response",
        {
          headers: req.headers,
          query: req.query,
          body: req.body,
        },
        { req, res }
      );
    });
  }
}
```

4. **Registrar el plugin**:

Los nodos se cargan automáticamente desde la carpeta `shared/plugins/nodes/`. Solo es necesario reiniciar el servidor para que los nuevos nodos aparezcan en la paleta.

### Guías de Contribución

- 🔀 Fork del repositorio
- 🌿 Crear rama para nueva funcionalidad
- 📝 Escribir tests para cambios
- 🧹 Seguir el estilo de código existente
- 📤 Enviar Pull Request con descripción detallada

## 🐛 Reportar Issues

Para reportar bugs o solicitar funcionalidades:

1. Verificar si el issue ya existe
2. Proporcionar información detallada
3. Incluir logs de error si aplica
4. Especificar versión y entorno

## 📚 Documentación Adicional

- [🔧 Guía de Configuración Avanzada](docs/advanced-configuration.md)
- [🔌 Desarrollo de Plugins](docs/plugin-development.md)
- [🚀 Guía de Deployment](docs/deployment.md)
- [🔐 Configuración de Seguridad](docs/security.md)
- [📊 Monitoreo y Logs](docs/monitoring.md)

## 📋 Roadmap

### Versión 3.2 (Q2 2025)

- [ ] 🐳 Soporte Docker completo
- [ ] 📈 Dashboard de métricas

### Versión 3.5 (Q3 2025)

- [ ] ☁️ Deploy en la nube
- [ ] 🔄 Backup automático
- [ ] 🤖 Más nodos de IA

## 📄 Licencia

**MIT License (Uso Personal Únicamente)**

Copyright (c) 2025 Horizon Team

Se otorga permiso, de forma gratuita, a cualquier persona que obtenga una copia de este software y archivos de documentación asociados (el "Software"), para usar el Software únicamente para fines personales y no comerciales.

### Restricciones:

- ❌ **Uso comercial prohibido**
- ❌ **Redistribución con fines de lucro prohibida**
- ✅ **Uso personal permitido**
- ✅ **Modificación para uso personal permitida**
- ✅ **Contribuciones al proyecto permitidas**

> Para uso comercial, contactar al equipo de desarrollo.

## 👥 Equipo

- **Desarrollo Principal**: Walter Omar

## 📞 Soporte

- **Documentación**: [Wiki del proyecto]
- **Issues**: [GitHub Issues]
- **Email**: informacion@dinnger.com

---

**Horizon 3.1** - Automatiza tu futuro, nodo por nodo 🚀
