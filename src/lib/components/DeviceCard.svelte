<script lang="ts">
	import { untrack } from 'svelte'
	import type { DeviceRow, ServiceRow } from '$lib/types'
	import StatusBadge from './StatusBadge.svelte'
	import ServiceRelDiagram from './ServiceRelDiagram.svelte'
	import {
		ChevronDown, ChevronUp, HardDrive, Network, Globe,
		Wifi, Server, Loader2, AlertCircle,
	} from 'lucide-svelte'

	let { device, autoExpand = false }: { device: DeviceRow; autoExpand?: boolean } = $props()

	let expanded = $state(untrack(() => autoExpand))
	let services = $state<ServiceRow[] | null>(null)
	let loadingServices = $state(false)
	let servicesError = $state(false)

	async function fetchServices() {
		if (services !== null || !device.accessIP) return
		loadingServices = true
		servicesError = false
		try {
			const r = await fetch(`/api/services-by-ip/${encodeURIComponent(device.accessIP)}`)
			if (!r.ok) throw new Error('Request failed')
			services = (await r.json()) as ServiceRow[]
		} catch {
			servicesError = true
		} finally {
			loadingServices = false
		}
	}

	async function toggle() {
		expanded = !expanded
		if (expanded) await fetchServices()
	}

	$effect(() => {
		if (expanded) fetchServices()
	})
</script>

<article
	class="overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow
		{expanded ? 'shadow-md' : 'hover:shadow-md'}"
>
	<!-- Header -->
	<button
		class="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
		onclick={toggle}
		aria-expanded={expanded}
	>
		<div class="flex min-w-0 items-center gap-3">
			<div
				class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
			>
				<HardDrive size={16} />
			</div>
			<div class="min-w-0">
				<p class="truncate font-semibold text-foreground">{device.deviceName || '(Unnamed)'}</p>
				<div class="mt-0.5 flex flex-wrap items-center gap-1.5">
					{#if device.deviceType}
						<span
							class="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
						>
							{device.deviceType}
						</span>
					{/if}
					{#if device.vendor}
						<span
							class="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
						>
							{device.vendor}
						</span>
					{/if}
					{#if device.rack}
						<span
							class="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground"
						>
							<Network size={10} />
							{device.rack}
						</span>
					{/if}
				</div>
			</div>
		</div>

		<div class="flex shrink-0 items-center gap-2">
			{#if device.accessIP}
				<span class="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
					<Globe size={11} />
					{device.accessIP}
				</span>
			{/if}
			<StatusBadge status={device.status} />
			{#if expanded}
				<ChevronUp size={16} class="text-muted-foreground" />
			{:else}
				<ChevronDown size={16} class="text-muted-foreground" />
			{/if}
		</div>
	</button>

	<!-- Body -->
	{#if expanded}
		<div class="border-t border-border px-5 pb-5 pt-4">
			<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
				<!-- Device identity -->
				<div>
					<h3
						class="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
					>
						<HardDrive size={12} />
						Device Identity
					</h3>
					<dl class="space-y-2">
						{#each [
							{ label: 'Device Name', value: device.deviceName, mono: false },
							{ label: 'Rack+Name', value: device.rackPlusName, mono: false },
							{ label: 'Description', value: device.description, mono: false },
							{ label: 'Vendor', value: device.vendor, mono: false },
							{ label: 'Device Type', value: device.deviceType, mono: false },
							{ label: 'Asset #', value: device.assetNumber, mono: true },
							{ label: 'Serial #', value: device.serialNumber, mono: true },
						] as field}
							{#if field.value?.trim()}
								<div class="flex items-start justify-between gap-4">
									<dt class="shrink-0 text-xs text-muted-foreground">{field.label}</dt>
									<dd
										class="min-w-0 truncate text-right text-xs text-foreground
											{field.mono ? 'font-mono' : ''}"
									>
										{field.value}
									</dd>
								</div>
							{/if}
						{/each}
					</dl>
				</div>

				<!-- Network config -->
				<div>
					<h3
						class="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
					>
						<Globe size={12} />
						Network Config
					</h3>
					<dl class="space-y-2">
						{#if device.accessIP}
							<div class="flex items-start justify-between gap-4">
								<dt class="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
									<Wifi size={11} />Access IP
								</dt>
								<dd class="min-w-0 truncate text-right font-mono text-xs font-medium text-primary">
									{device.accessIP}
								</dd>
							</div>
						{/if}
						{#each [
							{ label: 'Access Type', value: device.accessType },
							{ label: 'IP Type', value: device.typeOfIP },
							{ label: 'VLAN', value: device.vlan },
							{ label: 'Device Detail', value: device.deviceDetail },
							{ label: 'Notes', value: device.notes },
						] as field}
							{#if field.value?.trim()}
								<div class="flex items-start justify-between gap-4">
									<dt class="shrink-0 text-xs text-muted-foreground">{field.label}</dt>
									<dd class="min-w-0 truncate text-right text-xs text-foreground">{field.value}</dd>
								</div>
							{/if}
						{/each}
					</dl>
				</div>
			</div>

			<!-- Related services -->
			<div class="mt-6">
				<h3
					class="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
				>
					<Server size={12} />
					Related Services
					<span class="ml-1 font-normal normal-case">(matched by Access IP)</span>
				</h3>

				{#if !device.accessIP}
					<p class="text-xs text-muted-foreground">No Access IP — cannot look up services.</p>
				{:else if loadingServices}
					<div class="flex items-center gap-2 text-xs text-muted-foreground">
						<Loader2 size={14} class="animate-spin" />
						Looking up services for {device.accessIP}…
					</div>
				{:else if servicesError}
					<div class="flex items-center gap-1.5 text-xs text-destructive">
						<AlertCircle size={13} />
						Failed to load services
					</div>
				{:else if services !== null && services.length === 0}
					<p class="text-xs text-muted-foreground">No services found matching {device.accessIP}.</p>
				{:else if services !== null}
					<ServiceRelDiagram
						{services}
						deviceName={device.deviceName}
						accessIP={device.accessIP}
					/>
				{/if}
			</div>
		</div>
	{/if}
</article>
