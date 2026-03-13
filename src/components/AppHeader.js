import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { LogOut, User } from 'lucide-react';

const AppHeader = () => {
  const { logout, userName } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between">
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-lg font-bold text-indigo-600">6ixgo</span>
        <span className="text-sm text-gray-400">Tool</span>
      </div>
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2 text-sm text-gray-600 min-w-0">
          <User size={16} className="text-gray-400 shrink-0" />
          <span className="truncate max-w-[100px] sm:max-w-none">{userName || 'User'}</span>
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
