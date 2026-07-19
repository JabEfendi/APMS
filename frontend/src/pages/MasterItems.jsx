import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { exportToExcel, exportToCSV } from '../utils/exportFunctions'

const formatDisplayValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  return String(value)
}

function MasterItems() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [allItems, setAllItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [filters, setFilters] = useState({
    brand: '',
    model: '',
    search: ''
  })
  const [brands, setBrands] = useState([])
  const [models, setModels] = useState([])

  useEffect(() => {
    loadMasterItems()
    loadBrandsAndModels()
  }, [page, filters])

  const loadBrandsAndModels = async () => {
    try {
      const result = await axios.get('http://localhost:3001/api/master-items', {
        params: { limit: 10000 }
      })
      setAllItems(result.data.data)
      const uniqueBrands = [...new Set(result.data.data.map(item => item.Brand).filter(Boolean))]
      const uniqueModels = [...new Set(result.data.data.map(item => item.Model).filter(Boolean))]
      setBrands(uniqueBrands)
      setModels(uniqueModels)
    } catch (err) {
      console.error(err)
    }
  }

  const loadMasterItems = async () => {
    try {
      const params = { page, limit: 15 }
      if (filters.brand) params.brand = filters.brand
      if (filters.model) params.model = filters.model
      if (filters.search) params.search = filters.search
      
      const result = await axios.get('http://localhost:3001/api/master-items', { params })
      setItems(result.data.data)
      setTotal(result.data.total)
      setTotalPages(result.data.totalPages)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    loadMasterItems()
  }

  const resetFilters = () => {
    setFilters({ brand: '', model: '', search: '' })
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
            Cek Master Item
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
            <label className="font-label-md text-on-surface-variant">Brand</label>
            <select 
              value={filters.brand}
              onChange={(e) => setFilters(prev => ({ ...prev, brand: e.target.value }))}
              className="w-full border border-outline-variant rounded-lg p-2 text-body-md focus:border-primary focus:ring-1 focus:ring-primary bg-white"
            >
              <option value="">Semua Brand</option>
              {brands.map((brand, idx) => (
                <option key={idx} value={brand}>{brand}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="font-label-md text-on-surface-variant">Model</label>
            <select 
              value={filters.model}
              onChange={(e) => setFilters(prev => ({ ...prev, model: e.target.value }))}
              className="w-full border border-outline-variant rounded-lg p-2 text-body-md focus:border-primary focus:ring-1 focus:ring-primary bg-white"
            >
              <option value="">Semua Model</option>
              {models.map((model, idx) => (
                <option key={idx} value={model}>{model}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="font-label-md text-on-surface-variant">Part No / Name</label>
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
              Cari Item
            </button>
          </div>
        </div>
      </section>

      <div className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low/30">
          <div className="flex items-center gap-4">
            <span className="text-label-md text-on-surface-variant">Menampilkan <span className="font-bold text-on-surface">{items.length}</span> dari <span className="font-bold text-on-surface">{total}</span> items</span>
            <div className="h-4 w-[1px] bg-outline-variant"></div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => exportToCSV(allItems, 'master-items')}
              className="flex items-center gap-2 px-3 py-1.5 border border-outline-variant rounded text-label-md font-medium hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              CSV
            </button>
            <button 
              onClick={() => exportToExcel(allItems, 'master-items', 'Master Items')}
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
                <th className="px-6 py-3 font-bold uppercase tracking-wider whitespace-nowrap">Part No</th>
                <th className="px-6 py-3 font-bold uppercase tracking-wider whitespace-nowrap">Part Name</th>
                <th className="px-6 py-3 font-bold uppercase tracking-wider whitespace-nowrap">Brand</th>
                <th className="px-6 py-3 font-bold uppercase tracking-wider whitespace-nowrap">Vendor</th>
                <th className="px-6 py-3 font-bold uppercase tracking-wider whitespace-nowrap">Price</th>
                <th className="px-6 py-3 font-bold uppercase tracking-wider whitespace-nowrap text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {items.map((item, index) => (
                <tr key={item.id || index} className="hover:bg-surface-container-lowest transition-colors">
                  <td className="px-6 py-3 font-mono text-primary">{item['Int__Part_Number'] || '-'}</td>
                  <td className="px-6 py-3">{item['Part_Name'] || '-'}</td>
                  <td className="px-6 py-3">{item['Brand'] || '-'}</td>
                  <td className="px-6 py-3">{item['Vendor_Name'] || '-'}</td>
                  <td className="px-6 py-3 font-semibold">{formatDisplayValue(item['HPP__IDR_'])}</td>
                  <td className="px-6 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => navigate(`/master-items/${item.id}`)}
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

export default MasterItems
