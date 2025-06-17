import { securityCredentialsService, SecurityCredentialsService, SecurityCredentialsServiceParams } from './security/securityCredentials.service.js'; // Import params type
import { securityPermissionService, SecurityPermissionService } from './security/securityPermission.service.js';
import { securityRoleService, SecurityRoleService } from './security/securityRole.service.js';
import { securitySecretService, SecuritySecretService } from './security/securitySecret.service.js';
import { securityUserService, SecurityUserService } from './security/securityUser.services.js';

/**
 * @export
 * @interface SecurityService
 * @description Defines the structure of the main security service.
 * This service acts as an aggregator for various security-related sub-services,
 * such as user management, roles, permissions, credentials, and secrets.
 * @property {() => SecurityUserService} user - Returns the user security service.
 * @property {() => SecurityRoleService} role - Returns the role security service.
 * @property {() => SecurityPermissionService} permission - Returns the permission security service.
 * @property {(params: SecurityCredentialsServiceParams) => SecurityCredentialsService} credentials - Returns the credentials security service.
 *   The `securityCredentialsService` itself is a factory function that might require parameters (e.g., an Express app instance).
 * @property {() => SecuritySecretService} secret - Returns the secret management service.
 */
export interface SecurityService {
	user: () => SecurityUserService;
	role: () => SecurityRoleService;
	permission: () => SecurityPermissionService;
	credentials: (params: SecurityCredentialsServiceParams) => SecurityCredentialsService;
	secret: () => SecuritySecretService;
}

// This global declaration extends the Express namespace to ensure Express.Application is recognized as a type.
// It's useful when Express types are used in function signatures (like in SecurityCredentialsServiceParams)
// without needing a direct `import 'express';` in this specific file, which might not be desired for a service aggregator.
/**
 * @global
 * @namespace Express
 */
declare global {
	namespace Express {
		/**
		 * @interface Application
		 * @description Represents the Express application instance.
		 * This declaration ensures that `Express.Application` can be used as a type.
		 */
		interface Application {}
	}
}

/**
 * @function securityService
 * @description Factory function to create an instance of the main SecurityService.
 * This service provides access to various security sub-services.
 * @returns {SecurityService} An object implementing the SecurityService interface.
 */
export function securityService(): SecurityService {
	return {
		// Provides access to user-related security operations
		user: securityUserService,
		// Provides access to role management operations
		role: securityRoleService,
		// Provides access to permission management operations
		permission: securityPermissionService,
		// Provides access to credential management operations
		// Note: securityCredentialsService is a factory function itself.
		credentials: securityCredentialsService,
		// Provides access to secret management operations
		secret: securitySecretService,
	};
}
