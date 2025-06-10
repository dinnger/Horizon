import { createRouter, createWebHistory } from 'vue-router'
import { useSession } from '../stores/session'
import { request } from '../helpers/request'
import IndexLayout from '../layouts/index.vue'

const sessionCache = {
	value: null as any,
	expiry: 0
}

const verifySession = async (fn: any, timeout: number) => {
	const now = Date.now()
	if (sessionCache.value && sessionCache.expiry > now) {
		return
	}

	await fn()
	sessionCache.value = true
	sessionCache.expiry = now + timeout * 1000
}

const PATH_URL =
	process.env.SERVER_BASE?.slice(-1) === '/' ? process.env.SERVER_BASE.toString().slice(0, -1) : (process.env.SERVER_BASE ?? '')

const router = createRouter({
	history: createWebHistory(`${PATH_URL}/ui`),
	routes: [
		{
			path: '/login',
			name: 'login',
			component: () => import('../layouts/login.vue')
		},
		{
			path: '/',
			component: IndexLayout,
			children: [
				{
					path: '/',
					name: 'home',
					component: () => import('../pages/home/home_index.vue')
				},
				{
					path: '/projects',
					name: 'projects',
					component: () => import('../pages/projects/project_index.vue')
				},
				{
					path: '/projects/:project_id',
					name: 'project_detail',
					component: () => import('../pages/projects/project_detail.vue')
				},
				{
					path: '/workflows/:project_id/:workflow_id',
					name: 'workflow_detail',
					component: () => import('../pages/workflows/workflow_index.vue')
				},
				{
					path: '/tests',
					name: 'tests',
					component: () => import('../pages/tests/test_index.vue'),
					children: [
						{
							path: '/tests/api',
							name: 'api',
							component: () => import('../pages/tests/test_api.vue')
						}
					]
				},
				{
					path: '/deployments',
					name: 'deployments',
					component: () => import('../pages/deployments/deploy_index.vue')
				},
				{
					path: '/settings',
					name: 'settings',
					component: () => import('../pages/settings/setting_index.vue'),
					children: [
						{
							path: '/settings/company',
							name: 'company',
							component: () => import('../pages/settings/settings_company.vue')
						},
						{
							path: '/settings/users',
							name: 'users',
							component: () => import('../pages/settings/settings_users.vue')
						},
						{
							path: '/settings/roles',
							name: 'roles',
							component: () => import('../pages/settings/settings_roles.vue')
						},
						{
							path: '/settings/deploys',
							name: 'deploys',
							component: () => import('../pages/settings/settings_deploy.vue')
						},
						{
							path: '/settings/security',
							name: 'security',
							component: () => import('../pages/settings/settings_security.vue')
						},
						{
							path: '/settings/plugins',
							name: 'plugins',
							component: () => import('../pages/settings/settings_plugins.vue')
						},
						{
							path: '/settings/config',
							name: 'config',
							component: () => import('../pages/settings/settings_conf.vue')
						}
					]
				}
			]
		},
		{
			path: '/404',
			name: '404',
			// route level code-splitting
			// this generates a separate chunk (About.[hash].js) for this route
			// which is lazy-loaded when the route is visited.
			component: () => import('../layouts/404.vue')
		},
		{
			path: '/:catchAll(.*)',
			redirect: '/404'
		}
	]
})

router.beforeEach(async (to, _, next) => {
	const session = useSession()

	verifySession(async () => {
		try {
			const data = await request.post('/api/security/verify', {
				token: session.token
			})
			const { user, workspace } = data.data
			session.setUser(user)
			session.setWorkspace(workspace)
		} catch (error) {
			console.log(error)
			session.removeSession()
		}
	}, 60)

	console.log(session.activeSession)
	if (to.name !== 'login' && !session.activeSession) {
		next({ name: 'login', query: { redirect: to.fullPath } })
	} else {
		next()
	}
})

export default router
