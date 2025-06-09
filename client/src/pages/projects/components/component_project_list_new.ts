import type { IClientStepType } from '@shared/interfaces/client.interface'

type FieldsStepType = Extract<IClientStepType, { type: 'fields' }>
type ButtonsStepType = Extract<IClientStepType, { type: 'buttons' }>
type SpecificStepsKnownKeys = {
	info: FieldsStepType
	transport: ButtonsStepType
	rabbitConfig: FieldsStepType
	tcpConfig: FieldsStepType
}

export const projectListSteps = (newProject: any, testProject: any): SpecificStepsKnownKeys => {
	return {
		info: {
			type: 'fields',
			label: 'Información del Proyecto',
			description: 'Información del proyecto',
			element: {
				name: {
					name: 'Nombre:',
					type: 'string',
					required: true,
					value: '',
					onTransform: (v: any) => v.toUpperCase(),
					onValidation: {
						pattern: '^[a-zA-Z0-9_]{3,}$',
						hint: ['Debe de ser de 3 a 20 caracteres', 'Solo letras, números y guiones bajos']
					}
				},
				description: {
					name: 'Descripción:',
					type: 'string',
					value: ''
				}
			},
			onActions: 'transport'
		},
		transport: {
			type: 'buttons',
			label: 'Selección de Transporte',
			fieldDatabase: 'transport_type',
			element: {
				empty: {
					icon: 'mdi-account-network-off-outline',
					label: 'Sin Transporte',
					description: 'Crear un nuevo proyecto'
				},
				tcp: {
					icon: 'mdi-server-network',
					label: 'TCP',
					description: 'Crear un nuevo proyecto',
					onActions: () => 'tcpConfig'
				},
				rabbitMQ: {
					icon: 'mdi-rabbit',
					label: 'RabbitMQ',
					description: 'Crear un nuevo proyecto',
					onActions: () => 'rabbitConfig'
				}
			}
		},
		tcpConfig: {
			type: 'fields',
			label: 'Configuración de TCP',
			fieldDatabase: 'transport_config',
			element: {
				port: {
					name: 'Puerto:',
					type: 'number',
					value: 8080
				}
			},
			onActions: [
				{
					label: 'Crear Proyecto',
					onActions: newProject
				}
			]
		},
		rabbitConfig: {
			type: 'fields',
			label: 'Configuración de RabbitMQ',
			fieldDatabase: 'transport_config',
			element: {
				url: {
					name: 'Url:',
					type: 'string',
					value: 'amqp://localhost'
				},
				exchange: {
					name: 'Exchange:',
					type: 'string',
					value: '{{info.element.name.value}}-exchange',
					onTransform: (v: any) => v.toLowerCase()
				}
			},
			onActions: [
				{
					label: 'Test Conexión',
					icon: 'mdi-swap-horizontal',
					onActions: testProject
				},
				{
					label: 'Crear Proyecto',
					onActions: newProject
				}
			]
		}
	}
}
