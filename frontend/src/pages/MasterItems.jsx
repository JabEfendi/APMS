import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { exportToExcel, exportToCSV } from '../utils/exportFunctions'
import { useAuth } from '../context/AuthContext'
import { canManageMasterItems } from '../utils/rbac'

const formatDisplayValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  return String(value)
}

function MasterItemField({ label, children, helperText = '' }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-on-surface-variant">{label}</label>
      {children}
      {helperText && <p className="text-xs text-on-surface-variant">{helperText}</p>}
    </div>
  )
}

function MasterItems() {
  const navigate = useNavigate()
  const { user } = useAuth()
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
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createMessage, setCreateMessage] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [newItemForm, setNewItemForm] = useState({
    partNumber: '',
    partName: '',
    workshopName: '',
    brand: '',
    model: '',
    seriesType: '',
    year: '',
    stockStatus: 'Out of Stock',
    stockQty: '',
    vendorId: '',
    vendorName: '',
    categoryPart: '',
    currency: 'IDR',
    atpmPrice: '',
    costPrice: '',
    sellingPrice: '',
    updateDate: new Date().toISOString().split('T')[0],
    dataStatus: 'Manual Entry'
  })

  useEffect(() => {
    loadMasterItems()
    loadBrandsAndModels()
  }, [page, filters])

  const loadBrandsAndModels = async () => {
    try {
      const result = await axios.get('/api/master-items', {
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
      
      const result = await axios.get('/api/master-items', { params })
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

  const handleCreateChange = (e) => {
    const { name, value } = e.target
    setNewItemForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleCreateItem = async (e) => {
    e.preventDefault()
    setCreateMessage('')
    setIsCreating(true)

    try {
      await axios.post('/api/master-items/manual', newItemForm)
      setCreateMessage('Master item manual berhasil ditambahkan.')
      setShowCreateForm(false)
      setNewItemForm({
        partNumber: '',
        partName: '',
        workshopName: '',
        brand: '',
        model: '',
        seriesType: '',
        year: '',
        stockStatus: 'Out of Stock',
        stockQty: '',
        vendorId: '',
        vendorName: '',
        categoryPart: '',
        currency: 'IDR',
        atpmPrice: '',
        costPrice: '',
        sellingPrice: '',
        updateDate: new Date().toISOString().split('T')[0],
        dataStatus: 'Manual Entry'
      })
      loadMasterItems()
      loadBrandsAndModels()
    } catch (err) {
      console.error(err)
      setCreateMessage(err.response?.data?.error || 'Gagal menambahkan master item manual.')
    } finally {
      setIsCreating(false)
    }
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
          <div>
            <h3 className="font-headline-md flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: "'FILL' 1"}}>filter_list</span>
              Cek Master Item
            </h3>
            <p className="mt-2 text-sm text-on-surface-variant">
              Purchasing bisa mencari item yang sudah ada sekaligus menambahkan item manual bila belum tersedia di master.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={resetFilters}
              className="text-primary hover:underline font-label-md"
            >
              Reset Filter
            </button>
            {canManageMasterItems(user?.role) && (
              <button
                type="button"
                onClick={() => {
                  setCreateMessage('')
                  setShowCreateForm((prev) => !prev)
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-container"
              >
                <span className="material-symbols-outlined text-sm">add_circle</span>
                Tambah Item Manual
              </button>
            )}
          </div>
        </div>
        {createMessage && (
          <div className="mb-4 rounded-xl border border-outline-variant bg-white px-4 py-3 text-sm text-on-surface">
            {createMessage}
          </div>
        )}
        {showCreateForm && canManageMasterItems(user?.role) && (
          <form onSubmit={handleCreateItem} className="mb-6 rounded-xl border border-outline-variant bg-white p-5">
            <div className="mb-4 flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined text-sm">inventory_2</span>
            <h4 className="font-semibold">Input Master Item Manual</h4>
            </div>
            <div className="mb-4 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm text-on-surface">
              Form ini dipakai untuk menambahkan part baru ke master item. Semua field memakai label yang konsisten agar lebih jelas saat diisi.
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MasterItemField label="Part Number *">
                <input name="partNumber" value={newItemForm.partNumber} onChange={handleCreateChange} className="w-full rounded-lg border border-outline-variant p-2.5" />
              </MasterItemField>
              <MasterItemField label="Part Name *">
                <input name="partName" value={newItemForm.partName} onChange={handleCreateChange} className="w-full rounded-lg border border-outline-variant p-2.5" />
              </MasterItemField>
              <MasterItemField label="Brand *">
                <input name="brand" value={newItemForm.brand} onChange={handleCreateChange} className="w-full rounded-lg border border-outline-variant p-2.5" />
              </MasterItemField>
              <MasterItemField label="Model *">
                <input name="model" value={newItemForm.model} onChange={handleCreateChange} className="w-full rounded-lg border border-outline-variant p-2.5" />
              </MasterItemField>
              <MasterItemField label="Series / Type">
                <input name="seriesType" value={newItemForm.seriesType} onChange={handleCreateChange} className="w-full rounded-lg border border-outline-variant p-2.5" />
              </MasterItemField>
              <MasterItemField label="Year">
                <input name="year" value={newItemForm.year} onChange={handleCreateChange} className="w-full rounded-lg border border-outline-variant p-2.5" />
              </MasterItemField>
              <MasterItemField label="Workshop Name">
                <input name="workshopName" value={newItemForm.workshopName} onChange={handleCreateChange} className="w-full rounded-lg border border-outline-variant p-2.5" />
              </MasterItemField>
              <MasterItemField label="Stock Status">
                <select name="stockStatus" value={newItemForm.stockStatus} onChange={handleCreateChange} className="w-full rounded-lg border border-outline-variant p-2.5">
                  <option value="Ready Stock">Ready Stock</option>
                  <option value="Order">Order</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </MasterItemField>
              <MasterItemField label="Qty Stock">
                <input name="stockQty" value={newItemForm.stockQty} onChange={handleCreateChange} className="w-full rounded-lg border border-outline-variant p-2.5" />
              </MasterItemField>
              <MasterItemField label="Category Part">
                <input name="categoryPart" value={newItemForm.categoryPart} onChange={handleCreateChange} className="w-full rounded-lg border border-outline-variant p-2.5" />
              </MasterItemField>
              <MasterItemField label="Vendor ID">
                <input name="vendorId" value={newItemForm.vendorId} onChange={handleCreateChange} className="w-full rounded-lg border border-outline-variant p-2.5" />
              </MasterItemField>
              <MasterItemField label="Vendor Name">
                <input name="vendorName" value={newItemForm.vendorName} onChange={handleCreateChange} className="w-full rounded-lg border border-outline-variant p-2.5" />
              </MasterItemField>
              <MasterItemField label="Currency">
                <input name="currency" value={newItemForm.currency} onChange={handleCreateChange} className="w-full rounded-lg border border-outline-variant p-2.5" />
              </MasterItemField>
              <MasterItemField label="Update Date">
                <input name="updateDate" type="date" value={newItemForm.updateDate} onChange={handleCreateChange} className="w-full rounded-lg border border-outline-variant p-2.5" />
              </MasterItemField>
              <MasterItemField label="ATPM Price">
                <input name="atpmPrice" value={newItemForm.atpmPrice} onChange={handleCreateChange} className="w-full rounded-lg border border-outline-variant p-2.5" />
              </MasterItemField>
              <MasterItemField label="Cost Price">
                <input name="costPrice" value={newItemForm.costPrice} onChange={handleCreateChange} className="w-full rounded-lg border border-outline-variant p-2.5" />
              </MasterItemField>
              <MasterItemField label="Selling Price">
                <input name="sellingPrice" value={newItemForm.sellingPrice} onChange={handleCreateChange} className="w-full rounded-lg border border-outline-variant p-2.5" />
              </MasterItemField>
              <MasterItemField label="Data Status">
                <input name="dataStatus" value={newItemForm.dataStatus} onChange={handleCreateChange} className="w-full rounded-lg border border-outline-variant p-2.5" />
              </MasterItemField>
            </div>
            <p className="mt-3 text-xs text-on-surface-variant">
              HPP akan dihitung otomatis oleh backend dari `Cost Price`.
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="rounded-lg border border-outline-variant px-4 py-2 text-sm font-medium text-on-surface"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                <span className={`material-symbols-outlined text-sm ${isCreating ? 'animate-spin' : ''}`}>
                  {isCreating ? 'progress_activity' : 'save'}
                </span>
                Simpan Item
              </button>
            </div>
          </form>
        )}
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
                <th className="px-6 py-3 font-bold uppercase tracking-wider whitespace-nowrap">Stock</th>
                <th className="px-6 py-3 font-bold uppercase tracking-wider whitespace-nowrap">Selling Price</th>
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
                  <td className="px-6 py-3">{formatDisplayValue(item['Stock_Status'])}{item['Stock_Qty'] ? ` (${item['Stock_Qty']})` : ''}</td>
                  <td className="px-6 py-3 font-semibold">{formatDisplayValue(item['Selling_Price'])}</td>
                  <td className="px-6 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/master-items/${item.id}`)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-outline-variant text-label-md font-medium hover:bg-surface-container transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        Detail
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/master-items/${item.id}`)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-outline-variant text-label-md font-medium hover:bg-surface-container transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                        Edit
                      </button>
                    </div>
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
