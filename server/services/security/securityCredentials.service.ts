import type { ISocket } from '@shared/interface/socket.interface.js';
import type { Express } from 'express';
import type { INodeClass } from '@shared/interface/node.interface.js'; // Used in commented code
import NodeCache from 'node-cache';
import { Credentials_Table as CredentialsTable } from '../../database/entity/security.credentials.entity.js';
import { decrypt, encrypt } from '../../modules/security.module.js'; // Encrypt used in commented code
// import { clientService } from '../client.service.js'; // Used in commented code
// import { CoreDependencies } from '../../../worker/modules/core/dependency.module.js'; // Used in commented code
import { getCredentials, getCredentialsActions, getCredentialsClass, getCredentialsProperties } from '@shared/maps/security.map.js';
import type { IClientStepContent } from '@shared/interface/client.interface.js'; // Used in commented code

/**
 * @typedef DecryptedProperties
 * @description Represents a record of decrypted properties, typically a JSON object.
 */
type DecryptedProperties = Record<string, any>;

/**
 * @interface RawCredential
 * @description Represents a credential object as fetched from the database, where properties might still be encrypted.
 * @extends CredentialsTable (Assuming CredentialsTable is the Sequelize model type)
 * @property {string | DecryptedProperties} [properties] - Credential properties, can be encrypted string or decrypted object.
 * @property {string | DecryptedProperties} [result] - Credential result field, can be encrypted string or decrypted object.
 */
interface RawCredential extends CredentialsTable {
	properties?: string | DecryptedProperties;
	result?: string | DecryptedProperties;
}

/**
 * @export
 * @interface DecryptedCredential
 * @description Represents a credential object where sensitive properties have been decrypted.
 * @extends Omit<RawCredential, 'properties' | 'result'>
 * @property {DecryptedProperties} [properties] - Decrypted credential properties.
 * @property {DecryptedProperties} [result] - Decrypted credential result.
 */
export interface DecryptedCredential extends Omit<RawCredential, 'properties' | 'result'> {
	properties?: DecryptedProperties;
	result?: DecryptedProperties;
}

/**
 * @interface ServiceOperationResult
 * @description Standard result object for service operations.
 * @property {string} [error] - Error message if the operation failed.
 * @property {boolean} [success] - True if a delete or update operation was successful.
 * @property {boolean} [valid] - True if a validation (e.g., name validation) was successful.
 * @property {string} [save] - Success message specific to save operations.
 */
interface ServiceOperationResult {
	error?: string;
	success?: boolean;
	valid?: boolean;
	save?: string;
	// Add other possible fields from results e.g. alert
}

// Initialize a cache for credentials with a standard TTL of 60 seconds.
const cacheCredential = new NodeCache({ stdTTL: 60 });

/**
 * @function decryptPropertiesHelper
 * @description Helper function to decrypt a properties string.
 * @param {string | undefined} properties - The encrypted properties string.
 * @returns {DecryptedProperties | undefined} The decrypted properties object, or an empty object on error, or undefined if input was undefined.
 */
function decryptPropertiesHelper(properties: string | undefined): DecryptedProperties | undefined {
	if (typeof properties !== 'string') {
		return properties; // Already decrypted or not a string (e.g. undefined)
	}
	try {
		return JSON.parse(decrypt(properties));
	} catch (error) {
		console.error('Error al desencriptar propiedades:', error); // Log decryption error
		return {}; // Return empty object on parsing error
	}
}

/**
 * @interface SecurityCredentialsServiceParams
 * @description Parameters for the main securityCredentialsService factory function.
 * @property {Express} [app] - Optional Express application instance (currently not used by service methods but available).
 */
interface SecurityCredentialsServiceParams {
	app?: Express;
}

// Parameter interfaces for each method
interface GetByIdParams { id: number; }
interface GetByTypeParams { type: string; showProperty?: boolean; }
interface GetByNameParams { type: string; name: string; showProperty?: boolean; showResult?: boolean; }
interface GetPropertiesParams { name: string; }
interface GetActionsParams { name: string; }
interface ValidNameParams { name: string; type: string; }
interface DeleteParams { id: number; }
// interface SaveParams { name: string; type: string; action: 'new' | 'save'; data: IClientStepContent; socket: ISocket; } // For commented code


/**
 * @export
 * @interface SecurityCredentialsService
 * @description Defines the contract for the Security Credentials Service.
 * This service handles CRUD operations, validation, and property management for security credentials.
 */
