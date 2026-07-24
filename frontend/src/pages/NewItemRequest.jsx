import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Link, useLocation, useNavigate } from 'react-router-dom'

function findFirstValue(source, keys) {
  if (!source) {
    return ''
  }

  const match = keys.find((key) => source[key] !== undefined && source[key] !== null && source[key] !== '')
  return match ? String(source[match]).trim() : ''
}

function buildInitialFormData(source = {}) {
  return {
    inquiryId: source.inquiryNumber || '',
    customer: source.customer || '',
    partNo: source.partNumber || '',
    partName: source.partName || '',
    brand: source.brand || '',
    model: source.model || '',
    seriesType: source.seriesType || '',
    year: source.year || '',
    workshopName: source.workshopName || '',
    vin: source.vin || '',
    dataStatus: source.dataStatus || 'Tidak Complete',
    vendorId: source.vendorId || '',
    vendorName: source.vendorName || '',
    categoryPart: source.categoryPart || '',
    currency: source.currency || 'IDR',
    atpmPrice: source.atpmPrice || '',
    costPrice: source.costPrice || '',
    hppIdr: source.hppIdr || '',
    updateDate: source.updateDate || new Date().toISOString().split('T')[0],
    itemImageUrl: source.itemImageUrl || '',
    itemImageName: source.itemImageName || '',
    itemImageMimeType: source.itemImageMimeType || '',
    attachmentUrl: source.attachmentUrl || '',
    attachmentName: source.attachmentName || '',
    attachmentMimeType: source.attachmentMimeType || '',
    notes: source.notes || ''
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Gagal membaca file'))
    reader.readAsDataURL(file)
  })
}

