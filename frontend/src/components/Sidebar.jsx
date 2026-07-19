import { Link, useLocation } from 'react-router-dom'

function Sidebar() {
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <aside className="fixed flex flex-col h-screen w-64 left-0 top-0 bg-[#1A202C] py-6 px-0 border-r border-outline-variant z-50">
      <div className="px-6 mb-10">
        <h1 className="font-headline-md text-headline-md font-bold text-white mb-1">ItemMaster Pro</h1>
        <p className="text-[11px] text-outline tracking-wider uppercase font-bold">Enterprise Logistics</p>
      </div>
      <nav className="flex-1 space-y-1">
        <Link 
          to="/" 
          className={`flex items-center px-6 py-3 transition-colors duration-200 ${isActive('/') ? 'sidebar-active' : 'text-on-surface-variant hover:text-white hover:bg-secondary-fixed-dim/5'}`}
        >
          <span className="material-symbols-outlined mr-3">dashboard</span>
          <span className="font-label-md text-label-md">Dashboard</span>
        </Link>
        <Link 
          to="/inquiries" 
          className={`flex items-center px-6 py-3 transition-colors duration-200 ${isActive('/inquiries') ? 'sidebar-active' : 'text-on-surface-variant hover:text-white hover:bg-secondary-fixed-dim/5'}`}
        >
          <span className="material-symbols-outlined mr-3">post_add</span>
          <span className="font-label-md text-label-md">Inquiries</span>
        </Link>
        <Link 
          to="/master-items" 
          className={`flex items-center px-6 py-3 transition-colors duration-200 ${isActive('/master-items') ? 'sidebar-active' : 'text-on-surface-variant hover:text-white hover:bg-secondary-fixed-dim/5'}`}
        >
          <span className="material-symbols-outlined mr-3">inventory_2</span>
          <span className="font-label-md text-label-md">Master Items</span>
        </Link>
        <Link 
          to="/requests" 
          className={`flex items-center px-6 py-3 transition-colors duration-200 ${isActive('/requests') ? 'sidebar-active' : 'text-on-surface-variant hover:text-white hover:bg-secondary-fixed-dim/5'}`}
        >
          <span className="material-symbols-outlined mr-3">add_box</span>
          <span className="font-label-md text-label-md">Item Requests</span>
        </Link>
      </nav>
      <div className="px-6 mb-6">
        <Link to="/inquiries/new" className="w-full bg-primary-container text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
          <span className="material-symbols-outlined">add</span>
          <span className="font-label-md">Input Inquiry</span>
        </Link>
      </div>
      <div className="border-t border-white/10 pt-4">
        <a className="flex items-center px-6 py-3 text-on-surface-variant hover:text-white transition-colors duration-200" href="#">
          <span className="material-symbols-outlined mr-3">settings</span>
          <span className="font-label-md text-label-md">Settings</span>
        </a>
        <a className="flex items-center px-6 py-3 text-on-surface-variant hover:text-white transition-colors duration-200" href="#">
          <span className="material-symbols-outlined mr-3">logout</span>
          <span className="font-label-md text-label-md">Logout</span>
        </a>
      </div>
    </aside>
  )
}

export default Sidebar
