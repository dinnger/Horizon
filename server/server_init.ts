import fs from 'node:fs'
import crypto from 'node:crypto'

export let secretKeyServer = ''

export async function InitializeServer() {
	// Crear carpetas
	fs.rmSync('./data', { recursive: true, force: true })
	fs.mkdirSync('./data/workflows', { recursive: true })
	fs.mkdirSync('./data/projects', { recursive: true })

	// Crear archivo de secreto
	if (!fs.existsSync('./server/secret.key')) {
		console.log('Creando archivo de secreto')
		const secretKey = crypto.randomBytes(10).toString('hex')
		fs.writeFileSync('./server/secret.key', secretKey)
		secretKeyServer = secretKey
	} else {
		secretKeyServer = fs.readFileSync('./server/secret.key', 'hex')
	}
}
