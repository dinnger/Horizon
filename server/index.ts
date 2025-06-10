import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import http from 'node:http'

import { router } from './server_router.js'
import { verify_connection } from './database/index.js'
import { InitializeServer, secretKeyServer } from './server_init.js'
import { security_controller } from './controllers/security.controller.js'
import { workflowsService } from './services/workflows.service.js'
import { Initialize_Socket } from './modules/socket.module.js'
import bodyParser from 'body-parser'
import { JobServer } from './server_job.js'
import envs from '../shared/utils/envs.js'
import { credentialController } from './controllers/credentials.controller.js'
import session from 'express-session'
import history from 'connect-history-api-fallback'
import { debug_controller } from './controllers/debug.controller.js'

// Extend SessionData to include credentials
declare module 'express-session' {
	interface SessionData {
		credentials: any
		user: any
		workspace?: number
	}
}

const app = express()
const server = http.createServer(app)

InitializeServer()

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(helmet())
app.use(cors())
const confSession = {
	secret: secretKeyServer,
	resave: false,
	saveUninitialized: true,
	cookie: { secure: false }
}
if (envs.NODE_ENV === 'production') {
	app.set('trust proxy', 1) // trust first proxy
	confSession.cookie.secure = true // serve secure cookies
}
app.use(session(confSession))

JobServer()

Initialize_Socket({ app, server, path: '/ws', fn: router })

app.use('/api/security', security_controller())
app.use('/api/credential', credentialController())
app.use('/api/debug', debug_controller())

const PATH_URL = envs.SERVER_BASE?.slice(-1) === '/' ? envs.SERVER_BASE.toString().slice(0, -1) : (envs.SERVER_BASE ?? '')
const pathStatic = express.static('./client/dist')
app.use(`${PATH_URL}/ui`, history({ verbose: false }))
app.use(`${PATH_URL}/ui`, pathStatic)

server.listen(envs.SERVER_PORT, async () => {
	verify_connection().then(async (result) => {
		// Crear archivos de base de datos
		await workflowsService().load()
		if (result) console.log('Server started on port', envs.SERVER_PORT)
	})
})
