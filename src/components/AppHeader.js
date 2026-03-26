import React, { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { LogOut, User, RefreshCw } from 'lucide-react';

const hardReload = () => {
  if (navigator.serviceWorker) {
    navigator.serviceWorker.getRegistrations().then((regs) =>
      regs.forEach((r) => r.unregister())
    );
  }
  if (window.caches) {
    caches.keys().then((names) => names.forEach((n) => caches.delete(n)));
  }
  window.location.href = window.location.origin + window.location.pathname + '?_r=' + Date.now();
};

const AppHeader = () => {
  const { logout, userName } = useAuth();

  // Hide the fallback reload banner once React has mounted
  useEffect(() => {
    const fb = document.getElementById('fallback-reload');
    if (fb) fb.style.display = 'none';
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between">
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-lg font-bold text-indigo-600">6ixgo</span>
        <span className="text-sm text-gray-400">Tool</span>
      </div>
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <button
          onClick={hardReload}
          className="flex items-center gap-1 px-2 py-1.5 text-xs sm:text-sm text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors shrink-0 font-medium"
          title="Update to latest version"
        >
          <RefreshCw size={14} />
          <span className="hidden sm:inline">Update</span>
        </button>
        <div className="flex items-center gap-1.5 sm:gap-2 text-sm text-gray-600 min-w-0">
          <User size={16} className="text-gray-400 shrink-0" />
          <span className="break-words sm:truncate sm:max-w-[200px]">{userName || 'User'}</span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
          title="Sign out"
        >
          <LogOut size={15} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default AppHeader;
