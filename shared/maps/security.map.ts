import type { INodeClass } from '@shared/interface/node.interface.js'
import { getNodeClass } from './nodes.map.js'

const credentialsRegistry: { [key: string]: any } = {}

for (const [key, value] of Object.entries(getNodeClass() || {})) {
	if (value.credentials && Object.keys(value.credentials).length > 0) {
		credentialsRegistry[key] = value
	}
}

export function getCredentials() {
	return Object.fromEntries(
		Object.entries(credentialsRegistry).map(([key, value]) => [
			key,
			{
				name: value.name,
				info: value.info
			}
		])
	)
}

export function getCredentialsProperties(name: string) {
	return credentialsRegistry[name]?.credentials
}

export function getCredentialsActions(name: string) {
	return credentialsRegistry[name]?.credentialsActions
}

export function getCredentialsClass(name: string): INodeClass | undefined {
	return credentialsRegistry[name]?.class
}
