import React, { useState, useEffect, useRef, useCallback } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { getConversations } from "../services/chatService";
import ConversationCard from "../components/ConversationCard";
import signalRService from "../services/signalrService";
import { useCountryNotifications } from "../hooks/useCountryNotifications";
import { networkMonitor } from "../utils/networkMonitor";

const pageSize = 10;

const ChatHistory = () => {
  const [conversations, setConversations] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [lateInHours, setLateInHours] = useState(0);
  const [take, setTake] = useState(pageSize);
  const [countryCode, setCountryCode] = useState("VNM");
  const [isSignalRConnected, setIsSignalRConnected] = useState(false);
  const isFetchingRef = useRef(false);
  
  // Initialize country notifications hook
  const {
    notificationCount,
    showBrowserNotification,
    incrementNotificationCount,
    resetNotificationCount,
    setCountryCode: setNotificationCountryCode
  } = useCountryNotifications();

  // Component mounting - start network monitoring for debugging
  useEffect(() => {
    console.log("ChatHistory component mounted - starting network monitoring");
    networkMonitor.startMonitoring();
    
    return () => {
      console.log("ChatHistory component unmounting - stopping network monitoring");
      networkMonitor.stopMonitoring();
    };
  }, []);

  const fetchConversations = useCallback(async (_take, reset = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    _take = reset ? pageSize : _take ?? take;

    try {
      const data = await getConversations(lateInHours, _take, undefined, countryCode, "ENG");
      if (data.details.length > 0) {
        setConversations(data.details);
        setHasMore(data.total >= _take);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      isFetchingRef.current = false;
    }
  }, [lateInHours, take, countryCode]);

  // SignalR setup and event handlers
  useEffect(() => {
    let isActive = true;
    let initializationTimeout;

    const initializeSignalR = async () => {
      // Skip if already connected with the same country code
      if (signalRService.isConnectionActive() && signalRService.getCurrentCountryCode() === countryCode) {
        console.log("SignalR already active with correct country code, skipping initialization");
        setIsSignalRConnected(true);
        return;
      }

      try {
        // Add timeout for initialization
        const connectionPromise = signalRService.startConnection(countryCode);
        initializationTimeout = setTimeout(() => {
          console.warn("SignalR initialization timeout - continuing in offline mode");
          if (isActive) {
            setIsSignalRConnected(false);
          }
        }, 15000); // 15 second timeout

        const connection = await connectionPromise;
        clearTimeout(initializationTimeout);
        
        if (isActive && connection) {
          setIsSignalRConnected(true);
          console.log(`SignalR connected for country: ${countryCode}, URL: ${signalRService.getConnectionUrl()}`);
          
          // Always set up event handlers for new connections (country switching)
          const currentConnectionId = connection.connectionId;
          console.log(`Setting up event handlers for connection ID: ${currentConnectionId}, Country: ${countryCode}`);
          
          // Remove existing handlers first to avoid duplicates
          signalRService.removeAllListeners();
          
          // Handle new message notifications
          signalRService.onReceiveMessage((user, message) => {
            console.log(`[${countryCode}] Received message:`, { user, message });
            incrementNotificationCount(signalRService.getCurrentCountryCode());
            showBrowserNotification(
              `Tin nhắn mới (${signalRService.getCurrentCountryCode()})`,
              `${user}: ${message}`,
              "/favicon.ico"
            );
          });

          // Handle general notifications
          signalRService.onReceiveNotification((notification) => {
            console.log(`[${countryCode}] Received notification:`, notification);
            incrementNotificationCount(signalRService.getCurrentCountryCode());
            showBrowserNotification(
              `${notification.title || "Thông báo mới"} (${signalRService.getCurrentCountryCode()})`,
              notification.message || notification.body,
              "/favicon.ico"
            );
          });

          // Handle new conversation
          signalRService.onNewConversation((conversation) => {
            console.log(`[${countryCode}] New conversation:`, conversation);
            incrementNotificationCount(signalRService.getCurrentCountryCode());
            showBrowserNotification(
              `Cuộc trò chuyện mới (${signalRService.getCurrentCountryCode()})`,
              "Có cuộc trò chuyện mới cần phản hồi",
              "/favicon.ico"
            );
            
            // Use callback to avoid stale closure
            fetchConversations(undefined, true);
          });

          // Handle conversation updates
          signalRService.onConversationUpdate((updatedConversation) => {
            console.log(`[${countryCode}] Conversation updated:`, updatedConversation);
            
            // Update the specific conversation in the list
            setConversations(prev => 
              prev.map(conv => 
                conv.conversationId === updatedConversation.conversationId 
                  ? { ...conv, ...updatedConversation }
                  : conv
              )
            );
          });

          // Handle private chat new message events
          signalRService.onPrivateChatNewMessage((messageData) => {
            console.log(`[${countryCode}] Private chat new message:`, messageData);
            incrementNotificationCount(signalRService.getCurrentCountryCode());
            showBrowserNotification(
              `New private message (${signalRService.getCurrentCountryCode()})`,
              messageData.message || "You have a new private message",
              "/favicon.ico"
            );
            
            // Use callback to avoid stale closure
            fetchConversations(undefined, true);
          });

        }
      } catch (error) {
        clearTimeout(initializationTimeout);
        console.error("Failed to initialize SignalR:", error.message || error);
        if (isActive) {
          setIsSignalRConnected(false);
          console.log("SignalR connection failed - running in offline mode");
        }
      }
    };

    // Only initialize if not already connected to the correct country
    if (!signalRService.isConnectionActive() || signalRService.getCurrentCountryCode() !== countryCode) {
      initializeSignalR();
    } else {
      setIsSignalRConnected(true);
    }

    return () => {
      isActive = false;
      clearTimeout(initializationTimeout);
    };
  }, [countryCode, incrementNotificationCount, showBrowserNotification, fetchConversations]);

  // Separate effect to sync notification country code
  useEffect(() => {
    console.log(`Syncing notification country to: ${countryCode}`);
    setNotificationCountryCode(countryCode);
  }, [countryCode, setNotificationCountryCode]);

  useEffect(() => {
    setConversations([]);
    setTake(pageSize);
    setHasMore(true);
    fetchConversations(undefined, true);
  }, [lateInHours, countryCode, fetchConversations]);

  // Cleanup SignalR on unmount
  useEffect(() => {
    return () => {
      setTimeout(() => {
        if (!signalRService.isConnectionActive()) {
          console.log("Component unmounted, stopping SignalR connection");
          signalRService.stopConnection();
        }
      }, 100);
    };
  }, []);

  const loadMore = async () => {
    if (isFetchingRef.current) return;
    setTake((prev) => prev + pageSize);
    await fetchConversations(take + pageSize);
  };

  return (
    <div className="chat-history-container p-6 bg-gray-50 min-h-screen">
      <div className="filter-container mb-6 flex justify-between items-center">
        <h1 
          className="text-2xl font-bold text-gray-800 cursor-pointer"
          onClick={() => resetNotificationCount(countryCode)}
          title="Click to clear notifications"
        >
          Last message of conversations ({countryCode})
          {notificationCount > 0 && (
            <span className="ml-2 bg-red-500 text-white text-sm px-2 py-1 rounded-full">
              {notificationCount}
            </span>
          )}
        </h1>
        
        {/* SignalR Connection Status */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isSignalRConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {isSignalRConnected ? `Connected (${countryCode})` : `Disconnected (${countryCode})`}
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="flex-1 flex justify-center">
          <div className="flex items-center">
            <label className="text-gray-600 font-medium mr-2">Country</label>
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="p-2 border rounded-md bg-white text-gray-800"
            >
              <option value="VNM">Vietnam</option>
              <option value="MYS">Malaysia</option>
            </select>
          </div>
        </div>

        <div className="flex items-center">
          <label className="text-gray-600 font-medium mr-2">Waited for a response for at least</label>
          <input
            type="number"
            value={lateInHours}
            onChange={(e) => setLateInHours(Number(e.target.value))}
            className="p-2 border rounded-md w-20 mr-2"
            placeholder="Hours"
          />
          <label className="text-gray-600 font-medium">hours</label>
        </div>
      </div>

      <InfiniteScroll
        dataLength={conversations.length}
        next={loadMore}
        hasMore={hasMore}
        loader={<h4 className="text-center text-gray-500">Loading...</h4>}
        endMessage={<p className="text-center text-gray-600 mt-4">No more conversations</p>}
      >
        {conversations.map((conversation) => (
          <ConversationCard key={conversation.conversationId} conversation={conversation} countryCode={countryCode} />
        ))}
      </InfiniteScroll>
    </div>
  );
};

export default ChatHistory;