export interface SecurityCredentialsService {
	/** Retrieves a list of available credential types. */
	list: () => Promise<ReturnType<typeof getCredentials>>;
	/** Retrieves a specific credential by its ID, with decrypted properties. */
	getById: (params: GetByIdParams) => Promise<DecryptedCredential | ServiceOperationResult>;
	/** Retrieves credentials of a specific type, optionally with decrypted properties. Results are cached. */
	getByType: (params: GetByTypeParams) => Promise<DecryptedCredential[] | ServiceOperationResult>;
	/** Retrieves a specific credential by type and name, optionally with decrypted properties/result. Results are cached. */
	getByName: (params: GetByNameParams) => Promise<DecryptedCredential | null | ServiceOperationResult>;
	/** Retrieves the property schema for a given credential name/type from a predefined map. */
	getProperties: (params: GetPropertiesParams) => Promise<ReturnType<typeof getCredentialsProperties>>;
	/** Retrieves available actions for a given credential name/type from a predefined map. */
	getActions: (params: GetActionsParams) => Promise<ReturnType<typeof getCredentialsActions>>;
	/** Retrieves all active credentials, with properties explicitly undefined (summary view). */
	getAll: () => Promise<{ credentials: DecryptedCredential[] } | ServiceOperationResult>;
	/** Validates if a credential name is unique for a given type. */
	validName: (params: ValidNameParams) => Promise<ServiceOperationResult>;
	// save: (params: SaveParams) => Promise<ServiceOperationResult | { alert?: any }>; // Placeholder for commented save method
	/** Marks a credential as inactive (soft delete). */
	delete: (params: DeleteParams) => Promise<ServiceOperationResult>;
}

/**
 * @function securityCredentialsService
 * @description Factory function for the Security Credentials Service.
 * @param {SecurityCredentialsServiceParams} params - Parameters for the service, e.g., Express app instance.
 * @returns {SecurityCredentialsService} An instance of the Security Credentials Service.
 */
