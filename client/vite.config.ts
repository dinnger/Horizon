import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
// import 'dotenv/config'

// https://vite.dev/config/

export default defineConfig(({ mode }) => {
	const env = loadEnv(
		mode,
		process.cwd().replace(/\\/g, '/').split('/').slice(0, -1).join('/'),
		''
	)
	const PATH_URL =
		env.SERVER_BASE?.slice(-1) === '/'
			? env.SERVER_BASE.toString().slice(0, -1)
			: (env.SERVER_BASE ?? '')
	return {
		base: `${PATH_URL}/ui`,
		plugins: [vue(), tailwindcss()],
		define: {
			'process.env.SERVER_URL': JSON.stringify(env.SERVER_URL),
			'process.env.SERVER_BASE': JSON.stringify(env.SERVER_BASE)
		},
		resolve: {
			alias: {
				'@': fileURLToPath(new URL('../client/src', import.meta.url)),
				'@shared': fileURLToPath(new URL('../shared', import.meta.url))
			}
		},
		server: {
			fs: {
				// Allow serving files from one level up to the project root
				allow: ['..']
			}
		}
	}
})
