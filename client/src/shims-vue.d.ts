// Permite la importación de archivos .vue en TypeScript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare module '*.vue' {
	import type { DefineComponent } from 'vue'
	// biome-ignore lint/complexity/noBannedTypes: <explanation>
	const component: DefineComponent<{}, {}, any>
	export default component
}

declare module '*.css' {
	import type { DefineComponent } from 'css'
	// biome-ignore lint/complexity/noBannedTypes: <explanation>
	const component: DefineComponent<{}, {}, any>
	export default component
}