function NewItemRequest() {
  const navigate = useNavigate()
  const location = useLocation()
  const inquirySource = location.state?.inquiry
  const [formData, setFormData] = useState(() => buildInitialFormData(inquirySource))
  const [brands, setBrands] = useState([])
  const [vendors, setVendors] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    const loadReferences = async () => {
      try {
        const [brandsResponse, vendorsResponse] = await Promise.all([
          axios.get('/api/brands'),
          axios.get('/api/vendors', {
            params: {
              limit: 500
            }
          })
        ])

        setBrands(brandsResponse.data || [])

        const vendorRows = Array.isArray(vendorsResponse.data?.data)
          ? vendorsResponse.data.data
          : Array.isArray(vendorsResponse.data)
            ? vendorsResponse.data
            : []

        const normalizedVendors = vendorRows
          .map((vendor) => ({
            id: findFirstValue(vendor, ['Vendor_ID', 'Vendor ID', 'vendor_id']),
            name: findFirstValue(vendor, ['Vendor_Name', 'Vendor Name', 'Vendor Name ', 'vendor_name']),
            category: findFirstValue(vendor, ['Category', 'Category_', 'category', 'Category_Part']),
            suppliedBrands: findFirstValue(vendor, ['Supplied_Brands', 'Supplied Brands', 'supplied_brands'])
          }))
          .filter((vendor) => vendor.id || vendor.name)
          .sort((left, right) => left.name.localeCompare(right.name))

        setVendors(normalizedVendors)
      } catch (err) {
        console.error('Error fetching reference data:', err)
      }
    }

    loadReferences()
  }, [])

  useEffect(() => {
    setFormData(buildInitialFormData(inquirySource))
  }, [inquirySource])

  const selectedVendorOption = useMemo(() => {
    if (!formData.vendorId && !formData.vendorName) {
      return ''
    }

    return `${formData.vendorId}||${formData.vendorName}`
  }, [formData.vendorId, formData.vendorName])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleVendorSelect = (e) => {
    const selectedKey = e.target.value

    if (!selectedKey) {
      return
    }

    const selectedVendor = vendors.find((vendor) => `${vendor.id}||${vendor.name}` === selectedKey)
    if (!selectedVendor) {
      return
    }

    setFormData((prev) => ({
      ...prev,
      vendorId: selectedVendor.id || prev.vendorId,
      vendorName: selectedVendor.name || prev.vendorName,
      categoryPart: prev.categoryPart || selectedVendor.category || ''
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
      console.error('Error reading file:', err)
      setSubmitError('File gagal dibaca. Coba pilih file lain.')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')

    if (!formData.inquiryId || !formData.partNo || !formData.partName || !formData.brand || !formData.model || !formData.vendorName) {
      setSubmitError('Inquiry ID, Part Number, Nama Part, Brand, Model, dan Vendor wajib diisi.')
      return
    }

    setIsSubmitting(true)
    try {
      await axios.post('/api/new-item-request', {
        inquiryId: formData.inquiryId,
        customer: formData.customer,
        partNo: formData.partNo,
        partName: formData.partName,
        brand: formData.brand,
        model: formData.model,
        seriesType: formData.seriesType,
        year: formData.year,
        workshopName: formData.workshopName,
        vin: formData.vin,
        dataStatus: formData.dataStatus,
        vendorId: formData.vendorId,
        vendorName: formData.vendorName,
        categoryPart: formData.categoryPart,
        currency: formData.currency,
        atpmPrice: formData.atpmPrice,
        costPrice: formData.costPrice,
        hppIdr: formData.hppIdr,
        updateDate: formData.updateDate,
        itemImageUrl: formData.itemImageUrl,
        itemImageName: formData.itemImageName,
        itemImageMimeType: formData.itemImageMimeType,
        attachmentUrl: formData.attachmentUrl,
        attachmentName: formData.attachmentName,
        attachmentMimeType: formData.attachmentMimeType,
        notes: formData.notes
      })
      setSubmitSuccess(true)
      setTimeout(() => {
        navigate('/requests')
      }, 2000)
    } catch (err) {
      console.error('Error submitting request:', err)
      setSubmitError(err.response?.data?.error || 'Gagal mengirim request. Coba lagi setelah backend aktif.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-surface px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto mb-8 grid max-w-5xl grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { step: 1, label: 'Input Inquiry', active: false },
          { step: 2, label: 'Cek Master', active: false },
          { step: 3, label: 'Permintaan Item Baru', active: true },
          { step: 4, label: 'Master Update', active: false }
        ].map((item) => (
          <div
            key={item.step}
            className={`rounded-2xl border px-4 py-4 text-center ${
              item.active
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-outline-variant bg-white'
            }`}
          >
            <div
              className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full border-2 text-sm font-bold ${
                item.active
                  ? 'border-primary bg-primary text-white'
                  : 'border-outline-variant bg-white text-outline'
              }`}
            >
              {item.step}
            </div>
            <p className={`mt-3 text-xs font-medium sm:text-sm ${item.active ? 'font-bold text-primary' : 'text-on-surface-variant'}`}>
              {item.label}
            </p>
          </div>
        ))}
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_340px]">
        <div className="rounded-xl bg-error-container p-4 text-on-error-container sm:p-5 xl:col-span-2">
          <span className="material-symbols-outlined text-error">info</span>
          <div>
            <p className="font-bold text-body-lg">Item Tidak Terdaftar</p>
            <p className="text-body-md opacity-80">
              Lengkapi request item baru sedetail mungkin agar validator dan approver bisa melihat data item, vendor, harga, dan lampiran secara lengkap.
            </p>
          </div>
        </div>

        {inquirySource && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 xl:col-span-2">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-primary">Data dibawa dari Input Inquiry</p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Inquiry: <span className="font-semibold text-on-surface">{inquirySource.inquiryNumber || '-'}</span>
                  {' '}| Part Number: <span className="font-semibold text-on-surface">{inquirySource.partNumber || '-'}</span>
                  {' '}| Customer: <span className="font-semibold text-on-surface">{inquirySource.customer || '-'}</span>
                </p>
              </div>
              <Link
                to="/inquiries/new"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Kembali ke Input Inquiry
              </Link>
            </div>
          </div>
        )}

        <div className="form-card rounded-xl p-5 shadow-sm sm:p-8">
          <div className="mb-8 flex flex-col gap-4 border-b border-surface-variant pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface">Data Registrasi Item Baru</h3>
              <p className="text-body-md text-on-surface-variant">
                Form ini sekarang menampung detail item lengkap agar tampilan detail request bisa setara dengan detail master item.
              </p>
            </div>
            <div className="w-fit rounded-full bg-secondary-container px-3 py-1 text-xs font-bold uppercase text-on-secondary-container">
              Draft Lengkap
            </div>
          </div>

          {submitError && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <section>
              <div className="mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined scale-75 text-primary">verified_user</span>
                <h4 className="font-label-md text-label-md uppercase tracking-wide text-primary">Validasi, Identitas, dan Spesifikasi</h4>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="space-y-2">
                  <label className="block font-label-md text-label-md text-on-surface-variant">Inquiry ID *</label>
                  <input
                    type="text"
                    name="inquiryId"
                    value={formData.inquiryId}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-outline-variant bg-white p-2 text-body-md focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="Contoh: INQ-2026-00080"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block font-label-md text-label-md text-on-surface-variant">Customer</label>
                  <input
                    type="text"
                    name="customer"
                    value={formData.customer}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-outline-variant bg-white p-2 text-body-md focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="Nama customer / internal"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block font-label-md text-label-md text-on-surface-variant">Data Status</label>
                  <select
                    name="dataStatus"
                    value={formData.dataStatus}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-outline-variant bg-white p-2 text-body-md focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="Tidak Complete">Tidak Complete</option>
                    <option value="Complete">Complete</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block font-label-md text-label-md text-on-surface-variant">Part Number *</label>
                  <input
                    type="text"
                    name="partNo"
                    value={formData.partNo}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-outline-variant bg-white p-2 text-body-md focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="Masukkan nomor part"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block font-label-md text-label-md text-on-surface-variant">Nama Part *</label>
                  <input
                    type="text"
                    name="partName"
                    value={formData.partName}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-outline-variant bg-white p-2 text-body-md focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="Contoh: Water Pump"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block font-label-md text-label-md text-on-surface-variant">Workshop Name</label>
                  <input
                    type="text"
                    name="workshopName"
                    value={formData.workshopName}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-outline-variant bg-white p-2 text-body-md focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="Contoh: ATPM Workshop"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block font-label-md text-label-md text-on-surface-variant">Brand *</label>
                  <select
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-outline-variant bg-white p-2 text-body-md focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Pilih Brand</option>
                    {brands.map((brand) => (
                      <option key={brand.id || brand.name} value={brand.name}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block font-label-md text-label-md text-on-surface-variant">Model *</label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-outline-variant bg-white p-2 text-body-md focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="Contoh: Levante"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block font-label-md text-label-md text-on-surface-variant">Series / Type</label>
                  <input
                    type="text"
                    name="seriesType"
                    value={formData.seriesType}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-outline-variant bg-white p-2 text-body-md focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="Contoh: S"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block font-label-md text-label-md text-on-surface-variant">Year</label>
                  <input
                    type="text"
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-outline-variant bg-white p-2 text-body-md focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="Contoh: 2021"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block font-label-md text-label-md text-on-surface-variant">Nomor VIN (Chassis)</label>
                  <input
                    type="text"
                    name="vin"
                    value={formData.vin}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-outline-variant bg-white p-2 text-body-md focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="17 digit karakter"
                  />
                </div>
              </div>
            </section>

            <section>
              <div className="mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined scale-75 text-primary">storefront</span>
                <h4 className="font-label-md text-label-md uppercase tracking-wide text-primary">Vendor, Kategori, dan Harga</h4>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="space-y-2 xl:col-span-3">
                  <label className="block font-label-md text-label-md text-on-surface-variant">Pilih Vendor dari Master</label>
                  <select
                    value={selectedVendorOption}
                    onChange={handleVendorSelect}
                    className="w-full rounded-lg border border-outline-variant bg-white p-2 text-body-md focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Pilih vendor untuk mengisi otomatis Vendor ID / Vendor Name</option>
                    {vendors.map((vendor) => (
                      <option key={`${vendor.id}-${vendor.name}`} value={`${vendor.id}||${vendor.name}`}>
                        {vendor.id ? `${vendor.id} - ` : ''}{vendor.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block font-label-md text-label-md text-on-surface-variant">Vendor ID</label>
                  <input
                    type="text"
                    name="vendorId"
                    value={formData.vendorId}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-outline-variant bg-white p-2 text-body-md focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="Contoh: KWJ"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block font-label-md text-label-md text-on-surface-variant">Vendor Name *</label>
                  <input
                    type="text"
                    name="vendorName"
                    value={formData.vendorName}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-outline-variant bg-white p-2 text-body-md focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="Nama vendor"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block font-label-md text-label-md text-on-surface-variant">Category Part</label>
                  <input
                    type="text"
                    name="categoryPart"
                    value={formData.categoryPart}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-outline-variant bg-white p-2 text-body-md focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="Contoh: Brake"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block font-label-md text-label-md text-on-surface-variant">Currency</label>
                  <input
                    type="text"
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-outline-variant bg-white p-2 text-body-md focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="Contoh: IDR / USD"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block font-label-md text-label-md text-on-surface-variant">ATPM Price</label>
                  <input
                    type="text"
                    name="atpmPrice"
                    value={formData.atpmPrice}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-outline-variant bg-white p-2 text-body-md focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="Contoh: Barang Non ATPM / 100.00"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block font-label-md text-label-md text-on-surface-variant">Cost Price</label>
                  <input
                    type="text"
                    name="costPrice"
                    value={formData.costPrice}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-outline-variant bg-white p-2 text-body-md focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="Contoh: 100.00"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block font-label-md text-label-md text-on-surface-variant">HPP (IDR)</label>
                  <input
                    type="text"
                    name="hppIdr"
                    value={formData.hppIdr}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-outline-variant bg-white p-2 text-body-md focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="Contoh: Rp1,794,245"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block font-label-md text-label-md text-on-surface-variant">Update Date</label>
                  <input
                    type="date"
                    name="updateDate"
                    value={formData.updateDate}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-outline-variant bg-white p-2 text-body-md focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </section>

            <section>
              <div className="mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined scale-75 text-primary">image</span>
                <h4 className="font-label-md text-label-md uppercase tracking-wide text-primary">Gambar Item dan Lampiran</h4>
              </div>
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_320px]">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <label className="block font-label-md text-label-md text-on-surface-variant">Upload Gambar Item</label>
                    <input
                      type="file"
                      name="itemImageFile"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="w-full rounded-lg border border-outline-variant bg-white p-2 text-body-md file:mr-4 file:rounded file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:font-medium file:text-primary"
                    />
                    {formData.itemImageName && (
                      <p className="text-xs text-on-surface-variant">File terpilih: {formData.itemImageName}</p>
                    )}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="block font-label-md text-label-md text-on-surface-variant">URL Gambar Item</label>
                    <input
                      type="url"
                      name="itemImageUrl"
                      value={formData.itemImageUrl}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-outline-variant bg-white p-2 text-body-md focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="block font-label-md text-label-md text-on-surface-variant">Upload Dokumen / Lampiran</label>
                    <input
                      type="file"
                      name="attachmentFile"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
                      onChange={handleFileUpload}
                      className="w-full rounded-lg border border-outline-variant bg-white p-2 text-body-md file:mr-4 file:rounded file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:font-medium file:text-primary"
                    />
                    {formData.attachmentName && (
                      <p className="text-xs text-on-surface-variant">File terpilih: {formData.attachmentName}</p>
                    )}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="block font-label-md text-label-md text-on-surface-variant">URL Dokumen / Lampiran</label>
                    <input
                      type="url"
                      name="attachmentUrl"
                      value={formData.attachmentUrl}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-outline-variant bg-white p-2 text-body-md focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="block font-label-md text-label-md text-on-surface-variant">Catatan</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full rounded-lg border border-outline-variant bg-white p-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="Tambahkan catatan teknis, remark vendor, atau informasi penting lainnya."
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Preview Gambar Item</p>
                  {formData.itemImageUrl ? (
                    <img
                      src={formData.itemImageUrl}
                      alt={formData.partName || 'Preview item'}
                      className="mt-3 h-64 w-full rounded-xl object-cover"
                    />
                  ) : (
                    <div className="mt-3 flex h-64 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-outline-variant bg-white text-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-4xl">image</span>
                      <p className="mt-2 text-sm font-medium">Belum ada gambar item</p>
                      <p className="mt-1 max-w-[220px] text-xs">Masukkan URL gambar agar preview dan halaman detail bisa menampilkan foto item.</p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-6">
              <div className="mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined scale-75 text-primary">assignment_turned_in</span>
                <h4 className="font-label-md text-label-md uppercase tracking-wide text-primary">Alur Approval</h4>
              </div>
              <p className="text-body-md text-on-surface-variant">
                Setelah request dikirim, detail item lengkap termasuk vendor, harga, dan gambar akan tampil di area `Requests` untuk validation dan approval.
              </p>
            </section>

            <div className="flex flex-col-reverse gap-3 pt-6 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={() => navigate('/inquiries/new')}
                className="w-full rounded border border-primary px-6 py-2.5 font-bold text-primary transition-colors hover:bg-primary/5 sm:w-auto"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex w-full items-center justify-center gap-2 rounded px-8 py-2.5 font-bold text-white shadow-lg transition-all hover:shadow-xl sm:w-auto ${submitSuccess ? 'bg-green-600' : 'bg-primary-container'}`}
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">sync</span>
                    Mengirim...
                  </>
                ) : submitSuccess ? (
                  <>
                    <span className="material-symbols-outlined">check_circle</span>
                    Berhasil!
                  </>
                ) : (
                  <>
                    <span>Kirim Request Lengkap</span>
                    <span className="material-symbols-outlined">send</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="form-card rounded-xl p-6">
            <h5 className="mb-4 flex items-center gap-2 font-label-md text-label-md">
              <span className="material-symbols-outlined text-on-tertiary-fixed-variant">lightbulb</span>
              Panduan Pengisian
            </h5>
            <ul className="space-y-4 text-body-md text-on-surface-variant">
              <li className="flex gap-3">
                <span className="font-bold text-primary">•</span>
                <p>Isi `Vendor Name`, `Category Part`, dan harga sedekat mungkin dengan referensi vendor yang tersedia.</p>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-primary">•</span>
                <p>Anda bisa upload file langsung atau isi URL manual untuk gambar dan lampiran.</p>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-primary">•</span>
                <p>Jika vendor dipilih dari master vendor, `Vendor ID` dan `Vendor Name` akan terisi lebih cepat.</p>
              </li>
            </ul>
          </div>

          <div className="form-card rounded-xl border-primary/20 bg-on-primary-fixed/5 p-6">
            <h5 className="mb-4 font-label-md text-label-md text-primary">Ringkasan Draft</h5>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4 rounded border border-outline-variant/30 bg-white p-3">
                <span className="text-on-surface-variant">Part</span>
                <span className="text-right font-semibold text-on-surface">{formData.partName || '-'}</span>
              </div>
              <div className="flex justify-between gap-4 rounded border border-outline-variant/30 bg-white p-3">
                <span className="text-on-surface-variant">Vendor</span>
                <span className="text-right font-semibold text-on-surface">{formData.vendorName || '-'}</span>
              </div>
              <div className="flex justify-between gap-4 rounded border border-outline-variant/30 bg-white p-3">
                <span className="text-on-surface-variant">Harga</span>
                <span className="text-right font-semibold text-on-surface">{formData.hppIdr || formData.costPrice || formData.atpmPrice || '-'}</span>
              </div>
              <div className="flex justify-between gap-4 rounded border border-outline-variant/30 bg-white p-3">
                <span className="text-on-surface-variant">Gambar</span>
                <span className="text-right font-semibold text-on-surface">{formData.itemImageUrl ? (formData.itemImageName || 'Siap ditampilkan') : 'Belum ada'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default NewItemRequest
