import { createServerFn } from '@tanstack/react-start'
import { JWT } from 'google-auth-library'

const SPREADSHEET_ID = '1W-HZs-CjY8GUtoY2ZFbOchhUXxAtHMGtaR3vYBjqgFI'
const SHEET_NAME = 'Services'

export interface ServiceRow {
  rack: string
  deviceDetailIPType: string
  typeOfService: string
  managementIPVer100: string
  managementIP: string
  name: string
  vlan: string
  newVLAN: string
  privateIP: string
  newPrivateIP: string
  publicIP: string
  newPublicIP: string
  status: string
  owner: string
}

// Column index mapping based on the sheet headers
const COL = {
  rack: 0,
  deviceDetailIPType: 1,
  typeOfService: 2,
  managementIPVer100: 3,
  managementIP: 4,
  name: 5,
  vlan: 6,
  newVLAN: 7,
  privateIP: 8,
  newPrivateIP: 9,
  publicIP: 10,
  newPublicIP: 11,
  status: 12,
  owner: 13,
}

function toServiceRow(row: string[]): ServiceRow {
  const get = (i: number) => row[i] ?? ''
  return {
    rack: get(COL.rack),
    deviceDetailIPType: get(COL.deviceDetailIPType),
    typeOfService: get(COL.typeOfService),
    managementIPVer100: get(COL.managementIPVer100),
    managementIP: get(COL.managementIP),
    name: get(COL.name),
    vlan: get(COL.vlan),
    newVLAN: get(COL.newVLAN),
    privateIP: get(COL.privateIP),
    newPrivateIP: get(COL.newPrivateIP),
    publicIP: get(COL.publicIP),
    newPublicIP: get(COL.newPublicIP),
    status: get(COL.status),
    owner: get(COL.owner)
  }
}

/**
 * Server Function: securely runs on the server to authenticate
 * with the Service Account JSON and fetch from Google Sheets API.
 */
export const fetchServicesFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
    // .env multiline strings usually come in with literal \n, we replace it with standard newlines
    const rawKey = process.env.GOOGLE_PRIVATE_KEY || ''
    const privateKey = rawKey.replace(/\\n/g, '\n')

    if (!clientEmail || !privateKey) {
      throw new Error('Google Service Account credentials missing in .env')
    }

    // Connect with Service Account credentials
    const client = new JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    })

    const range = encodeURIComponent(`${SHEET_NAME}!A2:O`)
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}`

    // Call the API with auth injected automatically
    const res = await client.request({ url })
    const data = res.data as { values?: string[][] }

    const rows: string[][] = data.values ?? []
    return rows.map(toServiceRow).filter((r) => r.name.trim() !== '')
  },
)

export const servicesQueryOptions = {
  queryKey: ['services'],
  queryFn: () => fetchServicesFn(),
  staleTime: 1000 * 60 * 5, // 5 minutes
  retry: 2,
}

export interface DeviceInfo {
  deviceName: string
  rackPlusName: string
  description: string
  assetNumber: string
}

export const fetchDeviceByManagementIPFn = createServerFn({ method: 'POST' })
  .inputValidator((d: string) => d)
  .handler(async ({ data: managementIP }) => {
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
    const rawKey = process.env.GOOGLE_PRIVATE_KEY || ''
    const privateKey = rawKey.replace(/\\n/g, '\n')

    if (!clientEmail || !privateKey) {
      throw new Error('Google Service Account credentials missing in .env')
    }

    const client = new JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    })

    const range = encodeURIComponent(`Device!A2:Q`)
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}`


    const res = await client.request({ url })
    const data = res.data as { values?: string[][] }
    const rows: string[][] = data.values ?? []

    for (const row of rows) {
      const accessIP = row[11] ?? '' // Access IP is column L (index 11)
      if (accessIP.trim() === managementIP.trim()) {
        return {
          deviceName: row[3] ?? '',
          rackPlusName: row[4] ?? '',   // Rack+Name is column E (index 4)
          description: row[5] ?? '',    // Description is column F (index 5)
          assetNumber: row[13] ?? '',   // Asset Number is column N (index 13)
        } as DeviceInfo
      }
    }

    return null
  })

