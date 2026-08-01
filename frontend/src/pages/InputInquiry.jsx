import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { canManageMasterItems, isSalesRole } from '../utils/rbac'

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Gagal membaca file'))
    reader.readAsDataURL(file)
  })
}

function InputInquiry() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()
  const isEditMode = Boolean(id)
  const isSalesMode = isSalesRole(user?.role)
  const canManagePricing = canManageMasterItems(user?.role)
  const [brands, setBrands] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingRequest, setLoadingRequest] = useState(false)
  const [submitMessage, setSubmitMessage] = useState({ type: '', text: '' })
  const [formData, setFormData] = useState({
    inquiryId: '',
    inquiryDate: new Date().toISOString().split('T')[0],
    salesName: user?.username || '',
    customer: '',
    customerType: 'Bengkel',
    brand: '',
    model: '',
    seriesType: '',
    year: '',
    partNumber: '',
    partName: '',
    quantity: 1,
    uom: 'PCS',
    vin: '',
    dataStatus: 'Tidak Complete',
    statusReason: '',
    progressNotes: '',
    statusId: '',
    poProcess: '',
    poNumber: '',
    poDate: '',
    vendorId: '',
    vendorName: '',
    categoryPart: '',
    currency: 'IDR',
    atpmPrice: '',
    costPrice: '',
    sellingPrice: '',
    updateDate: new Date().toISOString().split('T')[0],
    notes: '',
    itemImageUrl: '',
    itemImageName: '',
    itemImageMimeType: '',
    attachmentUrl: '',
    attachmentName: '',
    attachmentMimeType: ''
  })

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      salesName: prev.salesName || user?.username || ''
    }))
  }, [user?.username])

  useEffect(() => {
    const loadBrands = async () => {
      try {
        const response = await axios.get('/api/brands')
        setBrands(response.data || [])
      } catch (err) {
        console.error('Error fetching brands:', err)
      }
    }

    loadBrands()
  }, [])

  useEffect(() => {
    if (!isEditMode) {
      return
    }

    const loadRequest = async () => {
      try {
        setLoadingRequest(true)
        const response = await axios.get(`/api/requests/${id}`)
        const request = response.data

        setFormData((prev) => ({
          ...prev,
          inquiryId: request.inquiry_id || '',
          inquiryDate: request.inquiry_date || new Date().toISOString().split('T')[0],
          salesName: request.sales_name || user?.username || '',
          customer: request.customer || '',
          customerType: request.customer_type || 'Bengkel',
          brand: request.brand || '',
          model: request.model || '',
          seriesType: request.series_type || '',
          year: request.year || '',
          partNumber: request.part_no || '',
          partName: request.part_name || '',
          quantity: request.quantity || 1,
          uom: request.uom || 'PCS',
          vin: request.vin || '',
          dataStatus: request.data_status || 'Tidak Complete',
          statusReason: request.status_reason || '',
          progressNotes: request.progress_notes || '',
          statusId: request.status_id || '',
          poProcess: request.po_process || '',
          poNumber: request.po_number || '',
          poDate: request.po_date || '',
          vendorId: request.vendor_id || '',
          vendorName: request.vendor_name || '',
          categoryPart: request.category_part || '',
          currency: request.currency || 'IDR',
          atpmPrice: request.atpm_price || '',
          costPrice: request.cost_price || '',
          sellingPrice: request.selling_price || '',
          updateDate: request.update_date || new Date().toISOString().split('T')[0],
          notes: request.notes || '',
          itemImageUrl: request.item_image_url || '',
          itemImageName: request.item_image_name || '',
          itemImageMimeType: request.item_image_mime_type || '',
          attachmentUrl: request.attachment_url || '',
          attachmentName: request.attachment_name || '',
          attachmentMimeType: request.attachment_mime_type || ''
        }))
      } catch (err) {
        console.error(err)
        setSubmitMessage({
          type: 'error',
          text: err.response?.data?.error || 'Data request tidak berhasil dimuat.'
        })
      } finally {
        setLoadingRequest(false)
      }
    }

    loadRequest()
  }, [id, isEditMode, user?.username])

  const hppPreview = useMemo(() => {
    if (!formData.costPrice) {
      return '-'
    }

    return formData.costPrice
  }, [formData.costPrice])

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }))
  }

  const handleFileUpload = async (e) => {
    const { name, files } = e.target
    const selectedFile = files?.[0]

    if (!selectedFile) {
      return
    }

    try {
      const dataUrl = await readFileAsDataUrl(selectedFile)

      if (name === 'itemImageFile') {
        setFormData((prev) => ({
          ...prev,
          itemImageUrl: dataUrl,
          itemImageName: selectedFile.name,
          itemImageMimeType: selectedFile.type || 'application/octet-stream'
        }))
        return
      }

      if (name === 'attachmentFile') {
        setFormData((prev) => ({
          ...prev,
          attachmentUrl: dataUrl,
          attachmentName: selectedFile.name,
          attachmentMimeType: selectedFile.type || 'application/octet-stream'
        }))
      }
    } catch (err) {
      console.error(err)
      setSubmitMessage({
        type: 'error',
        text: 'File gagal dibaca. Silakan pilih file lain.'
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.inquiryId || !formData.inquiryDate || !formData.salesName || !formData.customer || !formData.brand || !formData.model || !formData.partName) {
      setSubmitMessage({
        type: 'error',
        text: 'Lengkapi Inquiry ID, Inquiry Date, Sales Name, Customer Name, Nama Part, Brand, dan Model.'
      })
      return
    }

    setIsSubmitting(true)
    setSubmitMessage({ type: '', text: '' })

    try {
      const payload = {
        inquiryId: formData.inquiryId,
        inquiryDate: formData.inquiryDate,
        salesName: formData.salesName,
        customer: formData.customer,
        customerType: formData.customerType,
        partNo: formData.partNumber,
        partName: formData.partName,
        brand: formData.brand,
        model: formData.model,
        seriesType: formData.seriesType,
        year: formData.year,
        quantity: formData.quantity,
        uom: formData.uom,
        vin: formData.vin,
        dataStatus: formData.dataStatus,
        statusReason: formData.statusReason,
        progressNotes: formData.progressNotes,
        statusId: canManagePricing ? formData.statusId : '',
        poProcess: canManagePricing ? formData.poProcess : '',
        poNumber: canManagePricing ? formData.poNumber : '',
        poDate: canManagePricing ? formData.poDate : '',
        vendorId: canManagePricing ? formData.vendorId : '',
        vendorName: canManagePricing ? formData.vendorName : '',
        categoryPart: canManagePricing ? formData.categoryPart : '',
        currency: canManagePricing ? formData.currency : 'IDR',
        atpmPrice: canManagePricing ? formData.atpmPrice : '',
        costPrice: canManagePricing ? formData.costPrice : '',
        sellingPrice: canManagePricing ? formData.sellingPrice : '',
        updateDate: formData.updateDate,
        itemImageUrl: formData.itemImageUrl,
        itemImageName: formData.itemImageName,
        itemImageMimeType: formData.itemImageMimeType,
        attachmentUrl: formData.attachmentUrl,
        attachmentName: formData.attachmentName,
        attachmentMimeType: formData.attachmentMimeType,
        notes: formData.notes
      }

      if (isEditMode) {
        await axios.put(`/api/requests/${id}`, payload)
      } else {
        await axios.post('/api/new-item-request', payload)
      }

      setSubmitMessage({
        type: 'success',
        text: isEditMode
          ? 'Item request berhasil diperbarui.'
          : 'Item request berhasil disimpan.'
      })

      setTimeout(() => {
        navigate(isEditMode ? `/requests/${id}` : '/requests')
      }, 1200)
    } catch (err) {
      console.error(err)
      setSubmitMessage({
        type: 'error',
        text: err.response?.data?.error || 'Gagal menyimpan inquiry. Pastikan backend aktif.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getMessageClasses = () => {
    if (submitMessage.type === 'success') {
      return 'border-green-200 bg-green-50 text-green-800'
    }

    if (submitMessage.type === 'error') {
      return 'border-red-200 bg-red-50 text-red-800'
    }

    return 'border-outline-variant bg-white text-on-surface'
  }

  if (loadingRequest) {
    return (
      <main className="min-h-[calc(100vh-64px)] bg-background p-8">
        <div className="mx-auto flex max-w-3xl items-center justify-center rounded-2xl border border-outline-variant bg-white px-6 py-16 shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <span className="material-symbols-outlined animate-spin text-4xl text-primary">refresh</span>
            <p className="text-sm text-on-surface-variant">Memuat data inquiry...</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-background p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl border border-outline-variant bg-white px-6 py-5 shadow-sm">
          <span className="text-[12px] uppercase tracking-[0.2em] font-bold text-primary/60">
            {isSalesMode ? 'Sales Inquiry' : 'Purchasing Input'}
          </span>
          <h1 className="mt-2 text-3xl font-bold text-primary">
            {isEditMode ? (isSalesMode ? 'Edit Input Inquiry' : 'Edit Item Request') : isSalesMode ? 'Input Inquiry' : 'Input Item Request'}
          </h1>
          <p className="mt-2 max-w-4xl text-sm text-on-surface-variant">
            {isSalesMode
              ? 'Sales hanya menginput kebutuhan customer, melampirkan bukti pendukung, dan melihat final selling price yang ditentukan purchasing.'
              : 'Purchasing dapat membuat item request baru sekaligus melengkapi vendor, ATPM, cost, HPP, final selling price, serta status kelengkapan data.'}
          </p>
        </div>

        {submitMessage.text && (
          <div className={`rounded-2xl border px-5 py-4 text-sm font-medium ${getMessageClasses()}`}>
            {submitMessage.text}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="rounded-2xl border border-outline-variant bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined">assignment</span>
                <h2 className="text-lg font-semibold">Registrasi Data Baru</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant">Inquiry ID *</label>
                  <input name="inquiryId" value={formData.inquiryId} onChange={handleChange} className="mt-2 w-full rounded-lg border border-outline-variant px-4 py-2.5" placeholder="Input manual sesuai kebutuhan" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant">Inquiry Date *</label>
                  <input type="date" name="inquiryDate" value={formData.inquiryDate} onChange={handleChange} className="mt-2 w-full rounded-lg border border-outline-variant px-4 py-2.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant">Sales Name *</label>
                  <input name="salesName" value={formData.salesName} onChange={handleChange} className="mt-2 w-full rounded-lg border border-outline-variant px-4 py-2.5" placeholder="Nama sales" />
                </div>
                <div className="md:col-span-2 xl:col-span-3">
                  <label className="block text-sm font-medium text-on-surface-variant">Customer Name *</label>
                  <input name="customer" value={formData.customer} onChange={handleChange} className="mt-2 w-full rounded-lg border border-outline-variant px-4 py-2.5" placeholder="Nama customer / calon client" />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-outline-variant bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined">precision_manufacturing</span>
                <h2 className="text-lg font-semibold">Detail Item</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant">Part Number</label>
                  <input name="partNumber" value={formData.partNumber} onChange={handleChange} className="mt-2 w-full rounded-lg border border-outline-variant px-4 py-2.5 font-mono" placeholder="Opsional jika diketahui" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant">Nama Part *</label>
                  <input name="partName" value={formData.partName} onChange={handleChange} className="mt-2 w-full rounded-lg border border-outline-variant px-4 py-2.5" placeholder="Nama part yang dicari" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant">Brand *</label>
                  <select name="brand" value={formData.brand} onChange={handleChange} className="mt-2 w-full rounded-lg border border-outline-variant px-4 py-2.5">
                    <option value="">Pilih Brand</option>
                    {brands.map((brand) => (
                      <option key={brand.id || brand.name} value={brand.name}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant">Model *</label>
                  <input name="model" value={formData.model} onChange={handleChange} className="mt-2 w-full rounded-lg border border-outline-variant px-4 py-2.5" placeholder="Model unit" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant">Series</label>
                  <input name="seriesType" value={formData.seriesType} onChange={handleChange} className="mt-2 w-full rounded-lg border border-outline-variant px-4 py-2.5" placeholder="Series / type" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant">Year</label>
                  <input name="year" value={formData.year} onChange={handleChange} className="mt-2 w-full rounded-lg border border-outline-variant px-4 py-2.5" placeholder="Tahun" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant">Nomor VIN</label>
                  <input name="vin" value={formData.vin} onChange={handleChange} className="mt-2 w-full rounded-lg border border-outline-variant px-4 py-2.5 uppercase" placeholder="Opsional" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant">Total QTY</label>
                  <input type="number" min="1" name="quantity" value={formData.quantity} onChange={handleChange} className="mt-2 w-full rounded-lg border border-outline-variant px-4 py-2.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant">UOM</label>
                  <input name="uom" value={formData.uom} onChange={handleChange} className="mt-2 w-full rounded-lg border border-outline-variant px-4 py-2.5" placeholder="PCS / SET / UNIT" />
                </div>
              </div>
            </section>

            {canManagePricing && (
              <section className="rounded-2xl border border-outline-variant bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined">payments</span>
                  <h2 className="text-lg font-semibold">Vendor & Harga Internal</h2>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant">Vendor ID</label>
                    <input name="vendorId" value={formData.vendorId} onChange={handleChange} className="mt-2 w-full rounded-lg border border-outline-variant px-4 py-2.5" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant">Vendor Name</label>
                    <input name="vendorName" value={formData.vendorName} onChange={handleChange} className="mt-2 w-full rounded-lg border border-outline-variant px-4 py-2.5" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant">Category Part</label>
                    <input name="categoryPart" value={formData.categoryPart} onChange={handleChange} className="mt-2 w-full rounded-lg border border-outline-variant px-4 py-2.5" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant">ATPM Price</label>
                    <input name="atpmPrice" value={formData.atpmPrice} onChange={handleChange} className="mt-2 w-full rounded-lg border border-outline-variant px-4 py-2.5" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant">Cost Price</label>
                    <input name="costPrice" value={formData.costPrice} onChange={handleChange} className="mt-2 w-full rounded-lg border border-outline-variant px-4 py-2.5" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant">HPP</label>
                    <div className="mt-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-sm font-medium text-on-surface">
                      {hppPreview}
                    </div>
                    <p className="mt-2 text-xs text-on-surface-variant">HPP dihitung otomatis dari cost price di backend.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant">Selling Price</label>
                    <input name="sellingPrice" value={formData.sellingPrice} onChange={handleChange} className="mt-2 w-full rounded-lg border border-outline-variant px-4 py-2.5" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant">Data Status</label>
                    <select name="dataStatus" value={formData.dataStatus} onChange={handleChange} className="mt-2 w-full rounded-lg border border-outline-variant px-4 py-2.5">
                      <option value="Tidak Complete">Tidak Complete</option>
                      <option value="Complete">Complete</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant">Update Date</label>
                    <input type="date" name="updateDate" value={formData.updateDate} onChange={handleChange} className="mt-2 w-full rounded-lg border border-outline-variant px-4 py-2.5" />
                  </div>
                  <div className="md:col-span-2 xl:col-span-3">
                    <label className="block text-sm font-medium text-on-surface-variant">Status Reason</label>
                    <textarea name="statusReason" value={formData.statusReason} onChange={handleChange} rows={3} className="mt-2 w-full rounded-lg border border-outline-variant px-4 py-3" placeholder="Alasan status complete / tidak complete." />
                  </div>
                  <div className="md:col-span-2 xl:col-span-3">
                    <label className="block text-sm font-medium text-on-surface-variant">Progress Note</label>
                    <textarea name="progressNotes" value={formData.progressNotes} onChange={handleChange} rows={4} className="mt-2 w-full rounded-lg border border-outline-variant px-4 py-3" placeholder="Catatan progres untuk sales dan purchasing." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant">Status ID</label>
                    <input name="statusId" value={formData.statusId} onChange={handleChange} className="mt-2 w-full rounded-lg border border-outline-variant px-4 py-2.5" placeholder="Kode status internal" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant">PO Process</label>
                    <input name="poProcess" value={formData.poProcess} onChange={handleChange} className="mt-2 w-full rounded-lg border border-outline-variant px-4 py-2.5" placeholder="Status proses PO" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant">PO Number</label>
                    <input name="poNumber" value={formData.poNumber} onChange={handleChange} className="mt-2 w-full rounded-lg border border-outline-variant px-4 py-2.5" placeholder="Nomor PO" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant">PO Date</label>
                    <input type="date" name="poDate" value={formData.poDate} onChange={handleChange} className="mt-2 w-full rounded-lg border border-outline-variant px-4 py-2.5" />
                  </div>
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-outline-variant bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined">attach_file</span>
                <h2 className="text-lg font-semibold">Gambar Item, Lampiran, dan Catatan</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.5fr)_320px]">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant">Upload Gambar Item</label>
                    <input type="file" name="itemImageFile" accept="image/*" onChange={handleFileUpload} className="mt-2 w-full rounded-lg border border-outline-variant p-2.5 file:mr-4 file:rounded file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:font-medium file:text-primary" />
                    {formData.itemImageName && <p className="mt-2 text-xs text-on-surface-variant">File terpilih: {formData.itemImageName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant">URL Gambar</label>
                    <input type="url" name="itemImageUrl" value={formData.itemImageUrl} onChange={handleChange} className="mt-2 w-full rounded-lg border border-outline-variant px-4 py-2.5" placeholder="https://..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant">Upload Lampiran</label>
                    <input type="file" name="attachmentFile" accept=".pdf,.doc,.docx,.xls,.xlsx,image/*" onChange={handleFileUpload} className="mt-2 w-full rounded-lg border border-outline-variant p-2.5 file:mr-4 file:rounded file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:font-medium file:text-primary" />
                    {formData.attachmentName && <p className="mt-2 text-xs text-on-surface-variant">File terpilih: {formData.attachmentName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant">URL Lampiran</label>
                    <input type="url" name="attachmentUrl" value={formData.attachmentUrl} onChange={handleChange} className="mt-2 w-full rounded-lg border border-outline-variant px-4 py-2.5" placeholder="https://..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant">Catatan</label>
                    <textarea name="notes" value={formData.notes} onChange={handleChange} rows={5} className="mt-2 w-full rounded-lg border border-outline-variant px-4 py-3" placeholder="Catatan utama yang boleh diedit sales maupun purchasing." />
                  </div>
                </div>
                <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Preview Gambar</p>
                  {formData.itemImageUrl ? (
                    <img src={formData.itemImageUrl} alt={formData.partName || 'Preview item'} className="mt-3 h-64 w-full rounded-xl object-cover" />
                  ) : (
                    <div className="mt-3 flex h-64 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-outline-variant bg-white text-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-4xl">image</span>
                      <p className="mt-2 text-sm font-medium">Belum ada gambar</p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => navigate('/requests')}
                className="rounded-lg border border-primary px-6 py-2.5 font-medium text-primary"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 font-medium text-white hover:bg-primary-container disabled:opacity-60"
              >
                <span className={`material-symbols-outlined text-sm ${isSubmitting ? 'animate-spin' : ''}`}>
                  {isSubmitting ? 'progress_activity' : 'save'}
                </span>
                {isSubmitting ? 'Menyimpan...' : isEditMode ? 'Simpan Perubahan' : 'Simpan Item Request'}
              </button>
            </div>
          </form>

          <div className="space-y-6">
            <section className="rounded-2xl border border-outline-variant bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold text-primary">Ringkasan Hak Akses</h3>
              <div className="mt-4 space-y-3 text-sm text-on-surface-variant">
                <div className="rounded-xl bg-surface-container-lowest px-4 py-3">
                  <p className="text-sm font-medium text-on-surface">
                    {isSalesMode
                      ? 'Sales hanya mengubah informasi utama, gambar item, lampiran, dan catatan.'
                      : 'Purchasing dapat mengubah seluruh detail item request termasuk vendor, ATPM, cost, HPP, dan final selling price.'}
                  </p>
                </div>
                <div className="rounded-xl bg-surface-container-lowest px-4 py-3">
                  <p className="text-sm font-medium text-on-surface">ATPM Price, Cost Price, HPP, dan data procurement hanya terlihat untuk purchasing dan admin.</p>
                </div>
                <div className="rounded-xl bg-surface-container-lowest px-4 py-3">
                  <p className="text-sm font-medium text-on-surface">Status utama item request memakai `Data Status`: `Complete` atau `Tidak Complete`.</p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-outline-variant bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold text-primary">Catatan Penting</h3>
              <ul className="mt-4 space-y-3 text-sm text-on-surface-variant">
                <li>Inquiry ID dibuat manual dan tidak lagi mengikuti nomor otomatis.</li>
                <li>Part Number boleh dikosongkan jika belum diketahui.</li>
                <li>Workshop Name tidak ada di form ini karena bukan registrasi master item.</li>
                <li>Master Item tetap menjadi area khusus purchasing untuk part stock dan harga internal.</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}

export default InputInquiry
