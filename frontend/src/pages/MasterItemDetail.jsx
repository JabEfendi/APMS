import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'

const sectionConfigs = [
  {
    title: 'Informasi Utama',
    icon: 'inventory_2',
    fields: [
      { label: 'Part Number', keys: ['Int__Part_Number'] },
      { label: 'Part Name', keys: ['Part_Name'] },
      { label: 'Workshop Name', keys: ['Workshop_Name'] },
      { label: 'Brand', keys: ['Brand'] },
      { label: 'Model', keys: ['Model'] },
      { label: 'Series / Type', keys: ['Series___Type'] },
      { label: 'Year', keys: ['Year'] },
      { label: 'Data Status', keys: ['Data_Status'] }
    ]
  },
  {
    title: 'Vendor & Kategori',
    icon: 'storefront',
    fields: [
      { label: 'Vendor ID', keys: ['Vendor_ID'] },
      { label: 'Vendor Name', keys: ['Vendor_Name'] },
      { label: 'Category Part', keys: ['Category_Part'] },
      { label: 'Currency', keys: ['Currency'] },
      { label: 'Update Date', keys: ['Update_Date'] }
    ]
  },
  {
    title: 'Harga',
    icon: 'payments',
    fields: [
      { label: 'ATPM Price', keys: ['ATPM_PRICE'] },
      { label: 'Cost Price', keys: ['Cost_Price'] },
      { label: 'HPP (IDR)', keys: ['HPP__IDR_'] }
    ]
  }
]

function findKey(data, keys) {
  return keys.find((key) => Object.prototype.hasOwnProperty.call(data, key))
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') {
    return '-'
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
  if (status === 'Complete' || status === 'Terdaftar') {
    return 'bg-emerald-100 text-emerald-700'
  }

  if (status === 'Tidak Complete' || status === 'Pending') {
    return 'bg-amber-100 text-amber-700'
  }

  return 'bg-slate-100 text-slate-700'
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

function MasterItemDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadItem = async () => {
      try {
        setLoading(true)
        setError('')
        const result = await axios.get(`http://localhost:3001/api/master-items/${id}`)
        setItem(result.data)
      } catch (err) {
        console.error(err)
        setError('Data master item tidak ditemukan atau gagal dimuat.')
      } finally {
        setLoading(false)
      }
    }

    loadItem()
  }, [id])

  const trackedKeys = useMemo(() => {
    if (!item) {
      return new Set()
    }

    const keys = new Set(['id', 'column_17', 'LEGEND___CARA_INPUT___MASTER_SPAREPART', '_1', '_2', '_3'])
    sectionConfigs.forEach((section) => {
      section.fields.forEach((field) => {
        const actualKey = findKey(item, field.keys)
        if (actualKey) {
          keys.add(actualKey)
        }
      })
    })

    return keys
  }, [item])

  const remainingFields = useMemo(() => {
    if (!item) {
      return []
    }

    return Object.entries(item).filter(([key, value]) => !trackedKeys.has(key) && value !== null && value !== '')
  }, [item, trackedKeys])

  if (loading) {
    return (
      <main className="p-margin-edge">
        <div className="flex h-96 items-center justify-center rounded-2xl border border-outline-variant bg-white shadow-sm">
          <div className="flex flex-col items-center">
            <span className="material-symbols-outlined animate-spin text-4xl text-primary">refresh</span>
            <p className="mt-3 text-label-md text-on-surface-variant">Memuat detail master item...</p>
          </div>
        </div>
      </main>
    )
  }

  if (error || !item) {
    return (
      <main className="p-margin-edge">
        <div className="rounded-2xl border border-outline-variant bg-white p-8 shadow-sm">
          <p className="text-lg font-semibold text-on-surface">Detail master item tidak tersedia</p>
          <p className="mt-2 text-body-md text-on-surface-variant">{error || 'Data tidak ditemukan.'}</p>
          <button
            type="button"
            onClick={() => navigate('/master-items')}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Kembali ke Master Items
          </button>
        </div>
      </main>
    )
  }

  const status = item.Data_Status || '-'

  return (
    <main className="p-margin-edge space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-outline-variant bg-white px-6 py-5 shadow-sm lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm text-on-surface-variant">
            Master Items <span className="mx-2">/</span> Detail Master Item
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-primary">{item.Int__Part_Number || `Item #${item.id}`}</h1>
            <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${getStatusClasses(status)}`}>
              {status}
            </span>
          </div>
          <p className="mt-2 text-sm text-on-surface-variant">
            Nama Part: <span className="font-semibold text-on-surface">{formatValue(item.Part_Name)}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate('/master-items')}
            className="inline-flex items-center gap-2 rounded-lg border border-outline-variant px-4 py-2 text-label-md font-medium text-on-surface hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Kembali
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          {sectionConfigs.slice(0, 2).map((section) => (
            <DetailCard key={section.title} title={section.title} icon={section.icon}>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {section.fields.map((field) => {
                  const actualKey = findKey(item, field.keys)
                  const value = actualKey ? item[actualKey] : ''

                  return (
                    <div key={field.label} className="rounded-xl bg-surface-container-lowest p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
                        {field.label}
                      </p>
                      <p className="mt-2 break-words text-sm font-semibold text-on-surface">{formatValue(value)}</p>
                    </div>
                  )
                })}
              </div>
            </DetailCard>
          ))}

          <DetailCard title="Field Lainnya" icon="view_list">
            <div className="grid gap-4 md:grid-cols-2">
              {remainingFields.length > 0 ? (
                remainingFields.map(([key, value]) => (
                  <div key={key} className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
                      {formatFieldLabel(key)}
                    </p>
                    <p className="mt-2 break-words text-sm text-on-surface">{formatValue(value)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-on-surface-variant">Tidak ada field tambahan.</p>
              )}
            </div>
          </DetailCard>
        </div>

        <div className="space-y-6">
          <DetailCard title={sectionConfigs[2].title} icon={sectionConfigs[2].icon}>
            <div className="space-y-4">
              {sectionConfigs[2].fields.map((field) => {
                const actualKey = findKey(item, field.keys)
                const value = actualKey ? item[actualKey] : ''

                return (
                  <div key={field.label} className="rounded-xl bg-surface-container-lowest p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
                      {field.label}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-on-surface">{formatValue(value)}</p>
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

export default MasterItemDetail
