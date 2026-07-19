import { useState } from 'react'
import axios from 'axios'
import { Link, useLocation, useNavigate } from 'react-router-dom'

function NewItemRequest() {
  const navigate = useNavigate()
  const location = useLocation()
  const inquirySource = location.state?.inquiry
  const [formData, setFormData] = useState({
    partNo: inquirySource?.partNumber || '',
    partName: inquirySource?.partName || '',
    brand: inquirySource?.brand || '',
    vin: inquirySource?.vin || ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await axios.post('/api/new-item-request', {
        partNo: formData.partNo,
        partName: formData.partName,
        brand: formData.brand,
        model: '', // We can add model later
        vin: formData.vin
      })
      setSubmitSuccess(true)
      setTimeout(() => {
        navigate('/requests')
      }, 2000)
    } catch (err) {
      console.error('Error submitting request:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-surface px-4 py-6 sm:px-6 lg:px-8">
      {/* Workflow Tracker */}
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
            <p
              className={`mt-3 text-xs font-medium sm:text-sm ${
                item.active ? 'text-primary font-bold' : 'text-on-surface-variant'
              }`}
            >
              {item.label}
            </p>
          </div>
        ))}
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_320px]">
        {/* Alert Banner */}
        <div className="rounded-xl bg-error-container p-4 text-on-error-container sm:p-5 xl:col-span-2">
          <span className="material-symbols-outlined text-error">info</span>
          <div>
            <p className="font-bold text-body-lg">Item Tidak Terdaftar</p>
            <p className="text-body-md opacity-80">Halaman ini digunakan setelah item tidak ditemukan di master. Request yang dibuat di sini akan masuk ke proses validation lalu approval.</p>
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

        {/* Main Form Card */}
        <div className="form-card rounded-xl p-5 shadow-sm sm:p-8">
          <div className="mb-8 flex flex-col gap-4 border-b border-surface-variant pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface">Data Registrasi Item Baru</h3>
              <p className="text-body-md text-on-surface-variant">Pastikan semua field bertanda bintang (*) diisi dengan benar.</p>
            </div>
            <div className="w-fit rounded-full bg-secondary-container px-3 py-1 text-xs font-bold uppercase text-on-secondary-container">Draft #REQ-8821</div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section: Validasi Part No */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary scale-75">verified_user</span>
                <h4 className="font-label-md text-label-md uppercase tracking-wide text-primary">Validasi & Identitas</h4>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block font-label-md text-label-md text-on-surface-variant">Validasi Part No *</label>
                  <input
                    type="text"
                    name="partNo"
                    value={formData.partNo}
                    onChange={handleInputChange}
                    className="w-full border border-outline-variant rounded-lg p-2 text-body-md focus:border-primary focus:ring-1 focus:ring-primary bg-white"
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
                    className="w-full border border-outline-variant rounded-lg p-2 text-body-md focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                    placeholder="Contoh: Brake Pad Front"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block font-label-md text-label-md text-on-surface-variant">Model / Brand *</label>
                  <select
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    className="w-full border border-outline-variant rounded-lg p-2 text-body-md focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                  >
                    <option value="">Pilih Brand</option>
                    <option value="Toyota">Toyota</option>
                    <option value="Mitsubishi">Mitsubishi</option>
                    <option value="Honda">Honda</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block font-label-md text-label-md text-on-surface-variant">Nomor VIN (Chassis)</label>
                  <input
                    type="text"
                    name="vin"
                    value={formData.vin}
                    onChange={handleInputChange}
                    className="w-full border border-outline-variant rounded-lg p-2 text-body-md focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                    placeholder="17 digit karakter"
                  />
                </div>
              </div>
            </div>

            {/* Section: Media Upload */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary scale-75">image</span>
                <h4 className="font-label-md text-label-md uppercase tracking-wide text-primary">Foto Item & Lampiran</h4>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <div className="border-2 border-dashed border-outline-variant rounded-xl p-4 flex flex-col items-center justify-center text-on-surface-variant hover:border-primary hover:text-primary transition-all cursor-pointer group h-40">
                  <span className="material-symbols-outlined text-4xl mb-2 group-hover:scale-110 transition-transform">add_a_photo</span>
                  <span className="text-[11px] font-bold">Foto Depan</span>
                </div>
                <div className="border-2 border-dashed border-outline-variant rounded-xl p-4 flex flex-col items-center justify-center text-on-surface-variant hover:border-primary transition-all cursor-pointer h-40 overflow-hidden relative group">
                  <img className="absolute inset-0 w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfY7D7w6zYHOnWl_KFYYrKdi1vhUv0QGew7w91V_yKWIeDBZYSyaeE8R28hGsepsy07kVRqT2s20upbI_kWKmxswSzRcb4WjhGAHsC5F2RyBtCD2nzc77oJKfoeedvRXAH88AKdm-3C11czRLejPm5phpD2HgPzfpymzRLhkhYALYVtibWiZI2Zp5UfhAK7dYImNFKA4QyKZmPEqidx-gCIp9MmCAjJVwJjyfkqEsjCmR_Gjwqp92_5g" alt="Part" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="material-symbols-outlined text-white">edit</span>
                  </div>
                </div>
                <div className="border-2 border-dashed border-outline-variant rounded-xl p-4 flex flex-col items-center justify-center text-on-surface-variant hover:border-primary hover:text-primary transition-all cursor-pointer group h-40">
                  <span className="material-symbols-outlined text-4xl mb-2">cloud_upload</span>
                  <span className="text-[11px] font-bold">Upload Dokumen</span>
                </div>
              </div>
            </div>

            {/* Section: Approval Preview */}
            <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/30">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary scale-75">assignment_turned_in</span>
                <h4 className="font-label-md text-label-md uppercase tracking-wide text-primary">Alur Approval</h4>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3 overflow-hidden">
                  <div className="inline-block h-10 w-10 rounded-full border-2 border-white bg-on-primary-fixed flex items-center justify-center text-white text-xs font-bold">AM</div>
                  <div className="inline-block h-10 w-10 rounded-full border-2 border-white bg-on-tertiary-fixed-variant flex items-center justify-center text-white text-xs font-bold">SK</div>
                  <div className="inline-block h-10 w-10 rounded-full border-2 border-white bg-secondary flex items-center justify-center text-white text-xs font-bold">PL</div>
                </div>
                <div className="text-body-md">
                  <span className="font-bold">Area Requests</span> akan menampilkan status validation dan approval setelah request dikirim.
                </div>
              </div>
            </div>

            {/* Actions */}
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
                className={`w-full justify-center rounded px-8 py-2.5 text-white font-bold shadow-lg transition-all hover:shadow-xl sm:w-auto ${submitSuccess ? 'bg-green-600' : 'bg-primary-container'} flex items-center gap-2`}
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
                    <span>Kirim Request</span>
                    <span className="material-symbols-outlined">send</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar Info / Helper */}
        <div className="space-y-6">
          <div className="form-card p-6 rounded-xl">
            <h5 className="font-label-md text-label-md mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-on-tertiary-fixed-variant">lightbulb</span>
              Panduan Pengisian
            </h5>
            <ul className="space-y-4 text-body-md text-on-surface-variant">
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <p>Gunakan format <span className="font-mono text-xs bg-surface-container px-1">AAA-000-XX</span> untuk Part No yang belum tervalidasi.</p>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <p>Lampirkan minimal satu foto fisik item yang jelas dengan pencahayaan cukup.</p>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <p>Pastikan Nomor VIN sesuai dengan katalog brand untuk mempercepat verifikasi.</p>
              </li>
            </ul>
          </div>
          <div className="form-card p-6 rounded-xl bg-on-primary-fixed/5 border-primary/20">
            <h5 className="font-label-md text-label-md mb-4 text-primary">History Pencarian Terakhir</h5>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs p-2 bg-white rounded border border-outline-variant/30">
                <span className="font-bold">P-882-AB-21</span>
                <span className="text-error font-bold italic">Not Found</span>
              </div>
              <div className="flex justify-between items-center text-xs p-2 bg-white rounded border border-outline-variant/30">
                <span className="font-bold">M-771-ZY-00</span>
                <span className="text-error font-bold italic">Not Found</span>
              </div>
            </div>
          </div>
          <div className="relative h-48 overflow-hidden rounded-xl shadow-md group">
            <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBeWlLuC0GSomWJKDHngyTBRpCtPJZoZ4TOSvZ3zpwtxYWE8odbgz6C1AAYgYMKPHmMxHdsacRvO-zuk1NgFpebLDa_PzXsoc3bH_PLhLsM5Udf2RXqLuXpaqb7Uh8BLq07wDQrvaTRIOiKGzsmWumCPXumBeZM9OBM661Yjnaypij6ur6sERZH9OmbyUJdibf1CesZQGMlAcVQcbiQSwzo6IugwrPGWs_CFCjDj3_3-o_kPHrDr_Dx7Q" alt="Logistics" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent p-4 flex flex-col justify-end">
              <p className="text-white font-bold text-xs">Modern Logistics Infrastructure</p>
              <p className="text-white/70 text-[10px]">Trusted by global enterprise partners.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default NewItemRequest
