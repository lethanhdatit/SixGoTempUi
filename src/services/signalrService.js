import * as signalR from "@microsoft/signalr";

class SignalRService {
  constructor() {
    this.connection = null;
    this.isConnected = false;
    this.baseUrl = "https://notification.6ixgo.com";
    this.connectionUrl = `${this.baseUrl}/realtime/notificationHub`;
    this.currentCountryCode = "VNM"; // Track current country
    this.accessToken = "InternalChatHistoryTool";
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
    this.reconnectDelay = 10000;
    this.isRetrying = false;
    this.connectionPromise = null; // Track ongoing connection attempts
  }

  // Method to build connection URL based on country code
  buildConnectionUrl(countryCode = "VNM") {
    if (countryCode === "VNM") {
      return `${this.baseUrl}/realtime/notificationHub`;
    } else if (countryCode === "MYS") {
      return `${this.baseUrl}/MYS/realtime/notificationHub`;
    }
    // Default to Vietnam if unknown country code
    return `${this.baseUrl}/realtime/notificationHub`;
  }

  // Method to switch connection for different country
  async switchCountry(countryCode) {
    console.log(`Switching SignalR connection from ${this.currentCountryCode} to ${countryCode}`);
    
    // If same country, no need to switch
    if (this.currentCountryCode === countryCode) {
      console.log("Same country, no need to switch connection");
      return this.connection;
    }

    // Force disconnect old connection completely
    console.log("Force disconnecting old connection...");
    const oldConnectionId = this.connection?.connectionId;
    console.log(`Old URL: ${this.connectionUrl}, Connection ID: ${oldConnectionId}`);
    await this.forceDisconnect();

    // Update current country and URL before starting new connection
    this.currentCountryCode = countryCode;
    this.connectionUrl = this.buildConnectionUrl(countryCode);
    
    console.log(`New connection URL for ${countryCode}: ${this.connectionUrl}`);
    
    // Add a delay to ensure old connection is fully closed
    console.log("Waiting 2 seconds for complete cleanup...");
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Start new connection with new URL
    const newConnection = await this.startConnection(countryCode);
    const newConnectionId = this.connection?.connectionId;
    console.log(`Successfully connected to ${countryCode}, Connection ID: ${newConnectionId}`);
    return newConnection;
  }

  // Force disconnect completely
  async forceDisconnect() {
    console.log("Starting force disconnect...");
    this.isRetrying = false;
    this.connectionPromise = null;
    
    if (this.connection) {
      try {
        // Remove all listeners first
        console.log("Removing all SignalR listeners...");
        this.removeAllListeners();
        
        // Check current connection state
        console.log(`Connection state before stop: ${this.connection.state}`);
        
        // Stop connection
        await this.connection.stop();
        console.log("SignalR connection stopped");
        
        // Wait a bit to ensure connection is fully closed
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.warn("Error stopping SignalR connection:", error.message);
      }
      this.connection = null;
    }
    this.isConnected = false;
    
    // Reset connection state
    this.resetConnectionState();
    console.log("Force disconnect completed");
  }

  async startConnection(countryCode = "VNM") {
    // Check if we need to switch country first
    if (countryCode !== this.currentCountryCode) {
      console.log(`Country changed from ${this.currentCountryCode} to ${countryCode}, switching connection...`);
      return await this.switchCountry(countryCode);
    }

    // If already connected with same country, return current connection
    if (this.isConnected && this.connection) {
      console.log("SignalR already connected with same country");
      return this.connection;
    }

    // Update connection URL for current country
    this.currentCountryCode = countryCode;
    this.connectionUrl = this.buildConnectionUrl(countryCode);
    console.log(`Starting connection for country: ${countryCode}, URL: ${this.connectionUrl}`);

    // If connection attempt is in progress, wait for it
    if (this.connectionPromise) {
      console.log("SignalR connection attempt in progress, waiting...");
      return this.connectionPromise;
    }

    // If already retrying, skip this attempt
    if (this.isRetrying) {
      console.log("SignalR already retrying connection, skipping...");
      return;
    }

    this.isRetrying = true;
    
    this.connectionPromise = this._attemptConnection();
    
    try {
      const result = await this.connectionPromise;
      return result;
    } finally {
      this.connectionPromise = null;
      this.isRetrying = false;
    }
  }

