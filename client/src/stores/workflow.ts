import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { INode } from '@shared/interfaces/workflow.interface'

export const useWorkflow = defineStore('workflow', () => {
	const dataNode = ref<INode | null>(null)
  const statsNode = ref<INode | null>(null)
	const suggestions = ref<{ label: string; value: any }[]>([
		{
			label: 'webhook.data.headers',
			value:
				'[\n  {\n    "key": "Content-Type",\n    "value": "application/json"\n  }\n]'
		},
		{
			label: 'webhook.data.body',
			value: '{prueba:123}'
		}
	])

	return {
		dataNode,
    statsNode,
		suggestions
	}
})
