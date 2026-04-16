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