  async _attemptConnection() {
    try {
      // Check if server is reachable first
      await this.checkServerHealth();
      
      // Try different connection strategies
      return await this.tryWithWebSocketsOnly();
    } catch (error) {
      console.warn("Primary connection failed, trying alternatives:", error.message);
      
      try {
        return await this.tryWithLongPollingOnly();
      } catch (fallbackError) {
        console.warn("Fallback connection failed:", fallbackError.message);
        
        // Final attempt with minimal configuration
        try {
          return await this.tryMinimalConnection();
        } catch (finalError) {
          console.error("All connection attempts failed:", finalError.message);
          this.handleConnectionFailure();
          throw finalError;
        }
      }
    }
  }

  async checkServerHealth() {
    try {
      const response = await fetch(`${this.connectionUrl}/negotiate?negotiateVersion=1`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`Server health check failed: ${response.status}`);
      }
      
      const text = await response.text();
      if (!text || text.trim() === '') {
        throw new Error('Server returned empty response');
      }
      
      JSON.parse(text); // Validate JSON
      console.log("Server health check passed");
    } catch (error) {
      throw new Error(`Server not available: ${error.message}`);
    }
  }

  async tryWithWebSocketsOnly() {
    console.log("Attempting WebSockets connection...");
    return this.createConnection([signalR.HttpTransportType.WebSockets]);
  }

  async tryWithLongPollingOnly() {
    console.log("Attempting LongPolling connection...");
    return this.createConnection([signalR.HttpTransportType.LongPolling]);
  }

  async tryMinimalConnection() {
    console.log("Attempting minimal connection...");
    return this.createConnection([
      signalR.HttpTransportType.LongPolling,
      signalR.HttpTransportType.WebSockets
    ], true);
  }

  async createConnection(transports, minimal = false) {
    // Properly stop existing connection before creating new one
    if (this.connection) {
      try {
        await this.connection.stop();
        console.log("Previous connection stopped");
      } catch (stopError) {
        console.warn("Error stopping previous connection:", stopError.message);
      }
      this.connection = null;
      this.isConnected = false;
    }

    const connectionOptions = {
      accessTokenFactory: () => this.accessToken,
      transport: transports.reduce((a, b) => a | b),
      skipNegotiation: false,
    };

    if (!minimal) {
      connectionOptions.headers = {
        "Authorization": `Bearer ${this.accessToken}`,
        "Content-Type": "application/json"
      };
    }

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(this.connectionUrl, connectionOptions)
      .withAutomaticReconnect([1000, 3000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    console.log(`Creating SignalR connection to URL: ${this.connectionUrl}`);
    console.log(`Transport types: ${transports.join(', ')}`);
    console.log(`Country code: ${this.currentCountryCode}`);

    this.setupConnectionHandlers();
    
    try {
      console.log(`Starting connection to: ${this.connectionUrl}`);
      await this.connection.start();
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log(`SignalR connected successfully with transport: ${transports.join(', ')}`);
      console.log(`Connection ID: ${this.connection?.connectionId}`);
      return this.connection;
    } catch (startError) {
      // Clean up failed connection
      if (this.connection) {
        try {
          await this.connection.stop();
        } catch (cleanupError) {
          console.warn("Error cleaning up failed connection:", cleanupError.message);
        }
        this.connection = null;
      }
      this.isConnected = false;
      throw startError;
    }
  }

  setupConnectionHandlers() {
    if (!this.connection) return;

    this.connection.onreconnecting((error) => {
      console.log("SignalR reconnecting...", error?.message || 'Unknown error');
      this.isConnected = false;
    });

    this.connection.onreconnected((connectionId) => {
      console.log("SignalR reconnected with connection ID:", connectionId);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.connection.onclose(async (error) => {
      console.log("SignalR connection closed:", error?.message || 'Unknown reason');
      this.isConnected = false;
      
      // Only attempt manual reconnection if we're not in the middle of switching countries
      if (this.reconnectAttempts < this.maxReconnectAttempts && !this.isRetrying && this.currentCountryCode) {
        this.reconnectAttempts++;
        console.log(`Scheduling reconnection attempt (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${this.reconnectDelay}ms...`);
        setTimeout(() => {
          if (!this.isConnected && !this.isRetrying) {
            console.log(`Attempting reconnection for country: ${this.currentCountryCode}`);
            this.startConnection(this.currentCountryCode);
          }
        }, this.reconnectDelay);
      }
    });

    // Add general message interceptor to catch all incoming events
    this.connection.on = new Proxy(this.connection.on, {
      apply: (target, thisArg, argumentsList) => {
        const [eventName, callback] = argumentsList;
        console.log(`[${this.currentCountryCode}] Registering listener for event: ${eventName}`);
        
        // Wrap callback to log when events are received
        const wrappedCallback = (...args) => {
          console.log(`[${this.currentCountryCode}] Server event received: ${eventName}`, args);
          return callback(...args);
        };
        
        return target.call(thisArg, eventName, wrappedCallback);
      }
    });
  }

  handleConnectionFailure() {
    this.isConnected = false;
    console.log("SignalR connection permanently failed - entering offline mode");
    
    // Stop trying to reconnect after max attempts
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("Max reconnection attempts reached. SignalR disabled.");
      return;
    }
    
    // Schedule one final retry after a longer delay
    setTimeout(() => {
      if (!this.isConnected && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`Final reconnection attempt (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.startConnection();
      }
    }, this.reconnectDelay * 2);
  }

  async stopConnection() {
    this.isRetrying = false;
    this.connectionPromise = null;
    
    if (this.connection) {
      try {
        await this.connection.stop();
        console.log("SignalR connection stopped");
      } catch (error) {
        console.warn("Error stopping SignalR connection:", error.message);
      }
      this.connection = null;
    }
    this.isConnected = false;
  }

  resetConnectionState() {
    console.log("Resetting connection state...");
    this.reconnectAttempts = 0;
    this.isRetrying = false;
    this.isConnected = false;
    this.connectionPromise = null;
    this.connection = null;
    this.eventHandlers = [];
    
    // Clear any existing timeouts
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }
    
    console.log("Connection state reset completed");
  }

  // Force restart connection
  async forceRestart() {
    console.log("Restarting SignalR connection...");
    this.resetConnectionState();
    await this.stopConnection();
    setTimeout(() => this.startConnection(), 1000);
  }

  onReceiveMessage(callback) {
    if (this.connection) {
      console.log(`[${this.currentCountryCode}] Setting up ReceiveMessage handler`);
      this.connection.on("ReceiveMessage", callback);
    }
  }

  onReceiveNotification(callback) {
    if (this.connection) {
      console.log(`[${this.currentCountryCode}] Setting up ReceiveNotification handler`);
      this.connection.on("ReceiveNotification", callback);
    }
  }

  onNewConversation(callback) {
    if (this.connection) {
      console.log(`[${this.currentCountryCode}] Setting up NewConversation handler`);
      this.connection.on("NewConversation", callback);
    }
  }

  onConversationUpdate(callback) {
    if (this.connection) {
      console.log(`[${this.currentCountryCode}] Setting up ConversationUpdate handler`);
      this.connection.on("ConversationUpdate", callback);
    }
  }

  // Handle private chat new message event
  onPrivateChatNewMessage(callback) {
    if (this.connection) {
      console.log(`[${this.currentCountryCode}] Setting up private_chat_newmessageevent handler`);
      this.connection.on("private_chat_newmessageevent", callback);
    }
  }

  removeAllListeners() {
    if (this.connection) {
      console.log(`[${this.currentCountryCode}] Removing all event listeners`);
      this.connection.off("ReceiveMessage");
      this.connection.off("ReceiveNotification");
      this.connection.off("NewConversation");
      this.connection.off("ConversationUpdate");
      this.connection.off("private_chat_newmessageevent");
      console.log(`[${this.currentCountryCode}] All event listeners removed`);
    }
  }

  getConnectionState() {
    return this.connection ? this.connection.state : signalR.HubConnectionState.Disconnected;
  }

  isConnectionActive() {
    return this.isConnected && this.connection && this.connection.state === signalR.HubConnectionState.Connected;
  }

  getCurrentCountryCode() {
    return this.currentCountryCode;
  }

  getConnectionUrl() {
    return this.connectionUrl;
  }
}

// Export singleton instance
const signalRService = new SignalRService();

// Add to window for debugging
if (typeof window !== 'undefined') {
  window.signalRService = signalRService;
}

export default signalRService;
