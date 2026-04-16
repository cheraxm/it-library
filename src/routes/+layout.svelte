<script lang="ts">
	import './layout.css'
	import favicon from '$lib/assets/favicon.svg'
	import { page } from '$app/state'
	import { Server, HardDrive, Library } from 'lucide-svelte'

	let { children } = $props()

	const nav = [
		{ href: '/', label: 'Services', icon: Server },
		{ href: '/devices', label: 'Devices', icon: HardDrive },
	]
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-screen bg-background">
	<header class="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
		<div class="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
			<a href="/" class="flex items-center gap-2 font-semibold text-foreground">
				<Library size={18} class="text-primary" />
				ITKMITL Library
			</a>

			<nav class="flex gap-1">
				{#each nav as { href, label, icon: Icon }}
					<a
						{href}
						class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors
							{page.url.pathname === href
							? 'bg-accent text-accent-foreground'
							: 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}"
					>
						<Icon size={14} />
						{label}
					</a>
				{/each}
			</nav>
		</div>
	</header>

	<main>
		{@render children()}
	</main>
</div>
