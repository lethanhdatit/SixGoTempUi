import React, { useState, useEffect } from "react";
import { startVersionCheck, stopVersionCheck } from "../utils/versionCheck";

const UpdateBanner = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    startVersionCheck(() => setUpdateAvailable(true), 300000);
    return () => stopVersionCheck();
  }, []);

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] bg-blue-600 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 text-sm max-w-[90vw] sm:max-w-md animate-bounce-once">
      <span>A new version is available for 6ixgo tool. please refresh the page to see the update.</span>
      <button
        onClick={() => window.location.reload()}
        className="bg-white text-blue-600 font-semibold px-3 py-1 rounded hover:bg-blue-50 transition-colors shrink-0"
      >
        Refresh
      </button>
      <button
        onClick={() => setUpdateAvailable(false)}
        className="text-white/70 hover:text-white ml-1 text-lg leading-none shrink-0"
        title="Dismiss"
      >
        ×
      </button>
    </div>
  );
};

export default UpdateBanner;
