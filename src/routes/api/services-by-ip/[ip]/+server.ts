import { json, error } from '@sveltejs/kit'
import { fetchServicesByIP } from '$lib/server/sheets'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ params }) => {
	const ip = params.ip?.trim()
	if (!ip) throw error(400, 'Missing IP parameter')

	try {
		const services = await fetchServicesByIP(ip)
		return json(services)
	} catch (e) {
		const msg = e instanceof Error ? e.message : 'Failed to fetch services'
		throw error(500, msg)
	}
}
