export interface Interface_Project {
	id: number
	uid: string
	name: string
	description: string | null
	status: {
		name: string | null
		color: string | null
	}
	workflows: any[]
	created_by: string
	user: {
		name: string
		email: string
		id: number
	}
}
