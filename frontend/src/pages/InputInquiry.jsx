import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

function InputInquiry() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    inquiryNumber: '',
    inquiryDate: new Date().toISOString().split('T')[0],
    customer: '',
    brand: '',
    model: '',
    vin: '',
    partNumber: '',
    partName: '',
    requestType: 'internal',
    quantity: 1,
    urgency: 'normal'
  })
  
  const [customers, setCustomers] = useState([])
  const [brands, setBrands] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState({
    type: '',
    text: ''
  })
  const [masterCheck, setMasterCheck] = useState({
    loading: false,
    status: 'idle',
    message: 'Masukkan `Part Number`, lalu jalankan pengecekan master item untuk menentukan langkah berikutnya.',
    item: null
  })

  useEffect(() => {
    // Generate dummy inquiry number
    const year = new Date().getFullYear()
    const random = Math.floor(Math.random() * 10000).toString().padStart(5, '0')
    setFormData(prev => ({ ...prev, inquiryNumber: `INQ-${year}-${random}` }))

    // Fetch customers
    fetchCustomers()
    // Fetch brands from data
    fetchBrands()
  }, [])

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('/api/customers')
      setCustomers(response.data)
    } catch (err) {
      console.error('Error fetching customers:', err)
    }
  }

  const fetchBrands = async () => {
    try {
      const response = await axios.get('/api/brands')
      setBrands(response.data)
    } catch (err) {
      console.error('Error fetching brands:', err)
    }
  }

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) : value
    }))
  }

  const handleSubmit = async (e) => {
    if (e?.preventDefault) {
      e.preventDefault()
    }

    if (masterCheck.loading || isSubmitting) {
      return
    }

    if (!formData.customer || !formData.brand || !formData.partNumber || !formData.partName) {
      setSubmitMessage({
        type: 'error',
        text: 'Lengkapi Customer, Brand, Part Number, dan Part Name terlebih dahulu.'
      })
      return
    }

    if (masterCheck.status === 'idle' || masterCheck.status === 'error') {
      setSubmitMessage({
        type: 'error',
        text: 'Lakukan cek master item terlebih dahulu sebelum melanjutkan proses.'
      })
      return
    }

    if (masterCheck.status === 'not_found') {
      setSubmitMessage({
        type: 'info',
        text: 'Item tidak ditemukan di master. Sistem mengarahkan kamu ke Permintaan Item Baru.'
      })
      openNewItemRequest()
      return
    }

    setIsSubmitting(true)
    try {
      // TODO: Submit to backend
      console.log('Form submitted:', formData)
      setSubmitMessage({
        type: 'success',
        text: 'Inquiry siap diproses karena item sudah ditemukan di master.'
      })
    } catch (err) {
      console.error('Error submitting form:', err)
      setSubmitMessage({
        type: 'error',
        text: 'Gagal memproses inquiry. Silakan coba lagi.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const checkMasterItem = async () => {
    if (!formData.partNumber) {
      setMasterCheck({
        loading: false,
        status: 'error',
        message: 'Isi `Part Number` terlebih dahulu sebelum mengecek master item.',
        item: null
      })
      return
    }

    try {
      setMasterCheck({
        loading: true,
        status: 'checking',
        message: 'Sistem sedang mencari part number di master item...',
        item: null
      })

      const response = await axios.get('/api/master-items', {
        params: { search: formData.partNumber }
      })

      const items = Array.isArray(response.data?.data) ? response.data.data : response.data
      const exactMatch = (items || []).find((item) => {
        const partNumber = String(item['Part Number'] || item.part_number || item.partNumber || '').trim().toLowerCase()
        return partNumber === formData.partNumber.trim().toLowerCase()
      })

      if (exactMatch) {
        setMasterCheck({
          loading: false,
          status: 'found',
          message: 'Item ditemukan di master. Gunakan data master item sebagai referensi dan tidak perlu membuat permintaan item baru.',
          item: exactMatch
        })
      } else {
        setMasterCheck({
          loading: false,
          status: 'not_found',
          message: 'Item belum ada di master. Lanjutkan ke Permintaan Item Baru agar masuk ke proses validasi dan approval.',
          item: null
        })
      }
    } catch (err) {
      console.error('Error checking master item:', err)
      setMasterCheck({
        loading: false,
        status: 'error',
        message: 'Gagal mengecek master item. Coba lagi beberapa saat lagi.',
        item: null
      })
    }
  }

  const openNewItemRequest = () => {
    navigate('/requests/new', {
      state: {
        source: 'input-inquiry',
        inquiry: formData
      }
    })
  }

  const openMasterItemDetail = () => {
    if (!masterCheck.item?.id) {
      return
    }

    navigate(`/master-items/${masterCheck.item.id}`)
  }

  const getCheckCardClasses = () => {
    switch (masterCheck.status) {
      case 'found':
        return 'border-green-200 bg-green-50'
      case 'not_found':
        return 'border-orange-200 bg-orange-50'
      case 'error':
        return 'border-red-200 bg-red-50'
      case 'checking':
        return 'border-blue-200 bg-blue-50'
      default:
        return 'border-outline-variant bg-surface-container-low'
    }
  }

  const getCheckIcon = () => {
    switch (masterCheck.status) {
      case 'found':
        return 'task_alt'
      case 'not_found':
        return 'playlist_add'
      case 'error':
        return 'error'
      case 'checking':
        return 'progress_activity'
      default:
        return 'hub'
    }
  }

  const getSubmitButtonLabel = () => {
    if (isSubmitting) {
      return 'Memproses...'
    }

    if (masterCheck.status === 'not_found') {
      return 'Lanjut ke Permintaan Item Baru'
    }

    if (masterCheck.status === 'found') {
      return 'Simpan Inquiry'
    }

    return 'Cek Master Dulu'
  }

  const getSubmitButtonIcon = () => {
    if (isSubmitting) {
      return 'progress_activity'
    }

    if (masterCheck.status === 'not_found') {
      return 'playlist_add'
    }

    if (masterCheck.status === 'found') {
      return 'save'
    }

    return 'rule'
  }

  const getSubmitMessageClasses = () => {
    switch (submitMessage.type) {
      case 'success':
        return 'border-green-200 bg-green-50 text-green-800'
      case 'error':
        return 'border-red-200 bg-red-50 text-red-800'
      case 'info':
        return 'border-blue-200 bg-blue-50 text-blue-800'
      default:
        return 'border-outline-variant bg-surface-container-low text-on-surface'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="p-8">
        <div className="max-w-6xl mx-auto">
          {/* Welcome/Info Header */}
          <div className="mb-8 flex justify-between items-end">
            <div>
              <span className="text-[12px] uppercase tracking-[0.2em] font-bold text-primary/60 mb-2 block">Operasional Master Data</span>
              <h3 className="font-headline-xl text-headline-xl text-primary">Inquiry Masuk</h3>
              <p className="text-on-surface-variant mt-2 max-w-2xl">
                Silakan lengkapi data inquiry di bawah ini. Pastikan nomor part dan informasi teknis sudah sesuai untuk proses pengecekan Master Item.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate('/inquiries')}
                className="px-6 py-2.5 rounded border border-primary text-primary font-label-md text-label-md hover:bg-primary/5 transition-colors"
              >
                Batal
              </button>
              <button 
                type="button"
                onClick={handleSubmit}
                disabled={masterCheck.loading || isSubmitting}
                className="px-6 py-2.5 rounded bg-primary text-white font-label-md text-label-md shadow-lg shadow-primary/20 hover:bg-primary-container transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span className={`material-symbols-outlined text-[18px] ${isSubmitting ? 'animate-spin' : ''}`}>{getSubmitButtonIcon()}</span>
                {getSubmitButtonLabel()}
              </button>
            </div>
          </div>

          {submitMessage.text && (
            <div className={`mb-6 rounded-2xl border px-5 py-4 text-sm font-medium ${getSubmitMessageClasses()}`}>
              {submitMessage.text}
            </div>
          )}

          {/* Main Form Card */}
          <div className="grid grid-cols-12 gap-8">
            {/* Left Section: Basic Info */}
            <div className="col-span-12 lg:col-span-8 space-y-6">
              <div className="bg-white border border-outline-variant p-8 shadow-sm">
                <div className="flex items-center gap-2 mb-6 text-primary">
                  <span className="material-symbols-outlined">assignment</span>
                  <h4 className="font-headline-md text-headline-md">Informasi Utama</h4>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2 md:col-span-1">
                    <label className="block font-label-md text-label-md mb-2 text-on-surface-variant">No. Inquiry</label>
                    <input 
                      name="inquiryNumber"
                      value={formData.inquiryNumber}
                      disabled
                      className="w-full bg-surface-container-low border border-outline-variant px-4 py-2.5 rounded cursor-not-allowed font-medium text-primary" 
                      type="text" 
                    />
                    <p className="text-[11px] text-outline mt-1.5 italic">Dihasilkan secara otomatis oleh sistem.</p>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block font-label-md text-label-md mb-2 text-on-surface-variant">Tanggal Inquiry</label>
                    <div className="relative">
                      <input 
                        name="inquiryDate"
                        value={formData.inquiryDate}
                        onChange={handleChange}
                        className="w-full border border-outline-variant px-4 py-2.5 rounded focus:ring-2 focus:ring-primary/20 transition-all" 
                        type="date" 
                      />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="block font-label-md text-label-md mb-2 text-on-surface-variant">Customer / Internal</label>
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary">person_search</span>
                      <input 
                        name="customer"
                        value={formData.customer}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 border border-outline-variant rounded focus:ring-2 focus:ring-primary/20 transition-all" 
                        placeholder="Cari nama customer atau departemen internal..." 
                        type="text" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Details */}
              <div className="bg-white border border-outline-variant p-8 shadow-sm">
                <div className="flex items-center gap-2 mb-6 text-primary">
                  <span className="material-symbols-outlined">precision_manufacturing</span>
                  <h4 className="font-headline-md text-headline-md">Spesifikasi Teknis</h4>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2 md:col-span-1">
                    <label className="block font-label-md text-label-md mb-2 text-on-surface-variant">Brand</label>
                    <select 
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                      className="w-full border border-outline-variant px-4 py-2.5 rounded focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Pilih Brand...</option>
                      {brands.map((brand) => (
                        <option key={brand.id || brand.name} value={brand.name}>{brand.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block font-label-md text-label-md mb-2 text-on-surface-variant">Model / Tipe</label>
                    <input 
                      name="model"
                      value={formData.model}
                      onChange={handleChange}
                      className="w-full border border-outline-variant px-4 py-2.5 rounded focus:ring-2 focus:ring-primary/20" 
                      placeholder="Contoh: Dyna 130HT" 
                      type="text" 
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block font-label-md text-label-md mb-2 text-on-surface-variant">Vehicle Identification Number (VIN)</label>
                    <input 
                      name="vin"
                      value={formData.vin}
                      onChange={handleChange}
                      className="w-full border border-outline-variant px-4 py-2.5 rounded focus:ring-2 focus:ring-primary/20 uppercase font-mono tracking-wider" 
                      placeholder="Masukkan 17 digit kode VIN..." 
                      type="text" 
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block font-label-md text-label-md mb-2 text-on-surface-variant">Part Number</label>
                    <div className="flex gap-2">
                      <input 
                        name="partNumber"
                        value={formData.partNumber}
                        onChange={handleChange}
                        className="flex-1 border border-outline-variant px-4 py-2.5 rounded focus:ring-2 focus:ring-primary/20 font-mono" 
                        placeholder="Cth: 12345-67890" 
                        type="text" 
                      />
                      <button 
                        onClick={checkMasterItem}
                        type="button"
                        className="bg-secondary px-4 py-2 rounded text-white hover:bg-primary transition-colors flex items-center justify-center disabled:opacity-60" 
                        title="Cek Master Item"
                        disabled={masterCheck.loading}
                      >
                        <span className={`material-symbols-outlined ${masterCheck.loading ? 'animate-spin' : ''}`}>
                          {masterCheck.loading ? 'progress_activity' : 'search'}
                        </span>
                      </button>
                    </div>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block font-label-md text-label-md mb-2 text-on-surface-variant">Part Name</label>
                    <input 
                      name="partName"
                      value={formData.partName}
                      onChange={handleChange}
                      className="w-full border border-outline-variant px-4 py-2.5 rounded focus:ring-2 focus:ring-primary/20" 
                      placeholder="Nama part sesuai katalog" 
                      type="text" 
                    />
                  </div>
                </div>

                <div className={`mt-6 rounded-2xl border p-5 transition-colors ${getCheckCardClasses()}`}>
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/80 text-primary shadow-sm">
                      <span className={`material-symbols-outlined ${masterCheck.loading ? 'animate-spin' : ''}`}>
                        {getCheckIcon()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-on-surface">Status Cek Master Item</p>
                      <p className="mt-1 text-sm text-on-surface-variant">{masterCheck.message}</p>

                      {masterCheck.item && (
                        <div className="mt-4 grid gap-3 rounded-xl border border-green-200 bg-white/80 p-4 md:grid-cols-3">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">Part Number</p>
                            <p className="mt-1 text-sm font-semibold text-on-surface">
                              {masterCheck.item['Part Number'] || masterCheck.item.part_number || '-'}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">Part Name</p>
                            <p className="mt-1 text-sm font-semibold text-on-surface">
                              {masterCheck.item['Part Name'] || masterCheck.item.part_name || '-'}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">Status</p>
                            <p className="mt-1 text-sm font-semibold text-on-surface">
                              {masterCheck.item.Data_Status || masterCheck.item.data_status || '-'}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={checkMasterItem}
                          className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-white px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-container"
                        >
                          <span className="material-symbols-outlined text-sm">restart_alt</span>
                          Cek Ulang
                        </button>

                        {masterCheck.status === 'found' && masterCheck.item?.id && (
                          <button
                            type="button"
                            onClick={openMasterItemDetail}
                            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                          >
                            <span className="material-symbols-outlined text-sm">visibility</span>
                            Lihat Master Item
                          </button>
                        )}

                        {masterCheck.status === 'not_found' && (
                          <button
                            type="button"
                            onClick={openNewItemRequest}
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-container"
                          >
                            <span className="material-symbols-outlined text-sm">playlist_add</span>
                            Buat Permintaan Item Baru
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section: Logistics Context & Status */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              {/* Toggle & Urgency Card */}
              <div className="bg-white border border-outline-variant p-6 shadow-sm">
                <h4 className="font-label-md text-label-md text-on-surface-variant mb-6 uppercase tracking-wider">Parameter Logistik</h4>
                <div className="space-y-6">
                  <div>
                    <label className="block font-label-md text-label-md mb-3 text-on-surface-variant">Tipe Permintaan</label>
                    <div className="flex bg-surface-container-low p-1 rounded">
                      <button 
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, requestType: 'internal' }))}
                        className={`flex-1 py-2 text-center font-label-md text-label-md rounded transition-all shadow-sm ${formData.requestType === 'internal' ? 'bg-primary text-white' : 'text-on-surface-variant hover:text-primary'}`}
                      >
                        Internal
                      </button>
                      <button 
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, requestType: 'external' }))}
                        className={`flex-1 py-2 text-center font-label-md text-label-md rounded transition-all ${formData.requestType === 'external' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}
                      >
                        External
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block font-label-md text-label-md mb-3 text-on-surface-variant">Kuantitas (Qty)</label>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border border-outline-variant rounded overflow-hidden">
                        <button 
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))}
                          className="w-10 h-10 flex items-center justify-center hover:bg-surface-container transition-colors"
                        >
                          -
                        </button>
                        <input 
                          name="quantity"
                          value={formData.quantity}
                          onChange={handleChange}
                          className="w-16 h-10 border-none text-center font-bold focus:ring-0" 
                          type="number" 
                          min="1"
                        />
                        <button 
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, quantity: prev.quantity + 1 }))}
                          className="w-10 h-10 flex items-center justify-center hover:bg-surface-container transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-label-md text-label-md text-outline">Units / Pcs</span>
                    </div>
                  </div>
                  <div>
                    <label className="block font-label-md text-label-md mb-3 text-on-surface-variant">Urgency Level</label>
                    <div className="grid grid-cols-1 gap-2">
                      <label className="flex items-center p-3 border border-outline-variant rounded cursor-pointer hover:bg-surface-container-low transition-colors group">
                        <input 
                          type="radio"
                          name="urgency"
                          value="normal"
                          checked={formData.urgency === 'normal'}
                          onChange={handleChange}
                          className="w-4 h-4 text-primary focus:ring-primary" 
                        />
                        <div className="ml-3">
                          <span className="block font-label-md text-label-md text-on-surface">Normal</span>
                          <span className="text-[11px] text-outline">3-5 hari kerja</span>
                        </div>
                      </label>
                      <label className="flex items-center p-3 border border-error/30 bg-error/5 rounded cursor-pointer hover:bg-error/10 transition-colors group">
                        <input 
                          type="radio"
                          name="urgency"
                          value="urgent"
                          checked={formData.urgency === 'urgent'}
                          onChange={handleChange}
                          className="w-4 h-4 text-error focus:ring-error" 
                        />
                        <div className="ml-3">
                          <span className="block font-label-md text-label-md text-error">Urgent (Breakdown)</span>
                          <span className="text-[11px] text-error/70">Pengadaan &lt; 24 jam</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Side Illustration/Status */}
              <div className="relative bg-primary-container h-48 overflow-hidden group shadow-md border border-outline-variant">
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                  {/* Subtle grid pattern */}
                  <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                </div>
                <div className="relative h-full flex flex-col items-center justify-center text-center p-6 text-white">
                  <span className="material-symbols-outlined text-[48px] mb-2 opacity-50 group-hover:scale-110 transition-transform duration-500">conveyor_belt</span>
                  <h5 className="font-headline-md text-headline-md leading-tight">Master Data Alignment</h5>
                  <p className="text-[12px] text-on-primary-container mt-2 opacity-80">Sistem akan memvalidasi part number secara real-time terhadap inventaris pusat.</p>
                </div>
              </div>

              {/* Flow Information */}
              <div className="rounded-2xl border border-outline-variant bg-surface-container p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-label-md text-label-md text-on-surface-variant">Flow yang Dipakai</p>
                    <p className="mt-1 text-sm text-outline">Input Inquiry menjadi titik awal, sedangkan Requests dipakai untuk tindak lanjut item yang belum ada di master.</p>
                  </div>
                  <span className="material-symbols-outlined text-primary">route</span>
                </div>
                <div className="mt-5 grid gap-3">
                  <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">1</div>
                    <p className="text-sm font-medium text-on-surface">Input Inquiry</p>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-bold text-white">2</div>
                    <p className="text-sm font-medium text-on-surface">Cek Master Item</p>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">3</div>
                    <p className="text-sm font-medium text-on-surface">Jika tidak ada, buat Permintaan Item Baru</p>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white">4</div>
                    <p className="text-sm font-medium text-on-surface">Requests dipantau untuk validasi dan approval</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Summary Bar (Responsive Mobile/Desktop) */}
          <div className="sticky bottom-8 mt-12 bg-inverse-surface text-inverse-on-surface p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl rounded-lg border border-white/10">
            <div className="flex items-center gap-6">
              <div className="hidden sm:flex items-center gap-2">
                <span className="w-3 h-3 bg-secondary rounded-full animate-pulse"></span>
                <span className="text-[12px] font-bold uppercase tracking-widest opacity-70">Draft Status</span>
              </div>
              <div className="h-6 w-px bg-white/20 hidden sm:block"></div>
              <div>
                <p className="text-[11px] opacity-60">Items Diinput</p>
                <p className="font-bold leading-none">1 Line Item</p>
              </div>
              <div>
                <p className="text-[11px] opacity-60">Prioritas</p>
                <p className="font-bold text-error leading-none">{formData.urgency === 'urgent' ? 'Urgent' : 'Normal'}</p>
              </div>
            </div>
            <div className="w-full md:w-auto rounded-lg bg-white/5 px-4 py-3 text-center md:text-right">
              <p className="text-[11px] uppercase tracking-wider opacity-60">Aksi Utama</p>
              <p className="text-sm font-semibold">
                {masterCheck.status === 'not_found'
                  ? 'Setelah item tidak ditemukan, tombol utama akan melanjutkan ke Permintaan Item Baru.'
                  : masterCheck.status === 'found'
                    ? 'Gunakan tombol utama di kanan atas untuk menyimpan inquiry yang item-nya sudah ada di master.'
                    : 'Lakukan cek master item terlebih dahulu agar sistem tahu inquiry ini lanjut ke mana.'}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default InputInquiry
