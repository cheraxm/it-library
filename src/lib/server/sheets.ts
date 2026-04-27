import { JWT } from 'google-auth-library'
import { env } from '$env/dynamic/private'
import type { ServiceRow, DeviceRow } from '$lib/types'

const SPREADSHEET_ID = '1W-HZs-CjY8GUtoY2ZFbOchhUXxAtHMGtaR3vYBjqgFI'
const SERVICES_RANGE = 'Services!A2:O'
const DEVICES_RANGE = 'Device!A2:Q'

// ─── Column maps ──────────────────────────────────────────────────────────────

const SVC = {
	rack: 0, deviceDetailIPType: 1, typeOfService: 2, managementIPVer100: 3,
	managementIP: 4, name: 5, vlan: 6, newVLAN: 7, privateIP: 8,
	newPrivateIP: 9, publicIP: 10, newPublicIP: 11, status: 12, owner: 13,
}

const DEV = {
	rack: 0, vendor: 1, deviceType: 2, deviceName: 3, rackPlusName: 4,
	description: 5, deviceDetailIPType: 6, deviceDetail: 7, status: 8,
	vlan: 9, typeOfIP: 10, accessIP: 11, accessType: 12, assetNumber: 13,
	serialNumber: 14, credentialHint: 15, notes: 16,
}

// ─── Row mappers ──────────────────────────────────────────────────────────────

function toServiceRow(row: string[]): ServiceRow {
	const g = (i: number) => row[i] ?? ''
	return {
		rack: g(SVC.rack), deviceDetailIPType: g(SVC.deviceDetailIPType),
		typeOfService: g(SVC.typeOfService), managementIPVer100: g(SVC.managementIPVer100),
		managementIP: g(SVC.managementIP), name: g(SVC.name),
		vlan: g(SVC.vlan), newVLAN: g(SVC.newVLAN),
		privateIP: g(SVC.privateIP), newPrivateIP: g(SVC.newPrivateIP),
		publicIP: g(SVC.publicIP), newPublicIP: g(SVC.newPublicIP),
		status: g(SVC.status), owner: g(SVC.owner),
	}
}

function toDeviceRow(row: string[]): DeviceRow {
	const g = (i: number) => row[i] ?? ''
	return {
		rack: g(DEV.rack), vendor: g(DEV.vendor), deviceType: g(DEV.deviceType),
		deviceName: g(DEV.deviceName), rackPlusName: g(DEV.rackPlusName),
		description: g(DEV.description), deviceDetailIPType: g(DEV.deviceDetailIPType),
		deviceDetail: g(DEV.deviceDetail), status: g(DEV.status),
		vlan: g(DEV.vlan), typeOfIP: g(DEV.typeOfIP), accessIP: g(DEV.accessIP),
		accessType: g(DEV.accessType), assetNumber: g(DEV.assetNumber),
		serialNumber: g(DEV.serialNumber), credentialHint: g(DEV.credentialHint),
		notes: g(DEV.notes),
	}
}

// ─── Client factory ───────────────────────────────────────────────────────────

function createClient() {
	const clientEmail = env.GOOGLE_CLIENT_EMAIL
	const rawKey = (env.GOOGLE_PRIVATE_KEY ?? '').replace(/^"+|"+$/g, '')
	const privateKey = rawKey.includes('\\n') ? rawKey.replace(/\\n/g, '\n') : rawKey
	if (!clientEmail || !privateKey) {
		throw new Error('Google Service Account credentials missing in .env')
	}
	return new JWT({
		email: clientEmail,
		key: privateKey,
		scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
	})
}

// ─── Generic sheet fetcher ────────────────────────────────────────────────────

async function fetchSheet<T>(
	range: string,
	mapper: (row: string[]) => T,
	filter: (row: T) => boolean,
): Promise<T[]> {
	const client = createClient()
	const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}`
	const res = await client.request({ url })
	const data = res.data as { values?: string[][] }
	return (data.values ?? []).map(mapper).filter(filter)
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function fetchServices(): Promise<ServiceRow[]> {
	return fetchSheet(SERVICES_RANGE, toServiceRow, (r) => r.name.trim() !== '')
}

export function fetchDevices(): Promise<DeviceRow[]> {
	return fetchSheet(DEVICES_RANGE, toDeviceRow, (r) => r.deviceName.trim() !== '')
}

export function fetchServicesByIP(accessIP: string): Promise<ServiceRow[]> {
	const needle = accessIP.trim()
	return fetchSheet(SERVICES_RANGE, toServiceRow, (r) => r.managementIP.trim() === needle)
}
