import cron from 'node-cron'
import { queueService } from './services/global/queue.service.js'

export function JobServer() {
	// Se ejecuta cada minuto
	cron.schedule('* * * * *', async () => {
		try {
			await queueService().init()
		} catch (error) {
			console.log(error)
		}
	})
}
