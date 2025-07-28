import React from 'react';
import signalRService from '../services/signalrService';

const SignalRStatus = ({ isConnected, countryCode, onReconnect }) => {
  const getStatusColor = () => {
    return isConnected ? 'bg-green-500' : 'bg-red-500';
  };

  const getStatusText = () => {
    if (isConnected) {
      return `Đã kết nối với ${countryCode}`;
    }
    return `Chưa kết nối với ${countryCode}`;
  };

  const getCurrentUrl = () => {
    return signalRService.getConnectionUrl();
  };

  return (
    <div className="flex flex-col items-end space-y-2">
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
        <span className="text-sm text-gray-600">
          {getStatusText()}
        </span>
      </div>
      
      {/* Hiển thị URL hiện tại */}
      <div className="text-xs text-gray-400 max-w-xs truncate" title={getCurrentUrl()}>
        URL: {getCurrentUrl()}
      </div>
      
      {/* Nút reconnect khi không kết nối */}
      {!isConnected && (
        <button
          onClick={onReconnect}
          className="px-2 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600"
          title="Thử kết nối lại"
        >
          Kết nối lại
        </button>
      )}
    </div>
  );
};

export default SignalRStatus;
