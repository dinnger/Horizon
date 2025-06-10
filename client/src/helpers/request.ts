import axios from 'axios'

export const request = axios.create({
	baseURL: process.env.SERVER_URL,
	timeout: 5000
})
