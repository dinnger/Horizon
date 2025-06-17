import type { ISocket } from '@shared/interface/socket.interface.js';
import { encrypt } from '../modules/security.module.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * @interface OpenUrlData
 * @description Defines the structure for data used when opening a URL externally.
 * @property {string} uri - The URI to be opened.
 * @property {string} [uid] - Optional unique identifier, will be generated if not provided.
 * @property {object} headers - Headers to be sent with the request. Consider defining a more specific type if possible.
 * @property {object} queryParams - Query parameters for the URI. Consider defining a more specific type if possible.
 * @property {any} meta - Any additional metadata. Consider defining a more specific type if possible.
 */
interface OpenUrlData {
	uri: string;
	uid?: string;
	headers: object; // Consider defining a more specific type if possible
	queryParams: object; // Consider defining a more specific type if possible
	meta: any; // Consider defining a more specific type if possible
}

/**
 * @interface ClientService
 * @description Defines the structure of the client service, which handles client-specific operations.
 * @property {(data: OpenUrlData) => Promise<any>} openUrl - Function to open a URL externally.
 */
interface ClientService {
	openUrl: (data: OpenUrlData) => Promise<any>;
}

/**
 * @const clientsCredentialsList
 * @description A Map to store callbacks associated with client credential requests.
 * The key is a unique identifier (UID), and the value is the callback function.
 */
export const clientsCredentialsList: Map<string, (value: any) => void> = new Map();

/**
 * @function clientService
 * @description Factory function to create a client service object.
 * This service handles operations related to client interactions, such as opening URLs.
 * @param {{ socket: ISocket }} params - Parameters for the client service.
 * @param {ISocket} params.socket - The socket instance for communication.
 * @returns {ClientService} An object implementing the ClientService interface.
 */
export function clientService({ socket }: { socket: ISocket }): ClientService {
	return {
		/**
		 * @function openUrl
		 * @description Opens a URL externally and waits for a response via socket communication.
		 * It generates a unique ID for the request, stores a callback, and emits an 'external' event.
		 * @param {OpenUrlData} data - The data required to open the URL.
		 * @returns {Promise<any>} A promise that resolves with the value received from the external callback.
		 */
		openUrl: async (data: OpenUrlData): Promise<any> => {
			return new Promise((resolve) => {
				// Generate a unique ID for this request to track the callback
				const uid: string = uuidv4().toString();

				/**
				 * @function callback
				 * @description Internal callback function to handle the response from the external event.
				 * It removes the UID from the tracking list and resolves the promise.
				 * @param {any} value - The value received from the external callback.
				 */
				function callback(value: any): void {
					clientsCredentialsList.delete(uid); // Clean up the stored callback
					resolve(value);
				}

				// Store the callback associated with the UID
				clientsCredentialsList.set(uid, callback);
				// Assign the generated UID to the data payload
				data.uid = uid;

				// Emit an event to the client to open the URL
				socket.emit(
					'external', // Event name
					{ // Payload
						type: 'openUrl',
						data: { token: encrypt(JSON.stringify(data)) }, // Encrypt sensitive data
					},
					// Provide the callback function to handle the response from the client
					(value: any) => callback(value)
				);
			});
		},
	};
}
