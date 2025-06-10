import { securityCredentialsService } from './security/securityCredentials.service.js'
import { securityPermissionService } from './security/securityPermission.service.js'
import { securityRoleService } from './security/securityRole.service.js'
import { securitySecretService } from './security/securitySecret.service.js'
import { securityUserService } from './security/securityUser.services.js'

export function securityService() {
	return {
		// security/user
		user: securityUserService,
		// security/role
		role: securityRoleService,
		// security/permission
		permission: securityPermissionService,
		// security/credentials
		credentials: securityCredentialsService,
		// security/secret
		secret: securitySecretService
	}
}