export function securityCredentialsService({ app }: SecurityCredentialsServiceParams): SecurityCredentialsService {
	return {
		list: async () => {
			// Delegates to a function that likely returns a predefined list or map of credential types.
			return getCredentials();
		},
		getById: async ({ id }: GetByIdParams): Promise<DecryptedCredential | ServiceOperationResult> => {
			try {
				const credential = await CredentialsTable.findOne({
					where: { id,	id_status: 1 }, // Fetch active credential by ID
				});

				if (!credential) {
					return { error: 'Credencial no encontrada' }; // Direct return for not found
				}

				const plainCredential = credential.get({ plain: true }) as RawCredential;
				// Decrypt properties if they exist and are strings
				if (plainCredential.properties && typeof plainCredential.properties === 'string') {
					plainCredential.properties = decryptPropertiesHelper(plainCredential.properties);
				}
				return plainCredential as DecryptedCredential;
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : 'Unknown error retrieving credential by ID';
				return { error: message };
			}
		},
		getByType: async ({ type, showProperty }: GetByTypeParams): Promise<DecryptedCredential[] | ServiceOperationResult> => {
			try {
				// Construct a cache key based on type and whether properties are shown
				const cacheKey = `${type}${showProperty ? '_props' : ''}`;
				const cached = cacheCredential.get(cacheKey);
				if (cached) return cached as DecryptedCredential[]; // Return cached result if available

				const exclude = ['id_status', 'created_by']; // Attributes to always exclude
				if (!showProperty) exclude.push('properties'); // Exclude properties if not requested

				const credentials = await CredentialsTable.findAll({
					attributes: { exclude },
					where: { id_status: 1, type }, // Fetch active credentials of the specified type
				});

				// Process credentials to decrypt properties if needed
				const processedCredentials: DecryptedCredential[] = credentials.map(cred => {
					const plain = cred.get({ plain: true }) as RawCredential;
					if (showProperty && plain.properties && typeof plain.properties === 'string') {
						plain.properties = decryptPropertiesHelper(plain.properties);
					} else if (!showProperty) {
						delete plain.properties; // Ensure properties are not included if not requested
					}
					return plain as DecryptedCredential;
				});

				cacheCredential.set(cacheKey, processedCredentials); // Cache the processed result
				return processedCredentials;
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : 'Unknown error retrieving credentials by type';
				return { error: message };
			}
		},
		getByName: async ({
			type,
			name,
			showProperty,
			showResult,
		}: GetByNameParams): Promise<DecryptedCredential | null | ServiceOperationResult> => {
			try {
				// Construct a detailed cache key
				const cacheKey = `${type}_${name}${showProperty ? '_props' : ''}${showResult ? '_res' : ''}`;
				const cached = cacheCredential.get(cacheKey);
				if (cached) return cached as DecryptedCredential | null; // Return cached result

				const exclude = ['id_status', 'created_by'];
				if (!showProperty) exclude.push('properties');
				if (!showResult) exclude.push('result');

				const credential = await CredentialsTable.findOne({
					attributes: { exclude },
					where: { id_status: 1, type, name }, // Fetch specific active credential
				});

				if (!credential) return null; // Not found

				const plainCredential = credential.get({ plain: true }) as RawCredential;
				// Decrypt properties and/or result if requested and available
				if (showProperty && plainCredential.properties && typeof plainCredential.properties === 'string') {
					plainCredential.properties = decryptPropertiesHelper(plainCredential.properties);
				}
				if (showResult && plainCredential.result && typeof plainCredential.result === 'string') {
					plainCredential.result = decryptPropertiesHelper(plainCredential.result);
				}

				// Ensure fields are not present if not requested
				if (!showProperty) delete plainCredential.properties;
				if (!showResult) delete plainCredential.result;

				cacheCredential.set(cacheKey, plainCredential); // Cache the processed result
				return plainCredential as DecryptedCredential;
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : 'Unknown error retrieving credential by name';
				return { error: message };
			}
		},
		getProperties: async ({ name }: GetPropertiesParams) => {
			// Delegates to a function that likely returns a predefined schema or properties for a credential type.
			return getCredentialsProperties(name);
		},
		getActions: async ({ name }: GetActionsParams) => {
			// Delegates to a function that likely returns a predefined list of actions for a credential type.
			return getCredentialsActions(name);
		},
		getAll: async (): Promise<{ credentials: DecryptedCredential[] } | ServiceOperationResult> => {
			try {
				const credentials = await CredentialsTable.findAll({
					where: { id_status: 1 }, // Fetch all active credentials
				});

				// Map to a summary view, explicitly removing potentially sensitive 'properties' and 'result'
				const decryptedCredentials: DecryptedCredential[] = credentials.map((credential) => {
					const plainCredential = credential.get({ plain: true }) as RawCredential;
					delete plainCredential.properties;
					delete plainCredential.result;
					return plainCredential as DecryptedCredential;
				});

				return { credentials: decryptedCredentials };
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : 'Unknown error retrieving all credentials';
				return { error: message };
			}
		},
		validName: async ({ name, type }: ValidNameParams): Promise<ServiceOperationResult> => {
			try {
				const existingCredential = await CredentialsTable.findOne({
					where: { name, type, id_status: 1 }, // Check for active credential with the same name and type
				});
				if (existingCredential) {
					return { error: 'Ya existe una credencial con el mismo nombre' };
				}
				return { valid: true }; // Name is valid
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : 'Unknown error validating credential name';
				return { error: message };
			}
		},
		// TODO: Standardize and implement the save method if it's still needed. This involves defining SaveParams and handling plugin interactions.
		// save: async (params: SaveParams): Promise<ServiceOperationResult | { alert?: any }> => {
		// 	try {
		// 		const { name, type, action, data, socket } = params;
		// 		const credentialClass = getCredentialsClass(type);
		// 		if (!credentialClass) return { error: 'No se encontró el plugin de credenciales' };
		// 		const instance: INodeClass = new (credentialClass as any)();
		// 		if (!instance?.onCredential) return { error: 'No se encontró el método onCredential' };
		// 		// ... (rest of the original commented logic with proper typing and error handling) ...
		// 		return { error: 'Save method not fully implemented' };
		// 	} catch (error: unknown) {
		// 		console.error('Error al guardar credencial:', error);
		// 		const message = error instanceof Error ? error.message : 'Unknown error saving credential';
		// 		return { error: message };
		// 	}
		// },
		delete: async ({ id }: DeleteParams): Promise<ServiceOperationResult> => {
			try {
				const credential = await CredentialsTable.findByPk(id);
				if (!credential) {
					throw new Error('Credencial no encontrada'); // Will be caught and returned as error object
				}
				// Soft delete by updating status
				await credential.update({ id_status: 0 }); // Assuming 0 means inactive
				return { success: true };
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : 'Unknown error deleting credential';
				return { error: message };
			}
		},
	};
}
