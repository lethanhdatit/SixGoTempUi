// Polls the server for new builds by checking if the main JS bundle hash has changed.
// On first load, captures the current script src as the "known" version.
// Every interval, fetches index.html (cache-busted) and compares the main JS filename.

let currentHash = null;
let intervalId = null;
let onUpdateCallback = null;

const extractMainJsHash = (html) => {
  const match = html.match(/\/static\/js\/main\.([a-f0-9]+)\.js/);
  return match ? match[1] : null;
};

const captureCurrentVersion = () => {
  const scripts = document.querySelectorAll('script[src*="/static/js/main."]');
  for (const s of scripts) {
    const match = s.src.match(/\/static\/js\/main\.([a-f0-9]+)\.js/);
    if (match) {
      currentHash = match[1];
      return;
    }
  }
};

const checkForUpdate = async () => {
  try {
    const resp = await fetch(window.location.origin + window.location.pathname + '?_vc=' + Date.now(), {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (!resp.ok) return;
    const html = await resp.text();
    const serverHash = extractMainJsHash(html);
    if (serverHash && currentHash && serverHash !== currentHash) {
      if (onUpdateCallback) onUpdateCallback();
    }
  } catch {
    // Network error — skip silently
  }
};

export const startVersionCheck = (callback, intervalMs = 300000) => {
  onUpdateCallback = callback;
  captureCurrentVersion();
  if (!currentHash) return; // Can't determine version — skip
  intervalId = setInterval(checkForUpdate, intervalMs);
};

export const stopVersionCheck = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};
