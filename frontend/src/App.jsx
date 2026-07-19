import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import './App.css'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import InquiryList from './pages/InquiryList'
import InquiryDetail from './pages/InquiryDetail'
import MasterItems from './pages/MasterItems'
import MasterItemDetail from './pages/MasterItemDetail'
import NewItemRequest from './pages/NewItemRequest'
import InputInquiry from './pages/InputInquiry'
import RequestList from './pages/RequestList'
import RequestDetail from './pages/RequestDetail'
import Login from './pages/Login'
import Register from './pages/Register'

// Protected Route Component
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin">refresh</span>
          <p className="text-label-md text-on-surface-variant">Loading...</p>
        </div>
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

function AppContent() {
  const location = useLocation()
  const { user, loading, logout } = useAuth()
  
  // Don't show sidebar on login/register pages
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'
  
  const getPageTitle = (path) => {
    switch (path) {
      case '/':
        return 'Dashboard'
      case '/inquiries':
        return 'Inquiries'
      case '/inquiries/new':
        return 'Input Inquiry'
      case '/master-items':
        return 'Master Items'
      case '/requests':
        return 'Item Requests'
      case '/requests/new':
        return 'Permintaan Item Baru'
      default:
        return 'Dashboard'
    }
  }

  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <div className="App">
      <Sidebar />
      <div className="ml-64 flex flex-col min-h-screen">
        <Routes>
          <Route path="/" element={
            <ProtectedRoute>
              <Header title={getPageTitle('/')} user={user} onLogout={logout} />
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/inquiries" element={
            <ProtectedRoute>
              <Header title={getPageTitle('/inquiries')} user={user} onLogout={logout} />
              <InquiryList />
            </ProtectedRoute>
          } />
          <Route path="/inquiries/:id" element={
            <ProtectedRoute>
              <Header title="Detail Inquiry" user={user} onLogout={logout} />
              <InquiryDetail />
            </ProtectedRoute>
          } />
          <Route path="/inquiries/new" element={
            <ProtectedRoute>
              <Header title={getPageTitle('/inquiries/new')} user={user} onLogout={logout} />
              <InputInquiry />
            </ProtectedRoute>
          } />
          <Route path="/master-items" element={
            <ProtectedRoute>
              <Header title={getPageTitle('/master-items')} user={user} onLogout={logout} />
              <MasterItems />
            </ProtectedRoute>
          } />
          <Route path="/master-items/:id" element={
            <ProtectedRoute>
              <Header title="Detail Master Item" user={user} onLogout={logout} />
              <MasterItemDetail />
            </ProtectedRoute>
          } />
          <Route path="/requests" element={
            <ProtectedRoute>
              <Header title={getPageTitle('/requests')} user={user} onLogout={logout} />
              <RequestList />
            </ProtectedRoute>
          } />
          <Route path="/requests/:id" element={
            <ProtectedRoute>
              <Header title="Detail Request" user={user} onLogout={logout} />
              <RequestDetail />
            </ProtectedRoute>
          } />
          <Route path="/requests/new" element={
            <ProtectedRoute>
              <Header title={getPageTitle('/requests/new')} user={user} onLogout={logout} />
              <NewItemRequest />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  )
}

export default App
