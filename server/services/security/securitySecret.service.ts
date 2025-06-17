import type { ISecuritySecretEntity, SecuritySecretType, SecuritySecretSubType } from '@entities/security.secret.interface.js';
import { utils_map_json as utilsMapJson } from '../../../shared/utils/utilities.js';
import { Status_Table as StatusTable } from '../../database/entity/global.status.entity.js';

// Minimal interface for data needed by createEnvs function
interface SecretCoreInfo {
	name: string;
	value: string; // Should be the JSON string representation of the value if it's an object
	type: SecuritySecretType;
	subType?: SecuritySecretSubType;
}
import { Secret_Table as SecretTable } from '../../database/entity/security.secret.entity.js';
import { Users_Table as UsersTable } from '../../database/entity/security.users.entity.js';
import { decrypt, encrypt } from '../../modules/security.module.js';

/**
 * @interface SecretOperationResult
 * @description Standard result for secret operations that might return a message or an error.
 * @property {string} [msg] - Success message.
 * @property {string} [error] - Error message, if any.
 */
interface SecretOperationResult {
	msg?: string;
	error?: string;
}

/**
 * @interface NewSecretParams
 * @description Parameters for creating a new secret.
 * @property {string} name - The name of the secret.
 * @property {string} description - A description for the secret.
 * @property {SecuritySecretType} type - The type of the secret (e.g., 'DATABASE', 'VARIABLES').
 * @property {SecuritySecretSubType} [subType] - The sub-type, if applicable (e.g., 'MYSQL', 'POSTGRES').
 * @property {string} value - The value of the secret (will be encrypted).
 */
interface NewSecretParams {
	name: string;
	description: string;
	type: SecuritySecretType;
	subType?: SecuritySecretSubType;
	value: string;
}

/**
 * @interface GetSecretParams
 * @description Parameters for fetching a secret by its ID.
 * @property {number} id - The unique identifier of the secret.
 */
interface GetSecretParams {
	id: number;
}

/**
 * @interface GetSecretResult
 * @description Result of fetching a single secret.
 * @property {ISecuritySecretEntity | null} [secret] - The secret entity, or null if not found. Value is decrypted.
 * @property {string} [error] - Error message, if any.
 */
interface GetSecretResult {
	secret?: ISecuritySecretEntity | null;
	error?: string;
}

/**
 * @interface GetByNameParams
 * @description Parameters for fetching a secret by its type, sub-type, and name.
 * @property {string} type - The type of the secret.
 * @property {string} [subType] - The optional sub-type of the secret.
 * @property {string} name - The name of the secret.
 */
interface GetByNameParams {
	type: string;
	subType?: string;
	name: string;
}

/**
 * @interface ListSecretsParams
 * @description Parameters for listing secrets.
 * @property {boolean} [showValues] - If true, decrypts and includes the secret values in the result. Defaults to false.
 */
interface ListSecretsParams {
	showValues?: boolean;
}

/**
 * @interface ListedSecret
 * @description Represents a secret item as returned by the list operation.
 * Value is optionally decrypted based on `showValues`.
 * @extends Omit<ISecuritySecretEntity, 'value'>
 * @property {string} [value] - The secret's value, decrypted if requested.
 * @property {Partial<UsersTable>} user - Partial information of the user who created the secret.
 * @property {Partial<StatusTable>} status - Partial information of the secret's status.
 */
interface ListedSecret extends Omit<ISecuritySecretEntity, 'value'> {
	value?: string;
    user: Partial<UsersTable>;
    status: Partial<StatusTable>;
}

/**
 * @interface ListSecretsResult
 * @description Result of the list secrets operation.
 * @property {ListedSecret[]} [secrets] - An array of listed secrets.
 * @property {string} [error] - Error message, if any.
 */
interface ListSecretsResult {
    secrets?: ListedSecret[];
    error?: string;
}

/**
 * @interface EditSecretParams
 * @description Parameters for editing an existing secret. Includes all fields from NewSecretParams plus the ID.
 * @extends NewSecretParams
 * @property {number} id - The ID of the secret to edit.
 */
interface EditSecretParams extends NewSecretParams {
	id: number;
}

/**
 * @interface DeleteSecretParams
 * @description Parameters for deleting a secret.
 * @property {number} id - The ID of the secret to delete.
 */
interface DeleteSecretParams {
	id: number;
}

/**
 * @export
 * @interface SecuritySecretService
 * @description Defines the contract for the Security Secret Service.
 * This service handles CRUD operations for secrets, including encryption and decryption.
 */
export interface SecuritySecretService {
	/** Creates a new secret, encrypting its value. */
	new: (params: NewSecretParams) => Promise<SecretOperationResult>;
	/** Retrieves a specific secret by ID, decrypting its value. */
	get: (params: GetSecretParams) => Promise<GetSecretResult>;
	/** Retrieves a secret by type, sub-type, and name, returning a structured object for environment variables. */
	getByName: (params: GetByNameParams) => Promise<object | null | { error: string }>;
	/** Lists secrets, optionally decrypting and showing their values. */
	list: (params?: ListSecretsParams) => Promise<ListSecretsResult>;
	/** Edits an existing secret, re-encrypting its value if changed. */
	edit: (params: EditSecretParams) => Promise<SecretOperationResult>;
	/** Marks a secret as inactive (soft delete). */
	delete: (params: DeleteSecretParams) => Promise<SecretOperationResult>;
}

