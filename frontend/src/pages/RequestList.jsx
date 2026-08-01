import { Fragment, useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { exportToExcel, exportToCSV } from '../utils/exportFunctions'
import { useAuth } from '../context/AuthContext'
import { canAccessInputInquiry, canEditInquiryData, canViewVendorInternal, isSalesRole } from '../utils/rbac'

function RequestList() {
  const [requests, setRequests] = useState([])
  const [allRequests, setAllRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const { user } = useAuth()

  useEffect(() => {
    loadRequests()
    loadAllRequests()
  }, [page])

  const loadRequests = async () => {
    try {
      setError('')
      const result = await axios.get('/api/requests', {
        params: { page, limit: 15 }
      })
      const rows = Array.isArray(result.data?.data) ? result.data.data : []
      setRequests(rows)
      setTotal(result.data?.total || 0)
      setTotalPages(result.data?.totalPages || 0)
    } catch (err) {
      console.error(err)
      setRequests([])
      setTotal(0)
      setTotalPages(0)
      setError('Gagal memuat data request. Pastikan backend aktif dan database dapat diakses.')
    } finally {
      setLoading(false)
    }
  }

  const loadAllRequests = async () => {
    try {
      const result = await axios.get('/api/requests', {
        params: { limit: 10000 }
      })
      setAllRequests(Array.isArray(result.data?.data) ? result.data.data : [])
    } catch (err) {
      console.error(err)
      setAllRequests([])
    }
  }

  const getDataStatusColor = (status) => {
    switch (status) {
      case 'Complete':
        return 'bg-green-100 text-green-800'
      case 'Tidak Complete':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const isSalesView = isSalesRole(user?.role)
  const inquiryGroupCounts = useMemo(() => {
    const counts = new Map()

    allRequests.forEach((request) => {
      const inquiryId = String(request?.inquiry_id || '').trim()
      if (!inquiryId) {
        return
      }

      counts.set(inquiryId, (counts.get(inquiryId) || 0) + 1)
    })

    return counts
  }, [allRequests])

  const groupedRequests = useMemo(() => {
    const groups = []
    const groupMap = new Map()

    requests.forEach((request) => {
      const rawInquiryId = String(request?.inquiry_id || '').trim()
      const groupKey = rawInquiryId || `single-${request.id}`

      if (!groupMap.has(groupKey)) {
        const group = {
          key: groupKey,
          inquiryId: rawInquiryId,
          items: []
        }

        groupMap.set(groupKey, group)
        groups.push(group)
      }

      groupMap.get(groupKey).items.push(request)
    })

    return groups
  }, [requests])

  const formatCompactValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return '-'
    }

    return String(value)
  }

  const getWorkflowLabel = (status) => {
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

  const getWorkflowColor = (status) => {
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

  const getAgingDays = (request) => {
    const baseDate = request?.inquiry_date || request?.created_at

    if (!baseDate) {
      return '-'
    }

    const parsed = new Date(baseDate)
    if (Number.isNaN(parsed.getTime())) {
      return '-'
    }

    return Math.max(0, Math.floor((Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24)))
  }

  const getAgingColor = (days) => {
    if (typeof days !== 'number') {
      return 'bg-slate-100 text-slate-700'
    }

    if (days > 3) {
      return 'bg-red-100 text-red-800'
    }

    if (days === 3) {
      return 'bg-yellow-100 text-yellow-800'
    }

    return 'bg-green-100 text-green-800'
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-headline-xl text-headline-xl text-primary">Monitoring Item Request</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Halaman ini fokus untuk memantau item request, data status, dan alur review. Data masuk ke sini setelah user menyimpan registrasi item baru atau input item request.
          </p>
        </div>
        {canAccessInputInquiry(user?.role) && (
          <Link
            to="/inquiries/new"
            className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-lg font-bold hover:bg-primary-container transition-colors"
          >
            <span className="material-symbols-outlined">post_add</span>
            {isSalesView ? 'Input Inquiry' : 'Input Item Request'}
          </Link>
        )}
      </div>

      <div className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low/30">
          <div className="flex items-center gap-4">
            <span className="text-label-md text-on-surface-variant">Menampilkan <span className="font-bold text-on-surface">{requests.length}</span> dari <span className="font-bold text-on-surface">{total}</span> item request</span>
            <div className="h-4 w-[1px] bg-outline-variant"></div>
            {!isSalesView && (
              <span className="text-xs text-on-surface-variant">
                Review alur kerja dilakukan dari halaman detail request agar aksi per baris tetap rapi.
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => exportToCSV(allRequests, 'requests')}
              className="flex items-center gap-2 px-3 py-1.5 border border-outline-variant rounded text-label-md font-medium hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              CSV
            </button>
            <button 
              onClick={() => exportToExcel(allRequests, 'requests', 'Requests')}
              className="flex items-center gap-2 px-3 py-1.5 border border-outline-variant rounded text-label-md font-medium hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Excel
            </button>
          </div>
        </div>

        {error ? (
          <div className="px-6 py-10 text-center">
            <span className="material-symbols-outlined text-4xl text-red-400">error</span>
            <p className="mt-3 text-base font-semibold text-on-surface">Data request belum bisa dimuat</p>
            <p className="mt-2 text-sm text-on-surface-variant">{error}</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <span className="material-symbols-outlined text-4xl text-outline">inbox</span>
            <p className="mt-3 text-base font-semibold text-on-surface">Belum ada item request</p>
            <p className="mt-2 text-sm text-on-surface-variant">
              Data akan muncul di halaman ini setelah user menyimpan registrasi item baru atau input item request.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-data-table text-data-table">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant border-b border-outline-variant">
                  <th className="px-6 py-3 font-bold uppercase tracking-wider whitespace-nowrap">Item Request No</th>
                  <th className="px-6 py-3 font-bold uppercase tracking-wider whitespace-nowrap">Inquiry ID</th>
                  <th className="px-6 py-3 font-bold uppercase tracking-wider whitespace-nowrap">Sales</th>
                  <th className="px-6 py-3 font-bold uppercase tracking-wider whitespace-nowrap">Part No</th>
                  <th className="px-6 py-3 font-bold uppercase tracking-wider whitespace-nowrap">Nama Part</th>
                  <th className="px-6 py-3 font-bold uppercase tracking-wider whitespace-nowrap">Brand</th>
                  {canViewVendorInternal(user?.role) && (
                    <th className="px-6 py-3 font-bold uppercase tracking-wider whitespace-nowrap">Vendor</th>
                  )}
                  <th className="px-6 py-3 font-bold uppercase tracking-wider whitespace-nowrap">Selling Price</th>
                  <th className="px-6 py-3 font-bold uppercase tracking-wider whitespace-nowrap">Data Status</th>
                  <th className="px-6 py-3 font-bold uppercase tracking-wider whitespace-nowrap">Aging Days</th>
                  <th className="px-6 py-3 font-bold uppercase tracking-wider whitespace-nowrap">Tahap Proses</th>
                  <th className="px-6 py-3 font-bold uppercase tracking-wider whitespace-nowrap">Tanggal</th>
                  <th className="px-6 py-3 font-bold uppercase tracking-wider whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {groupedRequests.map((group) => {
                  const firstRequest = group.items[0]
                  const totalInInquiry = group.inquiryId
                    ? inquiryGroupCounts.get(group.inquiryId) || group.items.length
                    : group.items.length

                  return (
                    <Fragment key={`group-${group.key}`}>
                      <tr key={`group-${group.key}`} className="bg-primary/5">
                        <td colSpan={canViewVendorInternal(user?.role) ? 13 : 12} className="px-6 py-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold text-primary">
                                  Inquiry {formatCompactValue(group.inquiryId)}
                                </span>
                                <span className="inline-flex rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase text-primary">
                                  {totalInInquiry} item
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-on-surface-variant">
                                Customer: {formatCompactValue(firstRequest?.customer)} | Sales: {formatCompactValue(firstRequest?.sales_name)} | Tanggal: {firstRequest?.inquiry_date ? new Date(firstRequest.inquiry_date).toLocaleDateString('id-ID') : '-'}
                              </p>
                            </div>
                            <span className="text-xs text-on-surface-variant">
                              Semua item di bawah ini berasal dari satu input inquiry yang sama.
                            </span>
                          </div>
                        </td>
                      </tr>

                      {group.items.map((request, itemIndex) => {
                        const agingDays = getAgingDays(request)

                        return (
                          <tr key={request.id} className="hover:bg-surface-container-low transition-colors">
                            <td className="px-6 py-4 font-semibold text-primary">{request.request_number}</td>
                            <td className="px-6 py-4">
                              <div className="space-y-2">
                                <p className="font-semibold text-on-surface">{formatCompactValue(request.inquiry_id)}</p>
                                {totalInInquiry > 1 && (
                                  <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase text-primary">
                                    Item {itemIndex + 1} dari {totalInInquiry}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">{formatCompactValue(request.sales_name)}</td>
                            <td className="px-6 py-4 font-mono">{request.part_no || request.partNumber || '-'}</td>
                            <td className="px-6 py-4">{request.part_name}</td>
                            <td className="px-6 py-4">{request.brand}</td>
                            {canViewVendorInternal(user?.role) && (
                              <td className="px-6 py-4">{formatCompactValue(request.vendor_name)}</td>
                            )}
                            <td className="px-6 py-4">{formatCompactValue(request.selling_price)}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${getDataStatusColor(request.data_status)}`}>
                                {request.data_status || 'Tidak Complete'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${getAgingColor(agingDays)}`}>
                                {agingDays}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`rounded-full px-2 py-1 text-xs font-bold uppercase ${getWorkflowColor(request.status)}`}>
                                {getWorkflowLabel(request.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4">{request.created_at ? new Date(request.created_at).toLocaleDateString('id-ID') : '-'}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <Link
                                  to={`/requests/${request.id}`}
                                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-outline-variant text-label-md font-medium hover:bg-surface-container transition-colors"
                                >
                                  <span className="material-symbols-outlined text-sm">visibility</span>
                                  Detail
                                </Link>

                                {canEditInquiryData(user?.role) ? (
                                  request.status === 'approved' ? (
                                    <span className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                                      <span className="material-symbols-outlined text-sm">lock</span>
                                      Terkunci
                                    </span>
                                  ) : (
                                    <Link
                                      to={`/requests/${request.id}/edit`}
                                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-outline-variant text-label-md font-medium hover:bg-surface-container transition-colors"
                                    >
                                      <span className="material-symbols-outlined text-sm">edit</span>
                                      Edit
                                    </Link>
                                  )
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}

export default RequestList
