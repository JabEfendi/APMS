import { useState } from 'react';

function Header({ title, user, onLogout }) {
  const [showMenu, setShowMenu] = useState(false);

  const getUserInitials = (username) => {
    if (!username) return 'U';
    return username.substring(0, 2).toUpperCase();
  };

  const getRoleLabel = (role) => {
    const roleLabels = {
      'requester': 'Requester',
      'validator': 'Validator',
      'approver': 'Approver',
      'admin': 'Admin'
    };
    return roleLabels[role] || role;
  };

  return (
    <header className="flex justify-between items-center w-full px-margin-edge h-16 sticky top-0 bg-surface-container-lowest border-b border-outline-variant shadow-sm z-40">
      <div className="flex items-center gap-4">
        <h2 className="font-headline-md text-headline-md font-bold text-primary">{title}</h2>
      </div>
      <div className="flex items-center gap-6">
        <div className="relative group">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline material-symbols-outlined">search</span>
          <input className="pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md w-64 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" placeholder="Cari..." type="text"/>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-transform active:scale-95">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-transform active:scale-95">
            <span className="material-symbols-outlined">help_outline</span>
          </button>
        </div>
        <div className="flex items-center gap-3 pl-4 border-l border-outline-variant relative">
          <div className="text-right">
            <p className="text-label-md font-bold text-on-surface">{user?.username || 'User'}</p>
            <p className="text-[10px] text-on-surface-variant leading-none">{user ? getRoleLabel(user.role) : 'Guest'}</p>
          </div>
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="w-9 h-9 rounded-full border border-outline-variant flex items-center justify-center bg-primary text-white font-bold hover:opacity-90 transition-opacity"
          >
            {getUserInitials(user?.username)}
          </button>

          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-0" 
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-outline-variant rounded-lg shadow-lg z-50">
                <div className="p-3 border-b border-outline-variant">
                  <p className="text-label-md font-bold text-on-surface">{user?.username}</p>
                  <p className="text-sm text-on-surface-variant">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onLogout();
                  }}
                  className="w-full text-left px-4 py-3 text-error hover:bg-surface-container-low transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">logout</span>
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