/**
 * @function securitySecretService
 * @description Factory function for the Security Secret Service.
 * Provides methods for managing secrets, including encryption, decryption, and CRUD operations.
 * @returns {SecuritySecretService} An instance of the Security Secret Service.
 */
export function securitySecretService(): SecuritySecretService {
	return {
		/**
		 * @async
		 * @function new
		 * @description Creates a new secret, encrypting its value before saving.
		 * @param {NewSecretParams} params - Parameters for the new secret.
		 * @returns {Promise<SecretOperationResult>} Result of the operation.
		 */
		new: async ({
			name,
			description,
			type,
			subType,
			value,
		}: NewSecretParams): Promise<SecretOperationResult> => {
			try {
				const encryptedValue = encrypt(value);
				await SecretTable.create({
					name,
					description,
					type,
					subType: type === 'DATABASE' ? subType : undefined, // SubType is only relevant for DATABASE type
					value: encryptedValue,
					created_by: 1, // TODO: This should be dynamically set based on the logged-in user's ID.
				});
				return { msg: 'Modelo creado exitosamente' };
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : 'Error creating secret';
				return { error: message };
			}
		},
		/**
		 * @async
		 * @function get
		 * @description Retrieves a secret by its ID and decrypts its value.
		 * @param {GetSecretParams} params - Parameters containing the ID of the secret.
		 * @returns {Promise<GetSecretResult>} The secret entity with decrypted value, or an error.
		 */
		get: async ({ id }: GetSecretParams): Promise<GetSecretResult> => {
			try {
				const secretInstance = await SecretTable.findOne({
					where: { id,	id_status: 1 }, // Only active secrets
				});
				if (secretInstance?.value) {
					secretInstance.value = decrypt(secretInstance.value); // Decrypt the value in place
				}
				return { secret: secretInstance as ISecuritySecretEntity | null };
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : 'Error fetching secret by ID';
				return { error: message };
			}
		},
		/**
		 * @async
		 * @function getByName
		 * @description Retrieves a secret by type, (optional) subType, and name.
		 * The decrypted value is parsed as JSON and then structured using `createEnvs`.
		 * @param {GetByNameParams} params - Parameters for finding the secret.
		 * @returns {Promise<object | null | { error: string }>} A structured object for envs, null if not found, or an error.
		 */
		getByName: async ({ type, subType, name }: GetByNameParams): Promise<object | null | { error: string }> => {
			try {
				const secretData = await SecretTable.findOne({
					attributes: ['type', 'subType', 'name', 'value'], // Select only necessary attributes
					where: {
						type: type.toUpperCase() as SecuritySecretType,
						subType: subType ? subType.toUpperCase() as SecuritySecretSubType : undefined,
						name: name.toUpperCase(),
						id_status: 1, // Active secrets only
					},
				});
				if (!secretData?.value) return null; // Not found or value is missing

				const secretValue = decrypt(secretData.value);
				// Construct a temporary ISecuritySecretEntity to pass to createEnvs
				// This is because createEnvs expects a full entity, but we only fetched partial data.
				const secretForEnvs: ISecuritySecretEntity = {
					type: secretData.type as SecuritySecretType,
					subType: secretData.subType as SecuritySecretSubType | undefined,
					name: secretData.name,
					value: JSON.parse(secretValue), // Assume the decrypted value is a JSON string
					id: 0, // Mock ID, not used by createEnvs for this purpose
					description: '', // Mock description
					id_status: 1,
					created_at: new Date(), // Mock date
					updated_at: new Date(), // Mock date
					created_by: 0, // Mock user ID
				};
				// Constructing a simpler object for createEnvs based on actual needs
				const coreInfo: SecretCoreInfo = {
					name: secretData.name,
					value: secretValue, // Already a string, createEnvs will parse it if it's JSON
					type: secretData.type as SecuritySecretType,
					subType: secretData.subType as SecuritySecretSubType | undefined,
				};
				const environmentVariables = createEnvs(coreInfo);
				return environmentVariables;
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : 'Error processing secret by name';
				return { error: message };
			}
		},
		/**
		 * @async
		 * @function list
		 * @description Lists all active secrets, optionally decrypting and including their values.
		 * @param {ListSecretsParams} [params={}] - Parameters, primarily `showValues`.
		 * @returns {Promise<ListSecretsResult>} A list of secrets or an error.
		 */
		list: async ({ showValues }: ListSecretsParams = {}): Promise<ListSecretsResult> => {
			try {
				const excludeAttributes: string[] = ['id_status', 'created_by'];
				if (!showValues) excludeAttributes.push('value'); // Exclude 'value' if not requested

				const secretList = await SecretTable.findAll({
					attributes: { exclude: excludeAttributes },
					include: [
						{ attributes: { exclude: ['id'] }, model: StatusTable, required: true },
						{
							attributes: { exclude: ['id_status', 'id_google', 'last_login', 'is_temporal', 'password'] },
							model: UsersTable, required: true, where: { id_status: 1 },
						},
					],
					where: {	id_status: 1 }, // Active secrets only
					order: [['name', 'ASC']],
				});

				// Process the list to decrypt values if requested
				const processedList: ListedSecret[] = secretList.map(item => {
					const plainItem = item.get({ plain: true }) as ISecuritySecretEntity & { user: Partial<UsersTable>, status: Partial<StatusTable> };
					if (showValues && plainItem.value) {
						plainItem.value = decrypt(plainItem.value);
					} else if (!showValues) {
						delete plainItem.value; // Ensure value is not present if not requested
					}
					return plainItem;
				});
				return { secrets: processedList };
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : 'Error listing secrets';
                return { error: message };
			}
		},
		/**
		 * @async
		 * @function edit
		 * @description Edits an existing secret. The new value is encrypted before saving.
		 * @param {EditSecretParams} params - Parameters for editing the secret, including its ID and new values.
		 * @returns {Promise<SecretOperationResult>} Result of the operation.
		 */
		edit: async ({
			id,
			name,
			description,
			type,
			subType,
			value,
		}: EditSecretParams): Promise<SecretOperationResult> => {
			try {
				const encryptedValue = encrypt(value);
				await SecretTable.update(
					{
						name,
						description,
						type,
						subType: type === 'DATABASE' ? subType : undefined,
						value: encryptedValue,
					},
					{ where: { id, id_status: 1 } } // Ensure we only edit active secrets
				);
				return { msg: 'Modelo actualizado exitosamente' };
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : 'Error editing secret';
				return { error: message };
			}
		},
		/**
		 * @async
		 * @function delete
		 * @description Marks a secret as inactive (soft delete).
		 * @param {DeleteSecretParams} params - Parameters containing the ID of the secret to delete.
		 * @returns {Promise<SecretOperationResult>} Result of the operation.
		 */
		delete: async ({ id }: DeleteSecretParams): Promise<SecretOperationResult> => {
			try {
				// Ensure the secret exists and is active before "deleting"
				const secretToUpdate = await SecretTable.findOne({ where: {id, id_status: 1 }});
				if (!secretToUpdate) {
					return { error: "Secret not found or already inactive." };
				}
				await secretToUpdate.update({	id_status: 2 }); // Assuming 2 means inactive
				return { msg: 'Modelo eliminado exitosamente' };
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : 'Error deleting secret';
				return { error: message };
			}
		},
	};
}

