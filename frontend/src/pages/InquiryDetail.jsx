import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'

const sectionConfigs = [
  {
    title: 'Informasi Utama & Item',
    icon: 'inventory_2',
    fields: [
      { label: 'Part Name', keys: ['Part_Name'] },
      { label: 'Workshop Part Name', keys: ['Workshop_Part_Name'] },
      { label: 'Brand', keys: ['Brand_', 'Brand'] },
      { label: 'Model', keys: ['Model_', 'Model'] },
      { label: 'Year', keys: ['Year_', 'Year'] },
      { label: 'UOM', keys: ['UOM_', 'UOM'] },
      { label: 'Category Part', keys: ['Category_Part'] }
    ]
  },
  {
    title: 'Detail Harga & Finansial',
    icon: 'payments',
    fields: [
      { label: 'HPP (Unit)', keys: ['HPP_', 'HPP'] },
      { label: 'Total HPP', keys: ['Total_HPP'] },
      { label: 'Selling Price', keys: ['Selling_Price'] },
      { label: 'Diskon', keys: ['Diskon__', 'Diskon_'] },
      { label: 'ATPM Price', keys: ['ATPM_Price'] },
      { label: 'Selling Price After Disc', keys: ['Selling_Price_After_Disc_'] },
      { label: 'Final Selling Price', keys: ['Final_Selling_Price'] },
      { label: 'Checklist PO', keys: ['Checklist_PO'] },
      { label: 'No PO', keys: ['No__PO', 'No_PO'] },
      { label: 'PO Date', keys: ['PO_Date'] }
    ]
  },
  {
    title: 'Status & Penugasan',
    icon: 'assignment',
    fields: [
      { label: 'Data Status', keys: ['Data_Status'] },
      { label: 'Item Status', keys: ['Item_Status'] },
      { label: 'Status Reason', keys: ['Status_Reason'] },
      { label: 'Inquiry Date', keys: ['Inquiry_Date'] },
      { label: 'Aging', keys: ['Aging__Days_', 'Aging_Days'] },
      { label: 'Customer Name', keys: ['Customer_Name'] },
      { label: 'Customer Type', keys: ['Customer_Type'] },
      { label: 'Sales Name', keys: ['Sales_Name'] },
      { label: 'Purchasing Officer', keys: ['Purchasing_Officer'] }
    ]
  },
  {
    title: 'Vendor Details',
    icon: 'storefront',
    fields: [
      { label: 'Vendor ID', keys: ['Vendor_ID'] },
      { label: 'Vendor Name', keys: ['Vendor_Name'] },
      { label: 'Procurement Name', keys: ['PROCUREMNT_NAME_FIX', 'PROCUREMNT_NAME_FIX_'] },
      { label: 'ID Fix', keys: ['ID_FIX'] },
      { label: 'Sales Name Fix', keys: ['SALES_NAME_FIX'] }
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

  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE'
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

  if (status === 'Pending' || status === 'Tidak Complete') {
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

function InquiryDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [inquiry, setInquiry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadInquiry = async () => {
      try {
        setLoading(true)
        setError('')
        const result = await axios.get(`/api/inquiries/${id}`)
        setInquiry(result.data)
      } catch (err) {
        console.error(err)
        setError('Data inquiry tidak ditemukan atau gagal dimuat.')
      } finally {
        setLoading(false)
      }
    }

    loadInquiry()
  }, [id])

  const trackedKeys = useMemo(() => {
    if (!inquiry) {
      return new Set()
    }

    const keys = new Set(['id', 'Progress_Notes'])

    sectionConfigs.forEach((section) => {
      section.fields.forEach((field) => {
        const actualKey = findKey(inquiry, field.keys)
        if (actualKey) {
          keys.add(actualKey)
        }
      })
    })

    return keys
  }, [inquiry])

  const remainingFields = useMemo(() => {
    if (!inquiry) {
      return []
    }

    return Object.entries(inquiry).filter(([key]) => !trackedKeys.has(key))
  }, [inquiry, trackedKeys])

  if (loading) {
    return (
      <main className="p-margin-edge">
        <div className="flex h-96 items-center justify-center rounded-2xl border border-outline-variant bg-white shadow-sm">
          <div className="flex flex-col items-center">
            <span className="material-symbols-outlined animate-spin text-4xl text-primary">refresh</span>
            <p className="mt-3 text-label-md text-on-surface-variant">Memuat detail inquiry...</p>
          </div>
        </div>
      </main>
    )
  }

  if (error || !inquiry) {
    return (
      <main className="p-margin-edge">
        <div className="rounded-2xl border border-outline-variant bg-white p-8 shadow-sm">
          <p className="text-lg font-semibold text-on-surface">Detail inquiry tidak tersedia</p>
          <p className="mt-2 text-body-md text-on-surface-variant">{error || 'Data tidak ditemukan.'}</p>
          <button
            type="button"
            onClick={() => navigate('/inquiries')}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Kembali ke Inquiry
          </button>
        </div>
      </main>
    )
  }

  const status = inquiry.Data_Status || '-'
  const progressNotes = inquiry.Progress_Notes || '-'

  return (
    <main className="p-margin-edge space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-outline-variant bg-white px-6 py-5 shadow-sm lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm text-on-surface-variant">
            Inquiries <span className="mx-2">/</span> Detail Inquiry
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-primary">{inquiry.Inquiry_ID || `Inquiry #${inquiry.id}`}</h1>
            <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${getStatusClasses(status)}`}>
              {status}
            </span>
          </div>
          <p className="mt-2 text-sm text-on-surface-variant">
            Customer: <span className="font-semibold text-on-surface">{formatValue(inquiry.Customer_Name)}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate('/inquiries')}
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
                  const actualKey = findKey(inquiry, field.keys)
                  const value = actualKey ? inquiry[actualKey] : ''

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
          {sectionConfigs.slice(2).map((section) => (
            <DetailCard key={section.title} title={section.title} icon={section.icon}>
              <div className="space-y-4">
                {section.fields.map((field) => {
                  const actualKey = findKey(inquiry, field.keys)
                  const value = actualKey ? inquiry[actualKey] : ''

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
          ))}

          <DetailCard title="Progress Notes" icon="notes">
            <div className="rounded-xl bg-surface-container-lowest p-4">
              <p className="whitespace-pre-wrap text-sm leading-6 text-on-surface">{formatValue(progressNotes)}</p>
            </div>
          </DetailCard>
        </div>
      </div>
    </main>
  )
}

export default InquiryDetail
