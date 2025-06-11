import type { INodeCanvas } from '@shared/interface/node.interface'

export function utilsStandardName(text: string) {
	let lower = text.replace(/[A-Z]/g, (val: string) => {
		return val.toLowerCase()
	})
	lower = lower.replace(/\ \ /g, ' ')
	lower = lower.replace(/\ /g, '_')
	return lower
}

export function utilsValidateName({
	id,
	text,
	nodes
}: {
	id?: number
	text: string
	nodes: INodeCanvas[]
}): string {
	const node_name = id ? `${text.toLowerCase()}_${id}` : text.toLowerCase()
	const exist = nodes.find((f) => f.info.name.toLowerCase() === node_name)
	const id_new = id ? id + 1 : 1
	if (exist) return utilsValidateName({ id: id_new, text, nodes })
	if (!id) return text
	return `${text}_${id}`
}
