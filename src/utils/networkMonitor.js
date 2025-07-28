// Network monitoring utility for debugging SignalR connections
class NetworkMonitor {
  constructor() {
    this.isMonitoring = false;
    this.originalFetch = null;
    this.originalXMLHttpRequest = null;
  }

  startMonitoring() {
    if (this.isMonitoring) return;
    
    console.log("Starting network monitoring for SignalR debugging...");
    this.isMonitoring = true;

    // Monitor fetch requests
    this.originalFetch = window.fetch;
    window.fetch = (...args) => {
      const url = args[0];
      if (url && (url.includes('negotiate') || url.includes('notificationHub'))) {
        console.log(`🌐 FETCH REQUEST to: ${url}`);
        console.log(`🌐 Headers:`, args[1]?.headers);
      }
      return this.originalFetch.apply(window, args);
    };

    // Monitor XMLHttpRequest
    this.originalXMLHttpRequest = window.XMLHttpRequest;
    const self = this;
    
    window.XMLHttpRequest = function() {
      const xhr = new self.originalXMLHttpRequest();
      const originalOpen = xhr.open;
      
      xhr.open = function(method, url, ...args) {
        if (url && (url.includes('negotiate') || url.includes('notificationHub'))) {
          console.log(`🌐 XHR ${method} to: ${url}`);
        }
        return originalOpen.apply(this, [method, url, ...args]);
      };
      
      return xhr;
    };
    
    // Copy static properties
    Object.setPrototypeOf(window.XMLHttpRequest, this.originalXMLHttpRequest);
    Object.defineProperties(window.XMLHttpRequest, Object.getOwnPropertyDescriptors(this.originalXMLHttpRequest));
  }

  stopMonitoring() {
    if (!this.isMonitoring) return;
    
    console.log("Stopping network monitoring...");
    this.isMonitoring = false;

    if (this.originalFetch) {
      window.fetch = this.originalFetch;
      this.originalFetch = null;
    }

    if (this.originalXMLHttpRequest) {
      window.XMLHttpRequest = this.originalXMLHttpRequest;
      this.originalXMLHttpRequest = null;
    }
  }
}

export const networkMonitor = new NetworkMonitor();
