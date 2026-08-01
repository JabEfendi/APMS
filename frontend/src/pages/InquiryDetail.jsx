import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { canEditInquiryData, canViewSensitivePricing, canViewVendorInternal } from '../utils/rbac'

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

function InquiryEditField({ label, name, value, onChange, className = '', textarea = false, type = 'text', helperText = '' }) {
  const commonClassName = 'mt-2 w-full rounded-lg border border-outline-variant px-4 py-2.5'

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-on-surface-variant">{label}</label>
      {textarea ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          rows={4}
          className={`${commonClassName} py-3`}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          className={commonClassName}
        />
      )}
      {helperText && <p className="mt-2 text-xs text-on-surface-variant">{helperText}</p>}
    </div>
  )
}

function InquiryDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()
  const [inquiry, setInquiry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isEditMode, setIsEditMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formMessage, setFormMessage] = useState('')
  const [formData, setFormData] = useState({
    inquiryId: '',
    inquiryDate: '',
    salesName: '',
    customer: '',
    customerType: '',
    partNo: '',
    workshopPartName: '',
    partName: '',
    brand: '',
    model: '',
    year: '',
    uom: '',
    progressNotes: ''
  })

  useEffect(() => {
    const loadInquiry = async () => {
      try {
        setLoading(true)
        setError('')
        const result = await axios.get(`/api/inquiries/${id}`)
        setInquiry(result.data)
        setFormData({
          inquiryId: result.data.Inquiry_ID || '',
          inquiryDate: result.data.Inquiry_Date || '',
          salesName: result.data.Sales_Name || '',
          customer: result.data.Customer_Name || '',
          customerType: result.data.Customer_Type || '',
          partNo: result.data.Part_Number || '',
          workshopPartName: result.data.Workshop_Part_Name || '',
          partName: result.data.Part_Name || '',
          brand: result.data.Brand || result.data.Brand_ || '',
          model: result.data.Model || result.data.Model_ || '',
          year: result.data.Year || result.data.Year_ || '',
          uom: result.data.UOM || result.data.UOM_ || '',
          progressNotes: result.data.Progress_Notes || ''
        })
      } catch (err) {
        console.error(err)
        setError('Data inquiry tidak ditemukan atau gagal dimuat.')
      } finally {
        setLoading(false)
      }
    }

    loadInquiry()
  }, [id])

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    setFormMessage('')

    try {
      const result = await axios.put(`/api/inquiries/${id}`, formData)
      setInquiry(result.data)
      setFormMessage('Inquiry berhasil diperbarui.')
      setIsEditMode(false)
    } catch (err) {
      console.error(err)
      setFormMessage(err.response?.data?.error || 'Gagal memperbarui inquiry.')
    } finally {
      setIsSaving(false)
    }
  }

  const visibleSections = useMemo(() => {
    return sectionConfigs.filter((section) => {
      if (section.title === 'Vendor Details') {
        return canViewVendorInternal(user?.role)
      }

      if (section.title === 'Detail Harga & Finansial') {
        return true
      }

      return true
    })
  }, [user])

  const trackedKeys = useMemo(() => {
    if (!inquiry) {
      return new Set()
    }

    const keys = new Set(['id', 'Progress_Notes'])

    visibleSections.forEach((section) => {
      section.fields.forEach((field) => {
        const actualKey = findKey(inquiry, field.keys)
        if (actualKey) {
          keys.add(actualKey)
        }
      })
    })

    return keys
  }, [inquiry, visibleSections])

  const remainingFields = useMemo(() => {
    if (!inquiry) {
      return []
    }

    return Object.entries(inquiry).filter(([key]) => {
      if (trackedKeys.has(key)) {
        return false
      }

      if (!canViewVendorInternal(user?.role) && ['Vendor_ID', 'Vendor_Name', 'PROCUREMNT_NAME_FIX', 'PROCUREMNT_NAME_FIX_'].includes(key)) {
        return false
      }

      if (!canViewSensitivePricing(user?.role) && ['HPP_', 'HPP', 'Total_HPP', 'ATPM_Price'].includes(key)) {
        return false
      }

      return true
    })
  }, [inquiry, trackedKeys, user])

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
          {canEditInquiryData(user?.role) && (
            <button
              type="button"
              onClick={() => {
                setFormMessage('')
                setIsEditMode((prev) => !prev)
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-label-md font-medium text-white hover:bg-primary-container"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              {isEditMode ? 'Tutup Edit' : 'Edit Inquiry'}
            </button>
          )}
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

      {isEditMode && (
        <section className="rounded-2xl border border-outline-variant bg-white shadow-sm">
          <div className="border-b border-outline-variant px-5 py-4">
            <h3 className="text-base font-semibold text-on-surface">Edit Inquiry</h3>
            <p className="mt-1 text-sm text-on-surface-variant">
              Form edit sekarang dibagi per bagian supaya jelas field mana yang sedang Anda ubah.
            </p>
          </div>
          <form onSubmit={handleSave} className="space-y-4 p-5">
            {formMessage && (
              <div className="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface">
                {formMessage}
              </div>
            )}
            <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Ringkasan Edit</p>
              <p className="mt-2 text-sm text-on-surface">
                Anda sedang mengubah data untuk inquiry <span className="font-semibold">{formData.inquiryId || '-'}</span> milik customer <span className="font-semibold">{formData.customer || '-'}</span>.
              </p>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.2fr_1.8fr]">
              <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
                <h4 className="text-sm font-semibold text-on-surface">Informasi Inquiry</h4>
                <div className="mt-4 space-y-4">
                  <InquiryEditField label="Inquiry ID" name="inquiryId" value={formData.inquiryId} onChange={handleEditChange} />
                  <InquiryEditField label="Inquiry Date" name="inquiryDate" value={formData.inquiryDate} onChange={handleEditChange} type="date" />
                  <InquiryEditField label="Sales Name" name="salesName" value={formData.salesName} onChange={handleEditChange} />
                  <InquiryEditField label="Customer Name" name="customer" value={formData.customer} onChange={handleEditChange} />
                  <InquiryEditField label="Customer Type" name="customerType" value={formData.customerType} onChange={handleEditChange} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
                  <h4 className="text-sm font-semibold text-on-surface">Detail Part</h4>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <InquiryEditField label="Part Number" name="partNo" value={formData.partNo} onChange={handleEditChange} helperText="Kosongkan bila part number belum diketahui." />
                    <InquiryEditField label="Workshop Part Name" name="workshopPartName" value={formData.workshopPartName} onChange={handleEditChange} />
                    <InquiryEditField label="Part Name" name="partName" value={formData.partName} onChange={handleEditChange} />
                    <InquiryEditField label="Brand" name="brand" value={formData.brand} onChange={handleEditChange} />
                    <InquiryEditField label="Model" name="model" value={formData.model} onChange={handleEditChange} />
                    <InquiryEditField label="Year" name="year" value={formData.year} onChange={handleEditChange} />
                    <InquiryEditField label="UOM" name="uom" value={formData.uom} onChange={handleEditChange} />
                  </div>
                </div>

                <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
                  <h4 className="text-sm font-semibold text-on-surface">Catatan Progres</h4>
                  <div className="mt-4">
                    <InquiryEditField
                      label="Progress Notes"
                      name="progressNotes"
                      value={formData.progressNotes}
                      onChange={handleEditChange}
                      textarea
                      helperText="Gunakan bagian ini untuk menulis perubahan, kendala, atau update terbaru inquiry."
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEditMode(false)}
                className="rounded-lg border border-outline-variant px-4 py-2 text-sm font-medium text-on-surface"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-container disabled:opacity-60"
              >
                <span className={`material-symbols-outlined text-sm ${isSaving ? 'animate-spin' : ''}`}>
                  {isSaving ? 'progress_activity' : 'save'}
                </span>
                Simpan Perubahan
              </button>
            </div>
          </form>
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          {visibleSections.slice(0, 2).map((section) => (
            <DetailCard key={section.title} title={section.title} icon={section.icon}>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {section.fields.map((field) => {
                  if (
                    section.title === 'Detail Harga & Finansial' &&
                    !canViewSensitivePricing(user?.role) &&
                    ['HPP (Unit)', 'Total HPP', 'ATPM Price'].includes(field.label)
                  ) {
                    return null
                  }

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
          {visibleSections.slice(2).map((section) => (
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
