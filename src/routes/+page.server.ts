import { fetchServices } from '$lib/server/sheets'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ url }) => {
	try {
		const services = await fetchServices()
		return {
			services,
			search: url.searchParams.get('search') ?? '',
			expand: url.searchParams.get('expand') ?? '',
			error: null,
		}
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Failed to load services'
		return {
			services: [] as Awaited<ReturnType<typeof fetchServices>>,
			search: url.searchParams.get('search') ?? '',
			expand: url.searchParams.get('expand') ?? '',
			error: message,
		}
	}
}
