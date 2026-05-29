<script lang="ts">
	import { goto } from '$app/navigation'
	import { page } from '$app/state'
	import type { PageData } from './$types'
	import type { ServiceRow } from '$lib/types'
	import { untrack } from 'svelte'
	import ServiceCard from '$lib/components/ServiceCard.svelte'
	import { Search, RefreshCw, AlertCircle } from 'lucide-svelte'

	let { data }: { data: PageData } = $props()

	let query = $state(untrack(() => data.search))
	let typeFilter = $state('')
	let statusFilter = $state('')
	let refreshing = $state(false)

	const services: ServiceRow[] = $derived(data.services)

	const serviceTypes = $derived(
		[...new Set(services.map((s) => s.typeOfService).filter(Boolean))].sort(),
	)
	const statuses = $derived(
		[...new Set(services.map((s) => s.status).filter(Boolean))].sort(),
	)

	const filtered = $derived(
		services.filter((s) => {
			const q = query.toLowerCase()
			const matchText =
				(s.vmName ?? '').toLowerCase().includes(q) ||
				(s.device ?? '').toLowerCase().includes(q) ||
				(s.domainName ?? '').toLowerCase().includes(q) ||
				(s.typeOfService ?? '').toLowerCase().includes(q) ||
				(s.owner ?? '').toLowerCase().includes(q) ||
				(s.managementIP ?? '').toLowerCase().includes(q) ||
				(s.privateIP ?? '').toLowerCase().includes(q) ||
				(s.publicIP ?? '').toLowerCase().includes(q) ||
				(s.user ?? '').toLowerCase().includes(q)
			const matchType = !typeFilter || s.typeOfService === typeFilter
			const matchStatus = !statusFilter || s.status === statusFilter
			return matchText && matchType && matchStatus
		}),
	)

	const hasFilters = $derived(!!(query || typeFilter || statusFilter))

	// Preserve all existing params (including expand) and only update search
	function syncSearchToURL(value: string) {
		const params = new URLSearchParams(page.url.searchParams)
		if (value) params.set('search', value)
		else params.delete('search')
		goto(`?${params}`, { replaceState: true, noScroll: true, keepFocus: true })
	}

	function clearFilters() {
		query = ''
		typeFilter = ''
		statusFilter = ''
		const params = new URLSearchParams(page.url.searchParams)
		params.delete('search')
		goto(`?${params}`, { replaceState: true, noScroll: true, keepFocus: true })
	}

	async function refresh() {
		refreshing = true
		await goto('', { invalidateAll: true })
		refreshing = false
	}
</script>

<!-- Hero -->
<section class="border-b border-border bg-card px-4 py-10">
	<div class="mx-auto max-w-6xl">
		<p class="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
			IT Infrastructure
		</p>
		<h1 class="mb-2 text-3xl font-bold tracking-tight text-foreground">Service Directory</h1>
		<p class="text-sm text-muted-foreground">
			Browse all registered services. Click any card to see full network details.
		</p>
	</div>
</section>

<!-- Toolbar -->
<section class="border-b border-border bg-background px-4 py-3">
	<div class="mx-auto max-w-6xl space-y-2">
		<div class="flex flex-wrap items-center gap-2">
			<div class="relative min-w-0 flex-1 basis-64">
				<Search
					size={15}
					class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
				/>
				<input
					type="search"
					placeholder="Search by name, IP, owner…"
					value={query}
					oninput={(e) => {
						query = (e.currentTarget as HTMLInputElement).value
						syncSearchToURL(query)
					}}
					class="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm
						outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
				/>
			</div>

			<select
				bind:value={typeFilter}
				class="h-9 rounded-md border border-input bg-background px-3 text-sm
					outline-none focus-visible:ring-2 focus-visible:ring-ring"
			>
				<option value="">All Types</option>
				{#each serviceTypes as t}
					<option value={t}>{t}</option>
				{/each}
			</select>

			<select
				bind:value={statusFilter}
				class="h-9 rounded-md border border-input bg-background px-3 text-sm
					outline-none focus-visible:ring-2 focus-visible:ring-ring"
			>
				<option value="">All Statuses</option>
				{#each statuses as s}
					<option value={s}>{s}</option>
				{/each}
			</select>

			<button
				onclick={refresh}
				disabled={refreshing}
				aria-label="Refresh"
				class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input
					bg-background text-muted-foreground transition-colors hover:bg-accent
					hover:text-accent-foreground disabled:opacity-50"
			>
				<RefreshCw size={15} class={refreshing ? 'animate-spin' : ''} />
			</button>
		</div>

		<div class="flex items-center gap-3 text-xs text-muted-foreground">
			<span>{filtered.length} of {services.length} services</span>
			{#if hasFilters}
				<button onclick={clearFilters} class="text-primary hover:underline">Clear filters</button>
			{/if}
		</div>
	</div>
</section>

<!-- Content -->
<section class="mx-auto max-w-6xl space-y-2 px-4 py-6">
	{#if data.error}
		<div class="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center">
			<AlertCircle size={36} class="text-destructive" />
			<p class="font-semibold text-foreground">Could not load services</p>
			<p class="max-w-md text-sm text-muted-foreground">{data.error}</p>
			<button onclick={refresh} class="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
				Try again
			</button>
		</div>
	{:else if filtered.length === 0}
		<div class="flex flex-col items-center gap-3 py-20 text-center">
			<Search size={40} class="text-muted-foreground/40" />
			<p class="font-medium text-foreground">No services found</p>
			<p class="text-sm text-muted-foreground">
				{hasFilters
					? 'Try adjusting your search or filters.'
					: 'The services sheet appears to be empty.'}
			</p>
			{#if hasFilters}
				<button onclick={clearFilters} class="text-sm text-primary hover:underline">
					Clear filters
				</button>
			{/if}
		</div>
	{:else if filtered.length > 0}
		{#each filtered as svc, i (i)}
			<ServiceCard {svc} autoExpand={!!data.expand && (svc.vmName === data.expand || svc.device === data.expand)} />
		{/each}
	{/if}
</section>
