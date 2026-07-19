import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'

const sectionConfigs = [
  {
    title: 'Informasi Request',
    icon: 'description',
    fields: [
      { label: 'Request Number', keys: ['request_number'] },
      { label: 'Part Number', keys: ['part_no', 'part_number'] },
      { label: 'Part Name', keys: ['part_name'] },
      { label: 'Brand', keys: ['brand'] },
      { label: 'Model', keys: ['model'] },
      { label: 'VIN', keys: ['vin'] },
      { label: 'Inquiry ID', keys: ['inquiry_id'] }
    ]
  },
  {
    title: 'Status & Approval',
    icon: 'assignment_turned_in',
    fields: [
      { label: 'Status', keys: ['status'] },
      { label: 'Validated By', keys: ['validated_by'] },
      { label: 'Validated At', keys: ['validated_at'] },
      { label: 'Approved By', keys: ['approved_by'] },
      { label: 'Approved At', keys: ['approved_at'] },
      { label: 'Created At', keys: ['created_at'] },
      { label: 'Updated At', keys: ['updated_at'] }
    ]
  }
]

function findKey(data, keys) {
  return keys.find((key) => Object.prototype.hasOwnProperty.call(data, key))
}

function formatDateValue(value) {
  if (!value) {
    return '-'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return date.toLocaleString('id-ID')
}

function formatValue(key, value) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  if (key.endsWith('_at')) {
    return formatDateValue(value)
  }

  return String(value)
}

function formatFieldLabel(fieldName) {
  return fieldName
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim()
}

function getStatusClasses(status) {
  switch (status) {
    case 'validation':
      return 'bg-orange-100 text-orange-800'
    case 'approval':
      return 'bg-purple-100 text-purple-800'
    case 'approved':
      return 'bg-green-100 text-green-800'
    case 'rejected':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

function DetailCard({ title, icon, children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-outline-variant bg-white shadow-sm ${className}`}>
      <div className="flex items-center gap-2 border-b border-outline-variant px-5 py-4">
        <span className="material-symbols-outlined text-primary text-[20px]">{icon}</span>
        <h3 className="text-base font-semibold text-on-surface">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

function RequestDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadRequest = async () => {
      try {
        setLoading(true)
        setError('')
        const result = await axios.get(`http://localhost:3001/api/requests/${id}`)
        setRequest(result.data)
      } catch (err) {
        console.error(err)
        setError('Data request tidak ditemukan atau gagal dimuat.')
      } finally {
        setLoading(false)
      }
    }

    loadRequest()
  }, [id])

  const trackedKeys = useMemo(() => {
    if (!request) {
      return new Set()
    }

    const keys = new Set(['id'])
    sectionConfigs.forEach((section) => {
      section.fields.forEach((field) => {
        const actualKey = findKey(request, field.keys)
        if (actualKey) {
          keys.add(actualKey)
        }
      })
    })
    return keys
  }, [request])

  const remainingFields = useMemo(() => {
    if (!request) {
      return []
    }

    return Object.entries(request).filter(([key]) => !trackedKeys.has(key))
  }, [request, trackedKeys])

  if (loading) {
    return (
      <main className="p-margin-edge">
        <div className="flex h-96 items-center justify-center rounded-2xl border border-outline-variant bg-white shadow-sm">
          <div className="flex flex-col items-center">
            <span className="material-symbols-outlined animate-spin text-4xl text-primary">refresh</span>
            <p className="mt-3 text-label-md text-on-surface-variant">Memuat detail request...</p>
          </div>
        </div>
      </main>
    )
  }

  if (error || !request) {
    return (
      <main className="p-margin-edge">
        <div className="rounded-2xl border border-outline-variant bg-white p-8 shadow-sm">
          <p className="text-lg font-semibold text-on-surface">Detail request tidak tersedia</p>
          <p className="mt-2 text-body-md text-on-surface-variant">{error || 'Data tidak ditemukan.'}</p>
          <button
            type="button"
            onClick={() => navigate('/requests')}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Kembali ke Requests
          </button>
        </div>
      </main>
    )
  }

  const status = request.status || '-'
  const requestNumber = request.request_number || `REQ-${request.id}`
  const partNumber = request.part_no || request.part_number || '-'

  return (
    <main className="p-margin-edge space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-outline-variant bg-white px-6 py-5 shadow-sm lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm text-on-surface-variant">
            Requests <span className="mx-2">/</span> Detail Request
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-primary">{requestNumber}</h1>
            <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${getStatusClasses(status)}`}>
              {status}
            </span>
          </div>
          <p className="mt-2 text-sm text-on-surface-variant">
            Part Number: <span className="font-semibold text-on-surface">{partNumber}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate('/requests')}
            className="inline-flex items-center gap-2 rounded-lg border border-outline-variant px-4 py-2 text-label-md font-medium text-on-surface hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Kembali
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <DetailCard title={sectionConfigs[0].title} icon={sectionConfigs[0].icon}>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {sectionConfigs[0].fields.map((field) => {
                const actualKey = findKey(request, field.keys)
                const value = actualKey ? request[actualKey] : ''

                return (
                  <div key={field.label} className="rounded-xl bg-surface-container-lowest p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
                      {field.label}
                    </p>
                    <p className="mt-2 break-words text-sm font-semibold text-on-surface">
                      {formatValue(actualKey || '', value)}
                    </p>
                  </div>
                )
              })}
            </div>
          </DetailCard>

          <DetailCard title="Field Lainnya" icon="view_list">
            <div className="grid gap-4 md:grid-cols-2">
              {remainingFields.length > 0 ? (
                remainingFields.map(([key, value]) => (
                  <div key={key} className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
                      {formatFieldLabel(key)}
                    </p>
                    <p className="mt-2 break-words text-sm text-on-surface">{formatValue(key, value)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-on-surface-variant">Tidak ada field tambahan.</p>
              )}
            </div>
          </DetailCard>
        </div>

        <div className="space-y-6">
          <DetailCard title={sectionConfigs[1].title} icon={sectionConfigs[1].icon}>
            <div className="space-y-4">
              {sectionConfigs[1].fields.map((field) => {
                const actualKey = findKey(request, field.keys)
                const value = actualKey ? request[actualKey] : ''

                return (
                  <div key={field.label} className="rounded-xl bg-surface-container-lowest p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
                      {field.label}
                    </p>
                    <p className="mt-2 break-words text-sm font-semibold text-on-surface">
                      {formatValue(actualKey || '', value)}
                    </p>
                  </div>
                )
              })}
            </div>
          </DetailCard>
        </div>
      </div>
    </main>
  )
}

export default RequestDetail
