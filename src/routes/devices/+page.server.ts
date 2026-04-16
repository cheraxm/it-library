import { fetchDevices } from '$lib/server/sheets'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ url }) => {
	try {
		const devices = await fetchDevices()
		return {
			devices,
			search: url.searchParams.get('search') ?? '',
			expand: url.searchParams.get('expand') ?? '',
			error: null,
		}
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Failed to load devices'
		return {
			devices: [] as Awaited<ReturnType<typeof fetchDevices>>,
			search: url.searchParams.get('search') ?? '',
			expand: url.searchParams.get('expand') ?? '',
			error: message,
		}
	}
}
