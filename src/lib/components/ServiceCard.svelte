<script lang="ts">
	import type { ServiceRow } from '$lib/types'
	import StatusBadge from './StatusBadge.svelte'
	import {
		ChevronDown, ChevronUp, Server, Network,
		Globe, Lock, Wifi, Hash, Tag, User, HardDrive,
	} from 'lucide-svelte'

	let { svc, autoExpand = false }: { svc: ServiceRow; autoExpand?: boolean } = $props()

	// manualExpanded = null means "follow the autoExpand prop"
	// Once the user clicks, it overrides the prop
	let manualExpanded = $state<boolean | null>(null)
	const expanded = $derived(manualExpanded !== null ? manualExpanded : autoExpand)

	function toggle() {
		manualExpanded = !expanded
	}
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
				<Server size={16} />
			</div>
			<div class="min-w-0">
				<p class="truncate font-semibold text-foreground">{svc.name || '(Unnamed)'}</p>
				<div class="mt-0.5 flex flex-wrap items-center gap-1.5">
					{#if svc.typeOfService}
						<span
							class="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
						>
							{svc.typeOfService}
						</span>
					{/if}
					{#if svc.rack}
						<span
							class="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground"
						>
							<Network size={10} />
							{svc.rack}
						</span>
					{/if}
				</div>
			</div>
		</div>

		<div class="flex shrink-0 items-center gap-2">
			{#if svc.managementIP}
				<a
					href="/devices?search={encodeURIComponent(svc.managementIP)}&expand={encodeURIComponent(svc.managementIP)}"
					onclick={(e) => e.stopPropagation()}
					title="Click to view device for {svc.managementIP}"
					class="hidden items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground
						transition-colors hover:bg-accent hover:text-primary sm:flex"
				>
					<Wifi size={11} />
					{svc.managementIP}
					<HardDrive size={10} class="opacity-50" />
				</a>
			{/if}
			<StatusBadge status={svc.status} />
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
				<!-- Service details -->
				<div>
					<h3
						class="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
					>
						<Tag size={12} />
						Service Details
					</h3>
					<dl class="space-y-2">
						{#if svc.owner}
							<div class="flex items-start justify-between gap-4">
								<dt class="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
									<User size={11} />Owner
								</dt>
								<dd class="min-w-0 truncate text-right text-xs text-foreground">{svc.owner}</dd>
							</div>
						{/if}
						{#if svc.typeOfService}
							<div class="flex items-start justify-between gap-4">
								<dt class="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
									<Tag size={11} />Type
								</dt>
								<dd class="min-w-0 truncate text-right text-xs text-foreground">{svc.typeOfService}</dd>
							</div>
						{/if}
						{#if svc.rack}
							<div class="flex items-start justify-between gap-4">
								<dt class="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
									<Network size={11} />Rack
								</dt>
								<dd class="min-w-0 truncate text-right text-xs text-foreground">{svc.rack}</dd>
							</div>
						{/if}
						{#if svc.vlan}
							<div class="flex items-start justify-between gap-4">
								<dt class="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
									<Hash size={11} />VLAN
								</dt>
								<dd class="min-w-0 truncate text-right font-mono text-xs text-foreground">{svc.vlan}</dd>
							</div>
						{/if}
						{#if svc.newVLAN && svc.newVLAN !== svc.vlan}
							<div class="flex items-start justify-between gap-4">
								<dt class="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
									<Hash size={11} />New VLAN
								</dt>
								<dd class="min-w-0 truncate text-right font-mono text-xs text-foreground">{svc.newVLAN}</dd>
							</div>
						{/if}
					</dl>
				</div>

				<!-- Network -->
				<div>
					<h3
						class="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
					>
						<Globe size={12} />
						Network
					</h3>
					<dl class="space-y-2">
						{#if svc.managementIP}
							<div class="flex items-start justify-between gap-4">
								<dt class="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
									<Wifi size={11} />Management IP
								</dt>
								<dd class="min-w-0 truncate text-right">
									<a
										href="/devices?search={encodeURIComponent(svc.managementIP)}&expand={encodeURIComponent(svc.managementIP)}"
										class="inline-flex items-center gap-1 font-mono text-xs font-medium text-primary
											underline-offset-2 hover:underline"
										title="View device for {svc.managementIP}"
									>
										{svc.managementIP}
										<HardDrive size={10} />
									</a>
								</dd>
							</div>
						{/if}
						{#if svc.privateIP}
							<div class="flex items-start justify-between gap-4">
								<dt class="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
									<Lock size={11} />Private IP
								</dt>
								<dd class="min-w-0 truncate text-right font-mono text-xs text-foreground">{svc.privateIP}</dd>
							</div>
						{/if}
						{#if svc.newPrivateIP && svc.newPrivateIP !== svc.privateIP}
							<div class="flex items-start justify-between gap-4">
								<dt class="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
									<Lock size={11} />New Private IP
								</dt>
								<dd class="min-w-0 truncate text-right font-mono text-xs text-foreground">
									{svc.newPrivateIP}
								</dd>
							</div>
						{/if}
						{#if svc.publicIP}
							<div class="flex items-start justify-between gap-4">
								<dt class="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
									<Globe size={11} />Public IP
								</dt>
								<dd class="min-w-0 truncate text-right font-mono text-xs text-foreground">{svc.publicIP}</dd>
							</div>
						{/if}
						{#if svc.newPublicIP && svc.newPublicIP !== svc.publicIP}
							<div class="flex items-start justify-between gap-4">
								<dt class="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
									<Globe size={11} />New Public IP
								</dt>
								<dd class="min-w-0 truncate text-right font-mono text-xs text-foreground">{svc.newPublicIP}</dd>
							</div>
						{/if}
					</dl>
				</div>
			</div>
		</div>
	{/if}
</article>
