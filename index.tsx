import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState, useMemo, useEffect } from 'react'
import {
  allDevicesQueryOptions,
  servicesByDeviceIPQueryOptions,
  type DeviceRow,
  type ServiceRow,
} from '../lib/sheets'
import {
  Search,
  HardDrive,
  Network,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Wifi,
  Globe,
  Lock,
  Tag,
  Hash,
  Server,
  Loader2,
  User,
  Box,
} from 'lucide-react'

export const Route = createFileRoute('/devices')({
  component: DevicesPage,
  validateSearch: (search: Record<string, unknown>) => ({
    search: (search.search as string) || '',
    expand: (search.expand as string) || '',
  }),
})

// ─── Status badge ────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase().trim()
  let cls = 'status-badge '
  if (s === 'active' || s === 'up' || s === 'online') cls += 'status-active'
  else if (s === 'inactive' || s === 'down' || s === 'offline') cls += 'status-inactive'
  else if (s === 'maintenance' || s === 'pending') cls += 'status-maintenance'
  else cls += 'status-unknown'
  return <span className={cls}>{status || '—'}</span>
}


// ─── Services list for a device ──────────────────────────────────────────────
function DeviceServicesList({ accessIP, deviceName }: { accessIP: string; deviceName: string }) {
  const navigate = useNavigate({ from: '/devices' })
  const { data, isLoading, isError } = useQuery(
    servicesByDeviceIPQueryOptions(accessIP),
  )

  if (!accessIP) return null

  if (isLoading) {
    return (
      <div className="dev-svc-loading">
        <Loader2 size={16} className="spin" />
        <span>Looking up services for {accessIP}…</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="dev-svc-empty">
        <AlertCircle size={14} />
        <span>Failed to load services</span>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="dev-svc-empty">
        <Server size={14} />
        <span>No services found matching {accessIP}</span>
      </div>
    )
  }

  const services = data as ServiceRow[]

  return (
    <div className="rel-diagram">
      {/* ── Header banner ── */}
      <div className="rel-diagram-header">
        <div className="rel-diagram-count">
          {services.length} service{services.length !== 1 ? 's' : ''} linked
        </div>
        <div className="rel-diagram-via">
          via Management IP <code>{accessIP}</code>
        </div>
      </div>

      {/* ── Visual tree ── */}
      <div className="rel-tree">
        {/* Device hub (left) */}
        <div className="rel-hub">
          <div className="rel-hub-pulse" />
          <div className="rel-hub-icon">
            <HardDrive size={20} />
          </div>
          <div className="rel-hub-label">{deviceName}</div>
          <div className="rel-hub-ip">
            <Wifi size={10} />
            {accessIP}
          </div>
        </div>

        {/* Connector SVG */}
        <svg className="rel-connector" aria-hidden="true">
          {services.map((_, i) => {
            const total = services.length
            // evenly space from top to bottom within the SVG
            const yPct = total === 1 ? 50 : (i / (total - 1)) * 100
            return (
              <g key={i}>
                {/* horizontal from hub center */}
                <line
                  x1="0" y1="50%"
                  x2="40%" y2="50%"
                  className="rel-conn-trunk"
                />
                {/* vertical trunk */}
                {total > 1 && (
                  <line
                    x1="40%" y1={`${(0 / (total - 1)) * 100}%`}
                    x2="40%" y2={`${((total - 1) / (total - 1)) * 100}%`}
                    className="rel-conn-trunk"
                  />
                )}
                {/* branch to service node */}
                <line
                  x1="40%" y1={`${yPct}%`}
                  x2="100%" y2={`${yPct}%`}
                  className="rel-conn-branch"
                  style={{ animationDelay: `${i * 80}ms` }}
                />
                {/* dot at branch end */}
                <circle
                  cx="100%" cy={`${yPct}%`}
                  r="3"
                  className="rel-conn-dot"
                  style={{ animationDelay: `${i * 80 + 200}ms` }}
                />
              </g>
            )
          })}
        </svg>

        {/* Service nodes (right) */}
        <div className="rel-nodes">
          {services.map((svc, i) => (
            <div
              key={`${svc.name}-${i}`}
              className="rel-node"
              style={{ animationDelay: `${i * 60}ms`, cursor: 'pointer' }}
              onClick={() => {
                navigate({
                  to: '/',
                  search: { search: svc.name, expand: svc.name },
                })
              }}
            >
              <div className="rel-node-icon">
                <Server size={14} />
              </div>
              <div className="rel-node-content">
                <div className="rel-node-name">{svc.name}</div>
                <div className="rel-node-meta">
                  {svc.typeOfService && (
                    <span className="rel-node-type">{svc.typeOfService}</span>
                  )}
                  {svc.status && <StatusBadge status={svc.status} />}
                  {svc.owner && (
                    <span className="rel-node-ip" title={`Owner: ${svc.owner}`}>
                      <User size={9} />
                      {svc.owner}
                    </span>
                  )}
                  {svc.privateIP && (
                    <span className="rel-node-ip">
                      <Lock size={9} />
                      {svc.privateIP}
                    </span>
                  )}
                  {svc.vlan && (
                    <span className="rel-node-ip">
                      VLAN {svc.vlan}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Device card ─────────────────────────────────────────────────────────────
function DeviceCard({ device, autoExpand }: { device: DeviceRow; autoExpand?: boolean }) {
  const [expanded, setExpanded] = useState(autoExpand ?? false)

  return (
    <article className={`dev-card${expanded ? ' dev-card-expanded' : ''}`}>
      <div
        className="dev-card-header"
        onClick={() => setExpanded((v) => !v)}
        role="button"
        aria-expanded={expanded}
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setExpanded((v) => !v)}
      >
        {/* Left */}
        <div className="dev-card-left">
          <div className="dev-card-icon">
            <HardDrive size={18} />
          </div>
          <div className="dev-card-info">
            <h2 className="dev-card-name">
              {device.deviceName || '(Unnamed)'}
            </h2>
            <div className="dev-card-meta-row">
              {device.deviceType && (
                <span className="dev-card-type-badge">{device.deviceType}</span>
              )}
              {device.vendor && (
                <span className="dev-card-vendor-badge">{device.vendor}</span>
              )}
              {device.rack && (
                <span className="dev-card-rack-badge">
                  <Network size={10} />
                  {device.rack}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="dev-card-right">
          {device.accessIP && (
            <span className="dev-card-ip">
              <Globe size={12} />
              {device.accessIP}
            </span>
          )}
          <StatusBadge status={device.status} />
          <span className={`svc-expand-btn${expanded ? ' svc-expand-open' : ''}`}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </div>
      </div>

      {expanded && (
        <div className="dev-card-body">
          {/* Device details strip */}
          <div className="dev-detail-strip">
            <div className="dev-detail-columns">
              {/* Left col */}
              <div className="dev-detail-col">
                <div className="dev-detail-section">
                  <h3 className="dev-detail-section-title">
                    <HardDrive size={14} />
                    Device Identity
                  </h3>
                  <div className="dev-detail-fields">
                    <DevDetailField label="Device Name" value={device.deviceName} icon={<Tag size={12} />} />
                    <DevDetailField label="Rack+Name" value={device.rackPlusName} icon={<Box size={12} />} />
                    <DevDetailField label="Description" value={device.description} icon={<Tag size={12} />} />
                    <DevDetailField label="Vendor" value={device.vendor} icon={<Tag size={12} />} />
                    <DevDetailField label="Device Type" value={device.deviceType} icon={<HardDrive size={12} />} />
                    <DevDetailField label="Asset Number" value={device.assetNumber} icon={<Hash size={12} />} mono />
                    <DevDetailField label="Serial Number" value={device.serialNumber} icon={<Hash size={12} />} mono />
                  </div>
                </div>
              </div>

              {/* Right col */}
              <div className="dev-detail-col">
                <div className="dev-detail-section">
                  <h3 className="dev-detail-section-title">
                    <Globe size={14} />
                    Network Config
                  </h3>
                  <div className="dev-detail-fields">
                    <DevDetailField label="Access IP" value={device.accessIP} icon={<Wifi size={12} />} mono accent />
                    <DevDetailField label="Access Type" value={device.accessType} icon={<Lock size={12} />} />
                    <DevDetailField label="IP Type" value={device.typeOfIP} icon={<Globe size={12} />} />
                    <DevDetailField label="VLAN" value={device.vlan} icon={<Hash size={12} />} mono />
                    <DevDetailField label="Device Detail" value={device.deviceDetail} icon={<Tag size={12} />} />
                    {device.notes && (
                      <DevDetailField label="Notes" value={device.notes} icon={<Tag size={12} />} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reverse lookup: services belonging to this device */}
          <div className="dev-services-section">
            <h3 className="dev-services-title">
              <Server size={14} />
              Related Services
              <span className="dev-services-subtitle">
                (matched by Access IP)
              </span>
            </h3>
            <DeviceServicesList accessIP={device.accessIP} deviceName={device.deviceName} />
          </div>
        </div>
      )}
    </article>
  )
}

// ─── Detail field ────────────────────────────────────────────────────────────
function DevDetailField({
  label,
  value,
  icon,
  mono,
  accent,
}: {
  label: string
  value: string
  icon?: React.ReactNode
  mono?: boolean
  accent?: boolean
}) {
  if (!value || value.trim() === '') return null
  return (
    <div className="detail-field">
      <div className="detail-field-label">
        {icon && <span className="detail-field-icon">{icon}</span>}
        {label}
      </div>
      <div
        className={`detail-field-value${accent ? ' detail-field-accent' : ''}${mono ? ' detail-field-mono' : ''}`}
      >
        {value}
      </div>
    </div>
  )
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-card-inner">
        <div className="skeleton-icon" />
        <div className="skeleton-text">
          <div className="skeleton-line w-48" />
          <div className="skeleton-line w-28 short" />
        </div>
      </div>
    </div>
  )
}

// ─── Main Devices Page ───────────────────────────────────────────────────────
function DevicesPage() {
  const { data, isLoading, isError, error, refetch, isFetching } =
    useQuery(allDevicesQueryOptions)

  const { search: searchParam, expand: expandParam } = useSearch({ from: '/devices' })

  const [query, setQuery] = useState(searchParam || '')
  const [typeFilter, setTypeFilter] = useState('')
  const [vendorFilter, setVendorFilter] = useState('')

  useEffect(() => {
    if (searchParam) setQuery(searchParam)
  }, [searchParam])

  const devices = data ?? []

  const deviceTypes = useMemo(() => {
    const set = new Set(devices.map((d) => d.deviceType).filter(Boolean))
    return Array.from(set).sort()
  }, [devices])

  const vendors = useMemo(() => {
    const set = new Set(devices.map((d) => d.vendor).filter(Boolean))
    return Array.from(set).sort()
  }, [devices])

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return devices.filter((d) => {
      const matchName =
        d.deviceName.toLowerCase().includes(q) ||
        d.rackPlusName.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.accessIP.toLowerCase().includes(q)
      const matchType = !typeFilter || d.deviceType === typeFilter
      const matchVendor = !vendorFilter || d.vendor === vendorFilter
      return matchName && matchType && matchVendor
    })
  }, [devices, query, typeFilter, vendorFilter])

  const hasFilters = query || typeFilter || vendorFilter
  const clearFilters = () => {
    setQuery('')
    setTypeFilter('')
    setVendorFilter('')
  }

  return (
    <main className="services-page">
      {/* Hero */}
      <section className="services-hero">
        <div className="page-wrap">
          <p className="island-kicker mb-3">Hardware Assets</p>
          <h1 className="services-hero-title">Device Directory</h1>
          <p className="services-hero-sub">
            Browse all registered network devices and discover their associated
            services. Expand any device to see a visual service map.
          </p>
        </div>
      </section>

      {/* Toolbar */}
      <section className="services-toolbar-wrap">
        <div className="page-wrap services-toolbar">
          <div className="search-input-wrap">
            <Search size={17} className="search-icon" />
            <input
              id="devices-search"
              type="search"
              placeholder="Search by name, IP, or description…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="search-input"
              autoComplete="off"
            />
            {query && (
              <button
                className="search-clear"
                onClick={() => setQuery('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <select
            id="filter-device-type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Types</option>
            {deviceTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            id="filter-vendor"
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Vendors</option>
            {vendors.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>

          <button
            id="btn-refresh-devices"
            className="icon-btn"
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="Refresh data"
            title="Refresh"
          >
            <RefreshCw size={16} className={isFetching ? 'spin' : ''} />
          </button>
        </div>

        {!isLoading && (
          <div className="page-wrap services-meta-bar">
            <span className="results-count">
              {isError
                ? 'Failed to load'
                : `${filtered.length} of ${devices.length} devices`}
            </span>
            {hasFilters && (
              <button className="clear-btn" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>
        )}
      </section>

      {/* Content */}
      <section className="services-content page-wrap">
        {isLoading && (
          <div className="skeleton-list">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {isError && (
          <div className="error-state island-shell">
            <AlertCircle size={32} className="error-icon" />
            <h2 className="error-title">Could not load devices</h2>
            <p className="error-msg">
              {(error as Error)?.message ?? 'An unexpected error occurred.'}
            </p>
            <button
              id="btn-retry-devices"
              className="retry-btn"
              onClick={() => refetch()}
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className="empty-state">
            <Search size={40} className="empty-icon" />
            <h2 className="empty-title">No devices found</h2>
            <p className="empty-msg">
              {hasFilters
                ? 'Try adjusting your search or filters.'
                : 'The device sheet appears to be empty.'}
            </p>
            {hasFilters && (
              <button className="clear-btn mt-4" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <div className="services-list">
            {filtered.map((device, idx) => (
              <DeviceCard
                key={`${device.deviceName}-${idx}`}
                device={device}
                autoExpand={!!expandParam && device.accessIP.toLowerCase().includes(expandParam.toLowerCase())}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}