export const deviceQueryOptions = (managementIP: string) => ({
  queryKey: ['device', managementIP],
  queryFn: () => fetchDeviceByManagementIPFn({ data: managementIP }),
  staleTime: 1000 * 60 * 5, // 5 minutes
  enabled: !!managementIP,
  retry: 2,
})

// ─── Full Device Row ─────────────────────────────────────────────────────────

export interface DeviceRow {
  rack: string
  vendor: string
  deviceType: string
  deviceName: string
  rackPlusName: string
  description: string
  deviceDetailIPType: string
  deviceDetail: string
  status: string
  vlan: string
  typeOfIP: string
  accessIP: string
  accessType: string
  assetNumber: string
  serialNumber: string
  credentialHint: string
  notes: string
}

const DEVICE_COL = {
  rack: 0,
  vendor: 1,
  deviceType: 2,
  deviceName: 3,
  rackPlusName: 4,
  description: 5,
  deviceDetailIPType: 6,
  deviceDetail: 7,
  status: 8,
  vlan: 9,
  typeOfIP: 10,
  accessIP: 11,
  accessType: 12,
  assetNumber: 13,
  serialNumber: 14,
  credentialHint: 15,
  notes: 16,
}

function toDeviceRow(row: string[]): DeviceRow {
  const get = (i: number) => row[i] ?? ''
  return {
    rack: get(DEVICE_COL.rack),
    vendor: get(DEVICE_COL.vendor),
    deviceType: get(DEVICE_COL.deviceType),
    deviceName: get(DEVICE_COL.deviceName),
    rackPlusName: get(DEVICE_COL.rackPlusName),
    description: get(DEVICE_COL.description),
    deviceDetailIPType: get(DEVICE_COL.deviceDetailIPType),
    deviceDetail: get(DEVICE_COL.deviceDetail),
    status: get(DEVICE_COL.status),
    vlan: get(DEVICE_COL.vlan),
    typeOfIP: get(DEVICE_COL.typeOfIP),
    accessIP: get(DEVICE_COL.accessIP),
    accessType: get(DEVICE_COL.accessType),
    assetNumber: get(DEVICE_COL.assetNumber),
    serialNumber: get(DEVICE_COL.serialNumber),
    credentialHint: get(DEVICE_COL.credentialHint),
    notes: get(DEVICE_COL.notes),
  }
}

/** Helper to create an authenticated Google Sheets JWT client */
function createSheetsClient() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
  const rawKey = process.env.GOOGLE_PRIVATE_KEY || ''
  const privateKey = rawKey.replace(/\\n/g, '\n')

  if (!clientEmail || !privateKey) {
    throw new Error('Google Service Account credentials missing in .env')
  }

  return new JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })
}

/**
 * Fetch all devices from the Device sheet.
 */
export const fetchAllDevicesFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const client = createSheetsClient()

    const range = encodeURIComponent(`Device!A2:Q`)
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}`

    const res = await client.request({ url })
    const data = res.data as { values?: string[][] }
    const rows: string[][] = data.values ?? []
    return rows.map(toDeviceRow).filter((r) => r.deviceName.trim() !== '')
  },
)

export const allDevicesQueryOptions = {
  queryKey: ['all-devices'],
  queryFn: () => fetchAllDevicesFn(),
  staleTime: 1000 * 60 * 5,
  retry: 2,
}

/**
 * Fetch services that match a device's Access IP.
 * Searches services sheet where the "Management IP" column matches the access IP.
 */
export const fetchServicesByAccessIPFn = createServerFn({ method: 'POST' })
  .inputValidator((d: string) => d)
  .handler(async ({ data: accessIP }) => {
    const client = createSheetsClient()

    const range = encodeURIComponent(`${SHEET_NAME}!A2:O`)
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}`

    const res = await client.request({ url })
    const data = res.data as { values?: string[][] }
    const rows: string[][] = data.values ?? []

    const needle = accessIP.trim()

    return rows
      .map(toServiceRow)
      .filter((s) => {
        return s.managementIP.trim() === needle
      })
  })

export const servicesByDeviceIPQueryOptions = (accessIP: string) => ({
  queryKey: ['services-by-device-ip', accessIP],
  queryFn: () => fetchServicesByAccessIPFn({ data: accessIP }),
  staleTime: 1000 * 60 * 5,
  enabled: !!accessIP,
  retry: 2,
})
