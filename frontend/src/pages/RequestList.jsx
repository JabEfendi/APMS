import { useState, useEffect } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { exportToExcel, exportToCSV } from '../utils/exportFunctions'
import { useAuth } from '../context/AuthContext'

function RequestList() {
  const [requests, setRequests] = useState([])
  const [allRequests, setAllRequests] = useState([])
  const [loading, setLoading] = useState(true)
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
      const result = await axios.get('http://localhost:3001/api/requests', {
        params: { page, limit: 15 }
      })
      if (result.data.data.length > 0) {
        setRequests(result.data.data)
        setTotal(result.data.total)
        setTotalPages(result.data.totalPages)
      } else {
        // Fallback to dummy data if API returns empty
        const dummyRequests = [
          {
            id: 1,
            request_number: 'REQ-8821',
            part_no: 'P-990-21-XYZ',
            part_name: 'Brake Pad Front',
            brand: 'Toyota',
            model: 'Innova',
            status: 'validation',
            created_at: '2023-11-20T10:30:00Z'
          },
          {
            id: 2,
            request_number: 'REQ-8822',
            part_no: 'P-880-AB-21',
            part_name: 'Oil Filter',
            brand: 'Mitsubishi',
            model: 'Pajero',
            status: 'approval',
            created_at: '2023-11-19T14:20:00Z'
          }
        ]
        setRequests(dummyRequests)
        setTotal(dummyRequests.length)
        setTotalPages(1)
      }
    } catch (err) {
      console.error(err)
      // Fallback to dummy data on error
      const dummyRequests = [
        {
          id: 1,
          request_number: 'REQ-8821',
          part_no: 'P-990-21-XYZ',
          part_name: 'Brake Pad Front',
          brand: 'Toyota',
          model: 'Innova',
          status: 'validation',
          created_at: '2023-11-20T10:30:00Z'
        },
        {
          id: 2,
          request_number: 'REQ-8822',
          part_no: 'P-880-AB-21',
          part_name: 'Oil Filter',
          brand: 'Mitsubishi',
          model: 'Pajero',
          status: 'approval',
          created_at: '2023-11-19T14:20:00Z'
        }
      ]
      setRequests(dummyRequests)
      setTotal(dummyRequests.length)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const loadAllRequests = async () => {
    try {
      const result = await axios.get('http://localhost:3001/api/requests', {
        params: { limit: 10000 }
      })
      if (result.data.data.length > 0) {
        setAllRequests(result.data.data)
      } else {
        const dummyRequests = [
          {
            id: 1,
            request_number: 'REQ-8821',
            part_no: 'P-990-21-XYZ',
            part_name: 'Brake Pad Front',
            brand: 'Toyota',
            model: 'Innova',
            status: 'validation',
            created_at: '2023-11-20T10:30:00Z'
          },
          {
            id: 2,
            request_number: 'REQ-8822',
            part_no: 'P-880-AB-21',
            part_name: 'Oil Filter',
            brand: 'Mitsubishi',
            model: 'Pajero',
            status: 'approval',
            created_at: '2023-11-19T14:20:00Z'
          }
        ]
        setAllRequests(dummyRequests)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleValidate = async (id, action) => {
    try {
      await axios.put(`http://localhost:3001/api/requests/${id}/validate`, { action })
      loadRequests()
      loadAllRequests()
    } catch (err) {
      console.error(err)
    }
  }

  const handleApprove = async (id, action) => {
    try {
      await axios.put(`http://localhost:3001/api/requests/${id}/approve`, { action })
      loadRequests()
      loadAllRequests()
    } catch (err) {
      console.error(err)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'validation':
        return 'bg-orange-100 text-orange-800'
      case 'approval':
        return 'bg-purple-100 text-purple-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const canValidate = (status) => {
    if (!user) return false
    return (user.role === 'validator' || user.role === 'admin') && status === 'validation'
  }

  const canApprove = (status) => {
    if (!user) return false
    return (user.role === 'approver' || user.role === 'admin') && status === 'approval'
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
          <h2 className="font-headline-xl text-headline-xl text-primary">Monitoring Permintaan Item Baru</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Halaman ini fokus untuk memantau status, validasi, dan approval. Pembuatan request baru dilakukan dari `Input Inquiry` ketika item tidak ditemukan di master.
          </p>
        </div>
        <Link
          to="/inquiries/new"
          className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-lg font-bold hover:bg-primary-container transition-colors"
        >
          <span className="material-symbols-outlined">post_add</span>
          Mulai dari Input Inquiry
        </Link>
      </div>

      <div className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low/30">
          <div className="flex items-center gap-4">
            <span className="text-label-md text-on-surface-variant">Menampilkan <span className="font-bold text-on-surface">{requests.length}</span> dari <span className="font-bold text-on-surface">{total}</span> permintaan</span>
            <div className="h-4 w-[1px] bg-outline-variant"></div>
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

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-data-table text-data-table">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant border-b border-outline-variant">
                <th className="px-6 py-3 font-bold uppercase tracking-wider whitespace-nowrap">Request No</th>
                <th className="px-6 py-3 font-bold uppercase tracking-wider whitespace-nowrap">Part No</th>
                <th className="px-6 py-3 font-bold uppercase tracking-wider whitespace-nowrap">Part Name</th>
                <th className="px-6 py-3 font-bold uppercase tracking-wider whitespace-nowrap">Brand</th>
                <th className="px-6 py-3 font-bold uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="px-6 py-3 font-bold uppercase tracking-wider whitespace-nowrap">Tanggal</th>
                <th className="px-6 py-3 font-bold uppercase tracking-wider whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {requests.map((request) => (
                <tr key={request.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="px-6 py-4 font-semibold text-primary">{request.request_number}</td>
                  <td className="px-6 py-4 font-mono">{request.part_no || request.partNumber || '-'}</td>
                  <td className="px-6 py-4">{request.part_name}</td>
                  <td className="px-6 py-4">{request.brand}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(request.status)}`}>
                      {request.status}
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
                      
                      {canValidate(request.status) && (
                        <>
                          <button
                            onClick={() => handleValidate(request.id, 'approve')}
                            className="px-3 py-1 bg-green-100 text-green-800 rounded text-xs font-bold hover:bg-green-200 transition-colors"
                          >
                            Validate
                          </button>
                          <button
                            onClick={() => handleValidate(request.id, 'reject')}
                            className="px-3 py-1 bg-red-100 text-red-800 rounded text-xs font-bold hover:bg-red-200 transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {canApprove(request.status) && (
                        <>
                          <button
                            onClick={() => handleApprove(request.id, 'approve')}
                            className="px-3 py-1 bg-green-100 text-green-800 rounded text-xs font-bold hover:bg-green-200 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleApprove(request.id, 'reject')}
                            className="px-3 py-1 bg-red-100 text-red-800 rounded text-xs font-bold hover:bg-red-200 transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}

export default RequestList
