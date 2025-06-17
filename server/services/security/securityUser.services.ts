import type { ISocket } from '@shared/interface/socket.interface.js';
import { Users_Table as UsersTable, IUserEntity } from '../../database/entity/security.users.entity.js'; // Assuming IUserEntity is exported
import { verifyTokenUser } from '../../modules/security.module.js';
import bcrypt from 'bcrypt';

/**
 * @interface ChangePasswordParams
 * @description Parameters for the `changePassword` method.
 * @property {ISocket} socket - The user's socket connection, used to verify the user via token.
 * @property {string} oldPassword - The user's current password.
 * @property {string} newPassword - The new password to set.
 */
interface ChangePasswordParams {
	socket: ISocket;
	oldPassword: string;
	newPassword: string;
}

/**
 * @interface UserOperationResult
 * @description Standard result for user operations that might return a message or an error.
 * @property {string} [msg] - Success message.
 * @property {string} [error] - Error message, if any.
 */
interface UserOperationResult {
	msg?: string;
	error?: string;
}

/**
 * @export
 * @interface SecurityUserService
 * @description Defines the contract for the Security User Service.
 * This service handles user-specific security operations like password changes.
 * @property {(params: ChangePasswordParams) => Promise<UserOperationResult>} changePassword - Changes the password for the authenticated user.
 */
export interface SecurityUserService {
	changePassword: (params: ChangePasswordParams) => Promise<UserOperationResult>;
}

/**
 * @function securityUserService
 * @description Factory function for the Security User Service.
 * Provides methods for user-specific security operations.
 * @returns {SecurityUserService} An instance of the Security User Service.
 */
export function securityUserService(): SecurityUserService {
	return {
		/**
		 * @async
		 * @function changePassword
		 * @description Allows an authenticated user to change their password.
		 * It verifies the user's current password before updating to the new one.
		 * @param {ChangePasswordParams} params - Parameters including socket, old password, and new password.
		 * @returns {Promise<UserOperationResult>} A promise that resolves with a success or error message.
		 */
		changePassword: async ({
			socket,
			oldPassword,
			newPassword,
		}: ChangePasswordParams): Promise<UserOperationResult> => {
			try {
				// Verify user from token in socket
				const verificationResult = await verifyTokenUser({ token: socket.token });
				const user = verificationResult?.user as IUserEntity | null;

				if (!user) {
					return { error: 'No se encontró el usuario o token inválido' };
				}
				// Ensure user object has a password to compare against
				if (!user.password) {
					return { error: 'No se pudo verificar la contraseña del usuario.' };
				}
				// Compare provided old password with the stored hashed password
				if (!bcrypt.compareSync(oldPassword, user.password)) {
					return { error: 'La contraseña actual no es correcta' };
				}

				// Hash the new password
				const saltRounds: number = 10; // Standard salt rounds for bcrypt
				const hash: string = bcrypt.hashSync(newPassword, saltRounds);

				// Update the user's password in the database
				await UsersTable.update({ password: hash }, { where: { id: user.id } });
				return { msg: 'Contraseña actualizada exitosamente' };
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : 'Error changing password';
				return { error: message };
			}
		},
	};
}
