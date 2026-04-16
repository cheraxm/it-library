<script lang="ts">
	import type { ServiceRow } from '$lib/types'
	import StatusBadge from './StatusBadge.svelte'
	import { HardDrive, Server, Wifi, User } from 'lucide-svelte'

	let {
		services,
		deviceName,
		accessIP,
	}: { services: ServiceRow[]; deviceName: string; accessIP: string } = $props()

	const NODE_H = 72
	const NODE_GAP = 12
	const CONNECTOR_W = 72
	const TRUNK_X = CONNECTOR_W / 2

	const total = $derived(services.length)
	const colH = $derived(total * NODE_H + Math.max(0, total - 1) * NODE_GAP)

	function cy(i: number) {
		return i * (NODE_H + NODE_GAP) + NODE_H / 2
	}
</script>

<div class="overflow-x-auto rounded-xl border border-border bg-muted/30 p-5">
	<!-- Header -->
	<div class="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs">
		<span class="font-medium text-foreground">
			{total} service{total !== 1 ? 's' : ''} linked
		</span>
		<span class="text-muted-foreground">
			via Management IP
			<code class="rounded bg-muted px-1 py-0.5 font-mono">{accessIP}</code>
		</span>
	</div>

	<!-- Diagram row: hub + SVG connector + nodes -->
	<div class="flex items-start gap-0">

		<!-- Device hub -->
		<div class="relative flex w-40 shrink-0 flex-col items-center justify-center gap-2 self-center
			rounded-xl border border-primary/30 bg-card px-3 py-4 shadow-sm">
			<span class="absolute inset-0 animate-pulse rounded-xl bg-primary/5" aria-hidden="true"></span>
			<div class="relative flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
				<HardDrive size={18} />
			</div>
			<p class="relative w-full truncate text-center text-xs font-semibold text-foreground">
				{deviceName || '(Device)'}
			</p>
			<span class="relative flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
				<Wifi size={9} />{accessIP}
			</span>
		</div>

		<!-- SVG connector — use explicit stroke/fill attrs, not Tailwind classes, so they render in SVG context -->
		<svg
			width={CONNECTOR_W}
			height={colH}
			class="shrink-0 self-start overflow-visible"
			aria-hidden="true"
		>
			{#if total > 0}
				<!-- Horizontal stub from hub edge to trunk -->
				<line
					x1="0" y1={colH / 2}
					x2={TRUNK_X} y2={colH / 2}
					stroke="var(--color-border)" stroke-width="1.5"
				/>
				<!-- Vertical spine (only when > 1 service) -->
				{#if total > 1}
					<line
						x1={TRUNK_X} y1={cy(0)}
						x2={TRUNK_X} y2={cy(total - 1)}
						stroke="var(--color-border)" stroke-width="1.5"
					/>
				{/if}
				<!-- Animated branches + dots per service -->
				{#each services as _, i}
					<line
						x1={TRUNK_X} y1={cy(i)}
						x2={CONNECTOR_W} y2={cy(i)}
						stroke="var(--color-primary)" stroke-width="1.5" opacity="0.6"
						stroke-dasharray={CONNECTOR_W - TRUNK_X}
						stroke-dashoffset={CONNECTOR_W - TRUNK_X}
						style="animation: rel-draw 0.4s ease-out {i * 80}ms forwards"
					/>
					<circle
						cx={CONNECTOR_W} cy={cy(i)} r="3"
						fill="var(--color-primary)" opacity="0"
						style="animation: rel-dot 0.2s ease-out {i * 80 + 280}ms forwards"
					/>
				{/each}
			{/if}
		</svg>

		<!-- Service nodes -->
		<div class="flex min-w-0 flex-1 flex-col" style="gap: {NODE_GAP}px">
			{#each services as svc, i (`${svc.name}-${i}`)}
				<a
					href="/?search={encodeURIComponent(svc.name)}&expand={encodeURIComponent(svc.name)}"
					class="group flex min-w-0 items-center gap-3 rounded-xl border border-border bg-card
						px-3 py-2 opacity-0 transition-colors hover:border-primary/40 hover:bg-accent"
					style="height: {NODE_H}px; animation: rel-node {0.25}s ease-out {i * 80 + 120}ms forwards"
				>
					<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg
						bg-muted text-muted-foreground transition-colors
						group-hover:bg-primary/10 group-hover:text-primary">
						<Server size={14} />
					</div>
					<div class="min-w-0 flex-1">
						<p class="truncate text-xs font-semibold text-foreground group-hover:text-primary">
							{svc.name}
						</p>
						<div class="mt-1 flex flex-wrap items-center gap-1">
							{#if svc.typeOfService}
								<span class="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] text-secondary-foreground">
									{svc.typeOfService}
								</span>
							{/if}
							{#if svc.status}
								<StatusBadge status={svc.status} />
							{/if}
							{#if svc.owner}
								<span class="flex items-center gap-0.5 text-[10px] text-muted-foreground">
									<User size={9} />{svc.owner}
								</span>
							{/if}
						</div>
					</div>
				</a>
			{/each}
		</div>
	</div>
</div>

<style>
	/* Wrap in :global{} block so keyframe names are not scoped —
	   inline style="animation: rel-draw …" must match the actual name */
	:global {
		@keyframes rel-draw {
			to { stroke-dashoffset: 0; }
		}
		@keyframes rel-dot {
			to { opacity: 1; }
		}
		@keyframes rel-node {
			from { opacity: 0; transform: translateX(-6px); }
			to   { opacity: 1; transform: translateX(0); }
		}
	}
</style>
