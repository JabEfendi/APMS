import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { exportToExcel, exportToCSV } from '../utils/exportFunctions'

function InquiryList() {
  const navigate = useNavigate()
  const [inquiries, setInquiries] = useState([])
  const [allInquiries, setAllInquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [filters, setFilters] = useState({
    customer: '',
    status: '',
    search: ''
  })
  const [customers, setCustomers] = useState([])
  const [statuses, setStatuses] = useState([])

  useEffect(() => {
    loadInquiries()
    loadAllInquiries()
  }, [page, filters])

  const loadInquiries = async () => {
    try {
      const params = { page, limit: 15 }
      if (filters.customer) params.customer = filters.customer
      if (filters.status) params.status = filters.status
      if (filters.search) params.search = filters.search

      const result = await axios.get('http://localhost:3001/api/inquiries', { params })
      setInquiries(result.data.data)
      setTotal(result.data.total)
      setTotalPages(result.data.totalPages)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadAllInquiries = async () => {
    try {
      const result = await axios.get('http://localhost:3001/api/inquiries', {
        params: { limit: 10000 }
      })
      setAllInquiries(result.data.data)
      const uniqueCustomers = [...new Set(result.data.data.map(item => item.Customer_Name).filter(Boolean))]
      const uniqueStatuses = [...new Set(result.data.data.map(item => item.Data_Status).filter(Boolean))]
      setCustomers(uniqueCustomers)
      setStatuses(uniqueStatuses)
    } catch (err) {
      console.error(err)
    }
  }

  const handleSearch = () => {
    setPage(1)
    loadInquiries()
  }

  const resetFilters = () => {
    setFilters({ customer: '', status: '', search: '' })
    setPage(1)
  }

  if (loading) {
    return (
      <div className="p-margin-edge flex items-center justify-center h-96">
        <div className="flex flex-col items-center">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin">refresh</span>
          <p className="mt-2 text-label-md text-on-surface-variant">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="p-margin-edge">
      <section className="bg-surface-container-lowest p-6 border border-outline-variant rounded-xl mb-stack-lg shadow-sm">
        <div className="flex items-center justify-between mb-stack-md">
          <h3 className="font-headline-md flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: "'FILL' 1"}}>filter_list</span>
            Filter Inquiry
          </h3>
          <button 
            onClick={resetFilters}
            className="text-primary hover:underline font-label-md"
          >
            Reset Filter
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter items-end">
          <div className="space-y-2">
            <label className="font-label-md text-on-surface-variant">Customer</label>
            <select 
              value={filters.customer}
              onChange={(e) => setFilters(prev => ({ ...prev, customer: e.target.value }))}
              className="w-full border border-outline-variant rounded-lg p-2 text-body-md focus:border-primary focus:ring-1 focus:ring-primary bg-white"
            >
              <option value="">Semua Customer</option>
              {customers.map((customer, idx) => (
                <option key={idx} value={customer}>{customer}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="font-label-md text-on-surface-variant">Status</label>
            <select 
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full border border-outline-variant rounded-lg p-2 text-body-md focus:border-primary focus:ring-1 focus:ring-primary bg-white"
            >
              <option value="">Semua Status</option>
              {statuses.map((status, idx) => (
                <option key={idx} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="font-label-md text-on-surface-variant">Inquiry ID / Part No / Part Name</label>
            <input 
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full border border-outline-variant rounded-lg p-2 text-body-md focus:border-primary focus:ring-1 focus:ring-primary" 
              placeholder="Keyword..." 
              type="text"
            />
          </div>
          <div>
            <button 
              onClick={handleSearch}
              className="w-full bg-primary text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all"
            >
              <span className="material-symbols-outlined">search</span>
              Cari Inquiry
            </button>
          </div>
        </div>
      </section>

      <div className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low/30">
          <div className="flex items-center gap-4">
            <span className="text-label-md text-on-surface-variant">Menampilkan <span className="font-bold text-on-surface">{inquiries.length}</span> dari <span className="font-bold text-on-surface">{total}</span> inquiry</span>
            <div className="h-4 w-[1px] bg-outline-variant"></div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => exportToCSV(allInquiries, 'inquiries')}
              className="flex items-center gap-2 px-3 py-1.5 border border-outline-variant rounded text-label-md font-medium hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              CSV
            </button>
            <button 
              onClick={() => exportToExcel(allInquiries, 'inquiries', 'Inquiries')}
              className="flex items-center gap-2 px-3 py-1.5 border border-outline-variant rounded text-label-md font-medium hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Excel
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-data-table text-data-table">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant border-b border-outline-variant">
                <th className="px-6 py-3 font-bold uppercase tracking-wider whitespace-nowrap">Inquiry ID</th>
                <th className="px-6 py-3 font-bold uppercase tracking-wider whitespace-nowrap">Customer</th>
                <th className="px-6 py-3 font-bold uppercase tracking-wider whitespace-nowrap">Part No</th>
                <th className="px-6 py-3 font-bold uppercase tracking-wider whitespace-nowrap">Part Name</th>
                <th className="px-6 py-3 font-bold uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="px-6 py-3 font-bold uppercase tracking-wider whitespace-nowrap text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {inquiries.map((inquiry, index) => (
                <tr key={inquiry.id || index} className="hover:bg-surface-container-lowest transition-colors">
                  <td className="px-6 py-3 font-semibold text-primary">{inquiry['Inquiry_ID'] || '-'}</td>
                  <td className="px-6 py-3">{inquiry['Customer_Name'] || '-'}</td>
                  <td className="px-6 py-3 font-mono">{inquiry['Part_Number'] || '-'}</td>
                  <td className="px-6 py-3">{inquiry['Part_Name'] || '-'}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                      inquiry['Data_Status'] === 'Complete' || inquiry['Data_Status'] === 'Terdaftar'
                        ? 'bg-blue-100 text-[#00355f]'
                        : inquiry['Data_Status'] === 'Pending'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {inquiry['Data_Status'] || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => navigate(`/inquiries/${inquiry.id}`)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-outline-variant text-label-md font-medium hover:bg-surface-container transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">visibility</span>
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-outline-variant flex justify-between items-center bg-surface-container-low/30">
          <button 
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-outline-variant text-label-md font-medium hover:bg-surface-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Sebelumnya
          </button>
          <span className="text-label-md text-on-surface-variant">
            Halaman {page} dari {totalPages}
          </span>
          <button 
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-outline-variant text-label-md font-medium hover:bg-surface-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Selanjutnya
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </div>
    </main>
  )
}

export default InquiryList
