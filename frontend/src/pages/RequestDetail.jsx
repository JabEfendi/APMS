import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { canEditInquiryData, canEditPricing, canViewSensitivePricing, canViewVendorInternal, isSalesRole } from '../utils/rbac'

const salesSections = [
  {
    title: 'Informasi Utama',
    icon: 'description',
    fields: [
      { label: 'Inquiry ID', keys: ['inquiry_id'] },
      { label: 'Inquiry Date', keys: ['inquiry_date'] },
      { label: 'Sales Name', keys: ['sales_name'] },
      { label: 'Customer Name', keys: ['customer'] },
      { label: 'Part Number', keys: ['part_no', 'part_number'] },
      { label: 'Nama Part', keys: ['part_name'] },
      { label: 'Brand', keys: ['brand'] },
      { label: 'Model', keys: ['model'] },
      { label: 'Series', keys: ['series_type'] },
      { label: 'Year', keys: ['year'] },
      { label: 'Nomor VIN', keys: ['vin'] },
      { label: 'Total QTY', keys: ['quantity'] }
    ]
  },
  {
    title: 'Pricing Sales',
    icon: 'payments',
    fields: [
      { label: 'Data Status', keys: ['data_status'] },
      { label: 'Status Reason', keys: ['status_reason'] },
      { label: 'Progress Note', keys: ['progress_notes'] },
      { label: 'Aging Days', keys: ['aging_days'] },
      { label: 'Selling Price', keys: ['selling_price'] },
      { label: 'Update Date', keys: ['update_date'] }
    ]
  }
]

const purchasingSections = [
  {
    title: 'Informasi Utama',
    icon: 'inventory_2',
    fields: [
      { label: 'Request Number', keys: ['request_number'] },
      { label: 'Inquiry ID', keys: ['inquiry_id'] },
      { label: 'Inquiry Date', keys: ['inquiry_date'] },
      { label: 'Sales Name', keys: ['sales_name'] },
      { label: 'Customer', keys: ['customer'] },
      { label: 'Part Number', keys: ['part_no', 'part_number'] },
      { label: 'Nama Part', keys: ['part_name'] },
      { label: 'Brand', keys: ['brand'] },
      { label: 'Model', keys: ['model'] },
      { label: 'Series', keys: ['series_type'] },
      { label: 'Year', keys: ['year'] },
      { label: 'VIN', keys: ['vin'] },
      { label: 'Total QTY', keys: ['quantity'] },
      { label: 'Data Status', keys: ['data_status'] },
      { label: 'Status Reason', keys: ['status_reason'] },
      { label: 'Progress Note', keys: ['progress_notes'] },
      { label: 'Aging Days', keys: ['aging_days'] }
    ]
  },
  {
    title: 'Vendor & Harga',
    icon: 'payments',
    fields: [
      { label: 'Status ID', keys: ['status_id'] },
      { label: 'PO Process', keys: ['po_process'] },
      { label: 'PO Number', keys: ['po_number'] },
      { label: 'PO Date', keys: ['po_date'] },
      { label: 'Vendor ID', keys: ['vendor_id'] },
      { label: 'Vendor Name', keys: ['vendor_name'] },
      { label: 'Category Part', keys: ['category_part'] },
      { label: 'Currency', keys: ['currency'] },
      { label: 'ATPM Price', keys: ['atpm_price'] },
      { label: 'Cost Price', keys: ['cost_price'] },
      { label: 'HPP (IDR)', keys: ['hpp_idr'] },
      { label: 'Selling Price', keys: ['selling_price'] },
      { label: 'Update Date', keys: ['update_date'] }
    ]
  },
  {
    title: 'Tahap Proses',
    icon: 'assignment_turned_in',
    fields: [
      { label: 'Tahap Workflow', keys: ['status'] },
      { label: 'Direview Oleh', keys: ['validated_by'] },
      { label: 'Direview Pada', keys: ['validated_at'] },
      { label: 'Diselesaikan Oleh', keys: ['approved_by'] },
      { label: 'Diselesaikan Pada', keys: ['approved_at'] },
      { label: 'Dibuat Pada', keys: ['created_at'] },
      { label: 'Diperbarui Pada', keys: ['updated_at'] }
    ]
  }
]

const mediaFieldKeys = ['item_image_url', 'item_images', 'attachment_url', 'notes', 'item_image_name', 'attachment_name']

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

  if (key.endsWith('_at') || key.endsWith('_date')) {
    return formatDateValue(value)
  }

  return String(value)
}

