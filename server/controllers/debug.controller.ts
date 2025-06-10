// router
import type { Request, Response } from 'express'
import express from 'express'
import { workflow } from '../modules/debug.module.js'

export function debug_controller() {
	const router = express.Router()

	router.get('/workflows/list', async (req: Request, res: Response) => {
		res.status(200).send(await workflow().list())
	})

	router.get('/workflows/:uid', async (req: Request, res: Response) => {
		res.status(200).send(await workflow().get(req.params.uid))
	})

	router.get('/workflows/:uid/detail', async (req: Request, res: Response) => {
		res.status(200).send(await workflow().detail(req.params.uid))
	})

	router.get(
		'/workflows/:uid/detail/:node',
		async (req: Request, res: Response) => {
			res
				.status(200)
				.send(await workflow().detailNode(req.params.uid, req.params.node))
		}
	)

	return router
}
