<script lang="ts">
	let { status }: { status: string } = $props()

	const cls = $derived(() => {
		const s = status.toLowerCase().trim()
		if (s === 'active' || s === 'up' || s === 'online')
			return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
		if (s === 'inactive' || s === 'down' || s === 'offline')
			return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
		if (s === 'maintenance' || s === 'pending')
			return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
		return 'bg-muted text-muted-foreground'
	})
</script>

<span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium {cls()}">
	{status || '—'}
</span>
