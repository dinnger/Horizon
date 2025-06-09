import type { IClientStepButtons, IClientStepType } from '@shared/interfaces/client.interface'

type FieldsStepType = Extract<IClientStepType, { type: 'fields' }>
type ButtonsStepType = Extract<IClientStepType, { type: 'buttons' }>
type SpecificStepsKnownKeys = {
	credentials: ButtonsStepType
	info: FieldsStepType
	properties: FieldsStepType
}

export const listCredentialsSteps = ({
	listCrendentials
}: {
	listCrendentials: IClientStepButtons | never
}): SpecificStepsKnownKeys => {
	return {
		credentials: {
			type: 'buttons',
			label: 'Selección de Credenciales',
			description: 'Selecciona la credencial que deseas usar',
			fieldDatabase: 'credentials_type',
			element: listCrendentials
		},
		info: {
			type: 'fields',
			label: 'Información de la Credencial',
			fieldDatabase: 'info',
			element: {
				name: {
					name: 'Nombre:',
					type: 'string',
					value: '',
					required: true,
					onTransform: (v) => v.toUpperCase(),
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
			onActions: 'properties'
		},
		properties: {
			type: 'fields',
			label: 'Propiedades',
			fieldDatabase: 'properties',
			element: {},
			onActions: []
		}
	}
}