/**
 * @function createEnvs
 * @description Transforms a single secret or an array of secrets into a nested environment object structure.
 * The structure is typically `{[TYPE]: {[SUBTYPE?]: {[NAME]: value}}}`.
 * @param {ISecuritySecretEntity | ISecuritySecretEntity[]} secrets - A single secret entity or an array of them.
 * @returns {object} A nested object representing the environment variables.
 */
function createEnvs(secrets: SecretCoreInfo | SecretCoreInfo[]): object {
	const environmentMap: { [key: string]: any } = {};
	let currentLevel: Record<string, any>;

	/**
	 * @function convertJson
	 * @description Tries to parse a string as JSON, returns original string if parsing fails.
	 * @param {string} value - The string to parse.
	 * @returns {string | Record<string, any>} Parsed object or original string.
	 */
	const convertJson = (value: string): string | Record<string, any> => {
		try {
			return JSON.parse(value);
		} catch (e) {
			return value; // Return as string if not JSON
		}
	};

	/**
	 * @function convertSecret
	 * @description Adds a single secret to the environmentMap.
	 * @param {SecretCoreInfo} secret - The core secret information to add.
	 */
	const convertSecret = (secret: SecretCoreInfo): void => {
		const value = convertJson(secret.value); // Decrypted value is expected here
		const type = secret.type?.toUpperCase();
		if (!type) return; // Skip if type is undefined

		if (!environmentMap[type]) environmentMap[type] = {};
		currentLevel = environmentMap[type];

		if (secret.subType) {
			const subTypeUpper = secret.subType.toUpperCase();
			if (!currentLevel[subTypeUpper]) currentLevel[subTypeUpper] = {};
			currentLevel = currentLevel[subTypeUpper];
		}
		currentLevel[secret.name.toUpperCase()] = value;
	};

	// Process single secret or array of secrets
	if (Array.isArray(secrets)) {
		for (const secret of secrets) {
			convertSecret(secret);
		}
	} else {
		convertSecret(secrets);
	}

	// Uses a utility function to further map/transform the JSON structure if needed.
	const finalVars = utilsMapJson({
		json: JSON.stringify(environmentMap),
	});
	return finalVars;
}
