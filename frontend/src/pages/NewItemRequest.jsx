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
      await axios.post('http://localhost:3001/api/new-item-request', {
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
    <main className="ml-64 p-8 min-h-[calc(100vh-64px)] bg-surface">
      {/* Workflow Tracker */}
      <div className="mb-10 flex items-center justify-center max-w-4xl mx-auto overflow-x-auto pb-4">
        <div className="flex items-center group cursor-default step-inactive">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full border-2 border-outline-variant flex items-center justify-center bg-white text-outline font-bold">1</div>
            <span className="mt-2 text-xs font-label-md whitespace-nowrap">Input Inquiry</span>
          </div>
          <div className="w-20 h-[2px] bg-outline-variant mx-4 mt-[-20px]"></div>
        </div>
        <div className="flex items-center group cursor-default step-inactive">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full border-2 border-outline-variant flex items-center justify-center bg-white text-outline font-bold">2</div>
            <span className="mt-2 text-xs font-label-md whitespace-nowrap">Cek Master</span>
          </div>
          <div className="w-20 h-[2px] bg-outline-variant mx-4 mt-[-20px]"></div>
        </div>
        <div className="flex items-center group cursor-default">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-primary border-2 border-primary flex items-center justify-center text-white font-bold">3</div>
            <span className="mt-2 text-xs font-label-md text-primary font-bold whitespace-nowrap">Permintaan Item Baru</span>
          </div>
          <div className="w-20 h-[2px] bg-outline-variant mx-4 mt-[-20px]"></div>
        </div>
        <div className="flex items-center group cursor-default step-inactive">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full border-2 border-outline-variant flex items-center justify-center bg-white text-outline font-bold">4</div>
            <span className="mt-2 text-xs font-label-md whitespace-nowrap">Master Update</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 max-w-6xl mx-auto">
        {/* Alert Banner */}
        <div className="col-span-12 bg-error-container text-on-error-container p-4 rounded-xl flex items-start gap-4 mb-2">
          <span className="material-symbols-outlined text-error">info</span>
          <div>
            <p className="font-bold text-body-lg">Item Tidak Terdaftar</p>
            <p className="text-body-md opacity-80">Halaman ini digunakan setelah item tidak ditemukan di master. Request yang dibuat di sini akan masuk ke proses validation lalu approval.</p>
          </div>
        </div>

        {inquirySource && (
          <div className="col-span-12 rounded-xl border border-primary/20 bg-primary/5 p-4">
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
                className="inline-flex items-center gap-2 rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Kembali ke Input Inquiry
              </Link>
            </div>
          </div>
        )}

        {/* Main Form Card */}
        <div className="col-span-8 form-card p-8 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-surface-variant">
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface">Data Registrasi Item Baru</h3>
              <p className="text-body-md text-on-surface-variant">Pastikan semua field bertanda bintang (*) diisi dengan benar.</p>
            </div>
            <div className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-bold uppercase">Draft #REQ-8821</div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section: Validasi Part No */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary scale-75">verified_user</span>
                <h4 className="font-label-md text-label-md uppercase tracking-wide text-primary">Validasi & Identitas</h4>
              </div>
              <div className="grid grid-cols-2 gap-stack-md">
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
              <div className="grid grid-cols-3 gap-4">
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
            <div className="flex items-center justify-end gap-4 pt-6">
              <button type="button" className="px-6 py-2.5 border border-primary text-primary font-bold rounded hover:bg-primary/5 transition-colors">
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-8 py-2.5 text-white font-bold rounded shadow-lg hover:shadow-xl transition-all flex items-center gap-2 ${submitSuccess ? 'bg-green-600' : 'bg-primary-container'}`}
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
        <div className="col-span-4 space-y-6">
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
          <div className="rounded-xl overflow-hidden shadow-md relative h-48 group">
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