function getAgingDays(request) {
  const baseDate = request?.inquiry_date || request?.created_at

  if (!baseDate) {
    return '-'
  }

  const parsed = new Date(baseDate)
  if (Number.isNaN(parsed.getTime())) {
    return '-'
  }

  const diffMs = Date.now() - parsed.getTime()
  const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
  return String(days)
}

function getAgingBadgeClasses(value) {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) {
    return 'bg-slate-100 text-slate-700'
  }

  if (numericValue > 3) {
    return 'bg-red-100 text-red-800'
  }

  if (numericValue === 3) {
    return 'bg-yellow-100 text-yellow-800'
  }

  return 'bg-green-100 text-green-800'
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
    case 'Complete':
      return 'bg-green-100 text-green-800'
    case 'Tidak Complete':
      return 'bg-orange-100 text-orange-800'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

function getWorkflowLabel(status) {
  switch (status) {
    case 'validation':
      return 'Menunggu Review Purchasing'
    case 'approval':
      return 'Menunggu Konfirmasi Akhir'
    case 'approved':
      return 'Selesai Diproses'
    case 'rejected':
      return 'Dikembalikan'
    default:
      return 'Draft'
  }
}

function getWorkflowClasses(status) {
  switch (status) {
    case 'validation':
      return 'bg-blue-100 text-blue-800'
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

function getItemImages(request) {
  if (!request) {
    return []
  }

  if (Array.isArray(request.item_images) && request.item_images.length > 0) {
    return request.item_images.filter((item) => item?.url)
  }

  if (typeof request.item_images === 'string' && request.item_images.trim()) {
    try {
      const parsed = JSON.parse(request.item_images)
      if (Array.isArray(parsed)) {
        return parsed.filter((item) => item?.url)
      }
    } catch (error) {
      console.error('Gagal parse item_images:', error)
    }
  }

  if (request.item_image_url) {
    return [{
      url: request.item_image_url,
      name: request.item_image_name || '',
      mimeType: request.item_image_mime_type || ''
    }]
  }

  return []
}

function DetailCard({ title, icon, children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-outline-variant bg-white shadow-sm ${className}`}>
      <div className="flex items-center gap-2 border-b border-outline-variant px-5 py-4">
        <span className="material-symbols-outlined text-[20px] text-primary">{icon}</span>
        <h3 className="text-base font-semibold text-on-surface">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

function RequestDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pricingForm, setPricingForm] = useState({
    vendorId: '',
    vendorName: '',
    categoryPart: '',
    currency: 'IDR',
    atpmPrice: '',
    costPrice: '',
    sellingPrice: '',
    updateDate: '',
    dataStatus: 'Tidak Complete',
    statusReason: '',
    progressNotes: '',
    statusId: '',
    poProcess: '',
    poNumber: '',
    poDate: ''
  })
  const [savingPricing, setSavingPricing] = useState(false)
  const [pricingMessage, setPricingMessage] = useState('')
  const [workflowMessage, setWorkflowMessage] = useState('')

  const isSalesView = isSalesRole(user?.role)
  const sections = isSalesView ? salesSections : purchasingSections
  const primarySections = isSalesView ? [salesSections[0]] : sections.slice(0, 2)
  const sideSection = isSalesView ? salesSections[1] : sections[2]

  useEffect(() => {
    const loadRequest = async () => {
      try {
        setLoading(true)
        setError('')
        const result = await axios.get(`/api/requests/${id}`)
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

  useEffect(() => {
    if (!request) {
      return
    }

    setPricingForm({
      vendorId: request.vendor_id || '',
      vendorName: request.vendor_name || '',
      categoryPart: request.category_part || '',
      currency: request.currency || 'IDR',
      atpmPrice: request.atpm_price || '',
      costPrice: request.cost_price || '',
      sellingPrice: request.selling_price || '',
      updateDate: request.update_date || new Date().toISOString().split('T')[0],
      dataStatus: request.data_status || 'Tidak Complete',
      statusReason: request.status_reason || '',
      progressNotes: request.progress_notes || '',
      statusId: request.status_id || '',
      poProcess: request.po_process || '',
      poNumber: request.po_number || '',
      poDate: request.po_date || ''
    })
  }, [request])

  const trackedKeys = useMemo(() => {
    if (!request) {
      return new Set()
    }

    const keys = new Set(['id', ...mediaFieldKeys])
    sections.forEach((section) => {
      section.fields.forEach((field) => {
        const actualKey = findKey(request, field.keys)
        if (actualKey) {
          keys.add(actualKey)
        }
      })
    })
    return keys
  }, [request, sections])

  const remainingFields = useMemo(() => {
    if (!request || isSalesView) {
      return []
    }

    return Object.entries(request).filter(([key, value]) => !trackedKeys.has(key) && value !== null && value !== '')
  }, [request, trackedKeys, isSalesView])

  const handlePricingChange = (e) => {
    const { name, value } = e.target
    setPricingForm((prev) => ({ ...prev, [name]: value }))
  }

  const hppPreview = useMemo(() => {
    if (!pricingForm.costPrice) {
      return request?.hpp_idr || '-'
    }

    return pricingForm.costPrice
  }, [pricingForm.costPrice, request?.hpp_idr])

  const handlePricingSave = async (e) => {
    e.preventDefault()
    setSavingPricing(true)
    setPricingMessage('')

    try {
      const result = await axios.put(`/api/requests/${id}/pricing`, pricingForm)
      setRequest(result.data)
      setPricingMessage('Pricing item request berhasil diperbarui.')
    } catch (err) {
      console.error(err)
      setPricingMessage(err.response?.data?.error || 'Gagal memperbarui pricing item request.')
    } finally {
      setSavingPricing(false)
    }
  }

  const handleWorkflowAction = async (type, action) => {
    try {
      setWorkflowMessage('')
      const endpoint = type === 'validate'
        ? `/api/requests/${id}/validate`
        : `/api/requests/${id}/approve`

      const result = await axios.put(endpoint, { action })
      setRequest(result.data)
      setWorkflowMessage('Tahap proses item request berhasil diperbarui.')
    } catch (err) {
      console.error(err)
      setWorkflowMessage(err.response?.data?.error || 'Gagal memperbarui tahap proses item request.')
    }
  }

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
            Kembali ke Item Request
          </button>
        </div>
      </main>
    )
  }

  const status = request.data_status || '-'
  const requestNumber = request.request_number || `REQ-${request.id}`
  const partNumber = request.part_no || request.part_number || '-'
  const displayTitle = isSalesView ? (request.inquiry_id || request.part_name || `Request #${request.id}`) : requestNumber
  const itemImages = getItemImages(request)
  const primaryImage = itemImages[0] || null
  const imageUrl = primaryImage?.url || ''
  const imageName = primaryImage?.name || request.item_image_name || ''
  const attachmentUrl = request.attachment_url || ''
  const attachmentName = request.attachment_name || ''
  const notes = request.notes || ''
  const agingDays = getAgingDays(request)
  const requestForDisplay = { ...request, aging_days: agingDays }
  const workflowLabel = getWorkflowLabel(request.status)

  return (
    <main className="p-margin-edge space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-outline-variant bg-white px-6 py-5 shadow-sm lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm text-on-surface-variant">
            Item Request <span className="mx-2">/</span> Detail Item Request
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-primary">{displayTitle}</h1>
            <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${getStatusClasses(status)}`}>
              {status}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${isSalesView ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
              {isSalesView ? 'Mode Sales' : 'Mode Purchasing'}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${getWorkflowClasses(request.status)}`}>
              {workflowLabel}
            </span>
          </div>
          {!isSalesView && (
            <p className="mt-2 text-sm text-on-surface-variant">
              Part Number: <span className="font-semibold text-on-surface">{partNumber}</span>
            </p>
          )}
          {canViewVendorInternal(user?.role) && (
            <p className="mt-1 text-sm text-on-surface-variant">
              Vendor: <span className="font-semibold text-on-surface">{request.vendor_name || '-'}</span>
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          {canEditInquiryData(user?.role) && request.status !== 'approved' && (
            <Link
              to={`/requests/${id}/edit`}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-label-md font-medium text-white hover:bg-primary-container"
            >
              <span className="material-symbols-outlined text-sm">edit_square</span>
              Edit Item Request
            </Link>
          )}
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
          {primarySections.map((section) => (
            <DetailCard key={section.title} title={section.title} icon={section.icon}>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {section.fields.map((field) => {
                  const actualKey = findKey(requestForDisplay, field.keys)
                  const value = actualKey ? requestForDisplay[actualKey] : ''

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
          ))}

          {!isSalesView && (
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
          )}
        </div>

        <div className="space-y-6">
          <DetailCard title="Gambar Item & Lampiran" icon="image">
            {imageUrl ? (
              <>
                <img
                  src={imageUrl}
                  alt={request.part_name || 'Gambar item'}
                  className="h-64 w-full rounded-xl object-cover"
                />
                <p className="mt-3 text-xs text-on-surface-variant">
                  File gambar: <span className="font-medium text-on-surface">{imageName || 'Tanpa nama file'}</span>
                </p>
                {itemImages.length > 1 && (
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {itemImages.map((image, imageIndex) => (
                      <a
                        key={`${image.url}-${imageIndex}`}
                        href={image.url}
                        target="_blank"
                        rel="noreferrer"
                        className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest"
                      >
                        <img
                          src={image.url}
                          alt={image.name || `Gambar ${imageIndex + 1}`}
                          className="h-24 w-full object-cover"
                        />
                        <div className="px-3 py-2 text-xs text-on-surface-variant">
                          {image.name || `Gambar ${imageIndex + 1}`}
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex h-64 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-lowest text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl">image_not_supported</span>
                <p className="mt-2 text-sm font-medium">Belum ada gambar item</p>
                <p className="mt-1 max-w-[220px] text-xs">
                  Upload gambar dari registrasi item baru atau detail item request purchasing.
                </p>
              </div>
            )}

            <div className="mt-4 space-y-3">
              <div className="rounded-xl bg-surface-container-lowest p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">Lampiran</p>
                {attachmentUrl ? (
                  <a
                    href={attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    download={attachmentName || undefined}
                    className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                  >
                    <span className="material-symbols-outlined text-sm">attach_file</span>
                    {attachmentName || 'Buka Lampiran'}
                  </a>
                ) : (
                  <p className="mt-2 text-sm text-on-surface">-</p>
                )}
              </div>
              <div className="rounded-xl bg-surface-container-lowest p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">Catatan</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-on-surface">{notes || '-'}</p>
              </div>
            </div>
          </DetailCard>

          <DetailCard title={sideSection.title} icon={sideSection.icon}>
            <div className="space-y-4">
              {sideSection.fields.map((field) => {
                const actualKey = findKey(requestForDisplay, field.keys)
                const value = actualKey ? requestForDisplay[actualKey] : ''

                return (
                  <div key={field.label} className="rounded-xl bg-surface-container-lowest p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
                      {field.label}
                    </p>
                    {field.label === 'Aging Days' ? (
                      <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getAgingBadgeClasses(value)}`}>
                        {formatValue(actualKey || '', value)}
                      </span>
                    ) : field.label === 'Tahap Workflow' ? (
                      <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getWorkflowClasses(value)}`}>
                        {getWorkflowLabel(value)}
                      </span>
                    ) : (
                      <p className="mt-2 break-words text-sm font-semibold text-on-surface">
                        {formatValue(actualKey || '', value)}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </DetailCard>

          {!isSalesView && (
            <DetailCard title="Aksi Tahap Proses" icon="task_alt">
              <div className="space-y-4">
                {workflowMessage && (
                  <div className="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface">
                    {workflowMessage}
                  </div>
                )}
                <p className="text-sm text-on-surface-variant">
                  Review tahap proses dipindahkan ke halaman detail agar daftar item request tetap rapi dan konsisten.
                </p>

                {request.status === 'validation' && (
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => handleWorkflowAction('validate', 'approve')}
                      className="rounded-lg bg-green-100 px-4 py-2 text-sm font-semibold text-green-800 hover:bg-green-200"
                    >
                      Lanjut ke Konfirmasi Akhir
                    </button>
                    <button
                      type="button"
                      onClick={() => handleWorkflowAction('validate', 'reject')}
                      className="rounded-lg bg-red-100 px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-200"
                    >
                      Kembalikan
                    </button>
                  </div>
                )}

                {request.status === 'approval' && (
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => handleWorkflowAction('approve', 'approve')}
                      className="rounded-lg bg-green-100 px-4 py-2 text-sm font-semibold text-green-800 hover:bg-green-200"
                    >
                      Tandai Selesai
                    </button>
                    <button
                      type="button"
                      onClick={() => handleWorkflowAction('approve', 'reject')}
                      className="rounded-lg bg-red-100 px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-200"
                    >
                      Kembalikan
                    </button>
                  </div>
                )}

                {!['validation', 'approval'].includes(request.status) && (
                  <div className="rounded-xl bg-surface-container-lowest px-4 py-3 text-sm text-on-surface">
                    Tidak ada aksi lanjutan untuk tahap <span className="font-semibold">{workflowLabel}</span>.
                  </div>
                )}
              </div>
            </DetailCard>
          )}

          {canViewSensitivePricing(user?.role) && canEditPricing(user?.role) && (
            <DetailCard title="Edit Pricing Sales & Status" icon="edit_square">
              <form onSubmit={handlePricingSave} className="space-y-4">
                {pricingMessage && (
                  <div className="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface">
                    {pricingMessage}
                  </div>
                )}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant">Status ID</label>
                    <input
                      type="text"
                      name="statusId"
                      value={pricingForm.statusId}
                      onChange={handlePricingChange}
                      className="mt-2 w-full rounded-lg border border-outline-variant px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant">PO Process</label>
                    <input
                      type="text"
                      name="poProcess"
                      value={pricingForm.poProcess}
                      onChange={handlePricingChange}
                      className="mt-2 w-full rounded-lg border border-outline-variant px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant">PO Number</label>
                    <input
                      type="text"
                      name="poNumber"
                      value={pricingForm.poNumber}
                      onChange={handlePricingChange}
                      className="mt-2 w-full rounded-lg border border-outline-variant px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant">PO Date</label>
                    <input
                      type="date"
                      name="poDate"
                      value={pricingForm.poDate}
                      onChange={handlePricingChange}
                      className="mt-2 w-full rounded-lg border border-outline-variant px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant">Vendor ID</label>
                    <input
                      type="text"
                      name="vendorId"
                      value={pricingForm.vendorId}
                      onChange={handlePricingChange}
                      className="mt-2 w-full rounded-lg border border-outline-variant px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant">Vendor Name</label>
                    <input
                      type="text"
                      name="vendorName"
                      value={pricingForm.vendorName}
                      onChange={handlePricingChange}
                      className="mt-2 w-full rounded-lg border border-outline-variant px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant">Category Part</label>
                    <input
                      type="text"
                      name="categoryPart"
                      value={pricingForm.categoryPart}
                      onChange={handlePricingChange}
                      className="mt-2 w-full rounded-lg border border-outline-variant px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant">Currency</label>
                    <input
                      type="text"
                      name="currency"
                      value={pricingForm.currency}
                      onChange={handlePricingChange}
                      className="mt-2 w-full rounded-lg border border-outline-variant px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant">ATPM Price</label>
                    <input
                      type="text"
                      name="atpmPrice"
                      value={pricingForm.atpmPrice}
                      onChange={handlePricingChange}
                      className="mt-2 w-full rounded-lg border border-outline-variant px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant">Cost Price</label>
                    <input
                      type="text"
                      name="costPrice"
                      value={pricingForm.costPrice}
                      onChange={handlePricingChange}
                      className="mt-2 w-full rounded-lg border border-outline-variant px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant">Selling Price</label>
                    <input
                      type="text"
                      name="sellingPrice"
                      value={pricingForm.sellingPrice}
                      onChange={handlePricingChange}
                      className="mt-2 w-full rounded-lg border border-outline-variant px-3 py-2"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-on-surface-variant">Data Status</label>
                    <select
                      name="dataStatus"
                      value={pricingForm.dataStatus}
                      onChange={handlePricingChange}
                      className="mt-2 w-full rounded-lg border border-outline-variant px-3 py-2"
                    >
                      <option value="Tidak Complete">Tidak Complete</option>
                      <option value="Complete">Complete</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-on-surface-variant">Status Reason</label>
                    <textarea
                      name="statusReason"
                      value={pricingForm.statusReason}
                      onChange={handlePricingChange}
                      rows={3}
                      className="mt-2 w-full rounded-lg border border-outline-variant px-3 py-2"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-on-surface-variant">Progress Note</label>
                    <textarea
                      name="progressNotes"
                      value={pricingForm.progressNotes}
                      onChange={handlePricingChange}
                      rows={4}
                      className="mt-2 w-full rounded-lg border border-outline-variant px-3 py-2"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-on-surface-variant">HPP (IDR)</label>
                    <div className="mt-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm font-medium text-on-surface">
                      {hppPreview || '-'}
                    </div>
                    <p className="mt-2 text-xs text-on-surface-variant">
                      HPP dihitung otomatis di backend mengikuti 100% dari cost price.
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-on-surface-variant">Update Date</label>
                    <input
                      type="date"
                      name="updateDate"
                      value={pricingForm.updateDate}
                      onChange={handlePricingChange}
                      className="mt-2 w-full rounded-lg border border-outline-variant px-3 py-2"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={savingPricing}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-container disabled:opacity-60"
                >
                  <span className={`material-symbols-outlined text-sm ${savingPricing ? 'animate-spin' : ''}`}>
                    {savingPricing ? 'progress_activity' : 'save'}
                  </span>
                  Simpan Pricing Sales
                </button>
              </form>
            </DetailCard>
          )}
        </div>
      </div>
    </main>
  )
}

export default RequestDetail
