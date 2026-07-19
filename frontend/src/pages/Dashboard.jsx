import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'

function Dashboard() {
  const [stats, setStats] = useState({
    totalInquiries: 0,
    pendingCheck: 0,
    pendingApproval: 0,
    totalMasterItems: 0,
    newRequests: 0
  })
  const [recentInquiries, setRecentInquiries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      const [statsRes, inquiriesRes, requestsRes] = await Promise.all([
        axios.get('http://localhost:3001/api/stats'),
        axios.get('http://localhost:3001/api/inquiries', { params: { limit: 100 } }),
        axios.get('http://localhost:3001/api/requests')
      ])
      
      setStats({
        ...statsRes.data,
        newRequests: requestsRes.data.total || 0
      })
      setRecentInquiries(inquiriesRes.data.data.slice(-5).reverse())
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-200 text-gray-800'
    const statusLower = status.toLowerCase()
    if (statusLower.includes('complete') || statusLower.includes('terdaftar') || statusLower.includes('selesai')) {
      return 'bg-green-100 text-green-800'
    } else if (statusLower.includes('pending') || statusLower.includes('checking') || statusLower.includes('menunggu')) {
      return 'bg-orange-100 text-orange-800'
    } else if (statusLower.includes('approval') || statusLower.includes('baru')) {
      return 'bg-purple-100 text-purple-800'
    }
    return 'bg-blue-100 text-blue-800'
  }

  return (
    <main className="p-6 space-y-6 max-w-[1440px] mx-auto w-full">
      {/* Quick Stats Grid (Bento Style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest p-4 border border-outline-variant rounded-xl flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-lg">inbox</span>
            <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded">Live</span>
          </div>
          <div className="mt-4">
            <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Total Inkuiri</h3>
            <p className="font-headline-xl text-headline-xl text-primary mt-1">
              {loading ? '...' : stats.totalInquiries.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 border border-outline-variant rounded-xl flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <span className="material-symbols-outlined text-error bg-error/10 p-2 rounded-lg">pending_actions</span>
            <span className="text-error text-xs font-bold bg-error/5 px-2 py-1 rounded">Mendesak</span>
          </div>
          <div className="mt-4">
            <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Menunggu Pengecekan</h3>
            <p className="font-headline-xl text-headline-xl text-primary mt-1">
              {loading ? '...' : stats.pendingCheck}
            </p>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 border border-outline-variant rounded-xl flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <span className="material-symbols-outlined text-tertiary-container bg-tertiary-container/10 p-2 rounded-lg">add_circle</span>
            <span className="text-on-surface-variant text-xs font-bold px-2 py-1 rounded">Minggu Ini</span>
          </div>
          <div className="mt-4">
            <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Permintaan Item Baru</h3>
            <p className="font-headline-xl text-headline-xl text-primary mt-1">
              {loading ? '...' : stats.newRequests}
            </p>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 border border-outline-variant rounded-xl flex flex-col justify-between hover:shadow-md transition-shadow overflow-hidden relative">
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <span className="material-symbols-outlined text-secondary bg-secondary/10 p-2 rounded-lg">database</span>
            </div>
            <div className="mt-4">
              <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Master Item Aktif</h3>
              <p className="font-headline-xl text-headline-xl text-primary mt-1">
                {loading ? '...' : stats.totalMasterItems.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="absolute bottom-0 right-0 w-24 h-24 opacity-5 pointer-events-none">
            <span className="material-symbols-outlined text-[100px]">inventory</span>
          </div>
        </div>
      </div>

      {/* Dashboard Body: Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Activity Table (2/3 width) */}
        <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
            <h3 className="font-headline-md text-headline-md text-primary">Aktivitas Inkuiri Terkini</h3>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 border border-outline-variant rounded text-label-md bg-white hover:bg-surface-container transition-colors">Filter</button>
              <button className="px-3 py-1.5 border border-outline-variant rounded text-label-md bg-white hover:bg-surface-container transition-colors">Ekspor CSV</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-data-table text-data-table">
              <thead className="bg-surface-container text-on-surface-variant uppercase font-bold text-[11px] tracking-wider">
                <tr>
                  <th className="px-6 py-3">No. Inkuiri</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Item / Part No</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      Memuat data...
                    </td>
                  </tr>
                ) : recentInquiries.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      Tidak ada data inquiry
                    </td>
                  </tr>
                ) : (
                  recentInquiries.map((inq, index) => (
                    <tr key={index} className="hover:bg-surface-container-low transition-colors group">
                      <td className="px-6 py-4 font-bold text-primary">{inq.Inquiry_ID || '-'}</td>
                      <td className="px-6 py-4">{inq.Customer_Name || 'Internal Logistic'}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span>{inq.Part_Name || inq.Part_Number || '-'}</span>
                          {inq.Part_Number && (
                            <span className="text-[11px] text-on-surface-variant">PN: {inq.Part_Number}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusColor(inq.Data_Status)}`}>
                          {inq.Data_Status || 'Baru'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-primary hover:underline opacity-0 group-hover:opacity-100 transition-opacity">Detail</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-auto p-4 border-t border-outline-variant text-center">
            <Link to="/inquiries" className="text-primary font-label-md text-label-md hover:underline">Lihat Semua Inkuiri</Link>
          </div>
        </div>

        {/* Workflow Visualization / Shortcut (1/3 width) */}
        <div className="space-y-4">
          {/* Flow Diagram Miniature Card */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-4">
            <h3 className="font-headline-md text-headline-md text-primary mb-4 border-b border-outline-variant pb-2">Status Alur Kerja</h3>
            <div className="relative space-y-6">
              {/* Visual Connection Line */}
              <div className="absolute left-[11px] top-6 bottom-6 w-0.5 bg-outline-variant"></div>
              <div className="flex gap-4 relative z-10">
                <div className="w-6 h-6 rounded-full bg-primary-container text-white flex items-center justify-center text-[10px] font-bold">1</div>
                <div>
                  <p className="font-label-md text-label-md text-primary">Inkuiri Masuk</p>
                  <p className="text-[11px] text-on-surface-variant">Validasi data dasar &amp; no inkuiri</p>
                </div>
              </div>
              <div className="flex gap-4 relative z-10">
                <div className="w-6 h-6 rounded-full bg-surface-variant text-primary flex items-center justify-center text-[10px] font-bold">2</div>
                <div>
                  <p className="font-label-md text-label-md text-primary opacity-60">Cek Master Item</p>
                  <p className="text-[11px] text-on-surface-variant">Pencarian Brand + Part No</p>
                </div>
              </div>
              <div className="flex gap-4 relative z-10">
                <div className="w-6 h-6 rounded-full bg-surface-variant text-primary flex items-center justify-center text-[10px] font-bold">3</div>
                <div>
                  <p className="font-label-md text-label-md text-primary opacity-60">Persetujuan Item Baru</p>
                  <p className="text-[11px] text-on-surface-variant">Input Model, VIN &amp; Foto</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Card */}
          <div className="bg-primary text-white border border-primary-container rounded-xl shadow-sm p-4 overflow-hidden relative">
            <div className="relative z-10">
              <h3 className="font-headline-md text-headline-md text-white mb-2">Item Belum Terdaftar?</h3>
              <p className="text-body-md text-primary-fixed opacity-90 mb-6">Gunakan form permohonan item baru untuk mendaftarkan part ke Master Item sistem.</p>
              <Link
                to="/requests"
                className="bg-white text-primary px-6 py-2.5 rounded font-label-md text-label-md hover:bg-primary-fixed transition-colors inline-block"
              >
                Buat Permohonan
              </Link>
            </div>
            <div className="absolute -right-8 -bottom-8 opacity-10">
              <span className="material-symbols-outlined text-[160px]" style={{ fontVariationSettings: "'FILL' 1" }}>add_box</span>
            </div>
          </div>
        </div>
      </div>

      {/* Second Row: Analytics & Assets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Visual Asset: Master Item Catalog Preview */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-4">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline-md text-headline-md text-primary">Katalog Master Item</h3>
            <Link to="/master-items" className="text-primary text-label-md hover:underline">Semua Item</Link>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="group cursor-pointer">
              <div className="aspect-square bg-surface-container-low rounded-lg overflow-hidden border border-outline-variant group-hover:border-primary transition-all">
                <img className="w-full h-full object-cover" data-alt="A macro studio photograph of an automotive brake disc on a clean white background. High-key lighting highlights the metallic texture and precise machining of the component. The style is industrial and clean, reflecting enterprise-grade logistics and parts management." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBfzaEkIVOvB3QcH_IVwzdNbyZsO7eyaiF-ZZTbZXzvyqVqJ7QEiJLduX6C47CTU2zbKnJiVCMpUFU8W7tqrqJiXI0yuIGfGPFs_iDTIQq1brLO4KUVwmsoxEStSQrjqX4LW-MVSxXMuv2WOJpMGYBYUCa2tUQVuMZ4cgM6UV9YkjEQOxRk4cjvjrjGkKLMl8fVk1_iAA4pfAk_YsFsBvmEaSD_miaAqDQqX3c3glqC3Z9wveNQvdOdyg" />
              </div>
              <p className="mt-2 text-center text-label-md font-bold text-primary truncate">Brake Components</p>
            </div>
            <div className="group cursor-pointer">
              <div className="aspect-square bg-surface-container-low rounded-lg overflow-hidden border border-outline-variant group-hover:border-primary transition-all">
                <img className="w-full h-full object-cover" data-alt="A clean, minimalist product shot of various industrial oil filters arranged symmetrically on a light gray surface. Soft ambient shadows provide depth while maintaining a technical and professional look for a warehouse inventory system." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCyJYILYB5IIaIKicpuT67Yuz8BJXn8VM0Y1s7Ins5oKqK9Fre0CbXM2RrHa6bqueacNymsBi4FzY6FsdEhBzln_eM4_m2vflggpnFF9npXE-sTXBZcnpwJwsATCI2zB2edAZK8tazfRW4_uGnGaB3mAjgQUnJQg38FgCaGiPrIZfcgndgSVmYLekthIkx9yhbglrT4aNBdTRThxEhNVnpYQVXorAC7G7gOg8DJychxncWhjV7ItJUL4A" />
              </div>
              <p className="mt-2 text-center text-label-md font-bold text-primary truncate">Filters &amp; Lubricants</p>
            </div>
            <div className="group cursor-pointer">
              <div className="aspect-square bg-surface-container-low rounded-lg overflow-hidden border border-outline-variant group-hover:border-primary transition-all">
                <img className="w-full h-full object-cover" data-alt="Close-up photograph of a modern electronic engine control unit (ECU) with visible connection pins and professional labels. The lighting is cold-toned and focused, emphasizing technological complexity and precision master data management." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBh9CgzHVTGuYIxHAV9TpM6k65JzONJbhgj8jz1ZQ9dxKkaN9ljCvJ8DRNgXJwUKjd-yYY2_L5lKyfo9Ky6CP90uezhxSK6JDHOPKysgBje8DaesJNxy6I8nx_9lNCR73ZlhPcMgQ45ZrB-eler8olHqs2xTSSzZvk4lmgaQDtn2B-pdWEPkgE0lgBHjCiwWPLC_kG30lFmFEZFTZHVPxpOomBG584w6G3zMOr91xnA9l43qe_gJd14UQ" />
              </div>
              <p className="mt-2 text-center text-label-md font-bold text-primary truncate">Engine Electronics</p>
            </div>
          </div>
        </div>

        {/* Item Approval Timeline */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-4 flex flex-col">
          <h3 className="font-headline-md text-headline-md text-primary mb-4">Persetujuan Terakhir</h3>
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-4 p-3 bg-surface-container-low rounded-lg">
              <div className="w-10 h-10 bg-green-100 text-green-700 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
              <div className="flex-1">
                <p className="text-label-md font-bold text-primary">Master Item Disetujui</p>
                <p className="text-[11px] text-on-surface-variant">Oleh: Manager Logistik • Baru Saja</p>
              </div>
              <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded">BERHASIL</span>
            </div>
            <div className="flex items-center gap-4 p-3 border border-outline-variant rounded-lg">
              <div className="w-10 h-10 bg-error-container text-error rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined">cancel</span>
              </div>
              <div className="flex-1">
                <p className="text-label-md font-bold text-primary">Validasi Foto</p>
                <p className="text-[11px] text-on-surface-variant">Menunggu verifikasi fisik • Pending</p>
              </div>
              <span className="text-[10px] font-bold text-tertiary-container bg-tertiary-container/10 px-2 py-1 rounded">PENDING</span>
            </div>
            <div className="flex items-center gap-4 p-3 border border-outline-variant rounded-lg">
              <div className="w-10 h-10 bg-tertiary-container/20 text-tertiary rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined">hourglass_top</span>
              </div>
              <div className="flex-1">
                <p className="text-label-md font-bold text-primary">Permintaan Baru</p>
                <p className="text-[11px] text-on-surface-variant">Menunggu approval • Kemarin</p>
              </div>
              <span className="text-[10px] font-bold text-tertiary-container bg-tertiary-container/10 px-2 py-1 rounded">PENDING</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default Dashboard
