import { useState, useEffect, useRef, useCallback } from 'react';

export const useNotifications = () => {
  const [notificationCount, setNotificationCount] = useState(0);
  const [permissions, setPermissions] = useState('default');
  const originalTitle = useRef(document.title);
  const titleInterval = useRef(null);

  useEffect(() => {
    // Request notification permission on mount - ONLY if user has interacted
    // requestNotificationPermission();
    
    // Store original title
    originalTitle.current = document.title;

    return () => {
      // Cleanup on unmount
      resetTitle();
    };
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setPermissions(permission);
      } catch (error) {
        console.error('Error requesting notification permission:', error);
      }
    }
  };

  const showBrowserNotification = (title, body, icon = '/favicon.ico') => {
    // Auto-request permission on first notification attempt
    if (permissions === 'default') {
      requestNotificationPermission().then(() => {
        if (permissions === 'granted') {
          createNotification(title, body, icon);
        }
      });
      return;
    }

    if (permissions === 'granted') {
      createNotification(title, body, icon);
    }
  };

  const createNotification = (title, body, icon) => {
    if ('Notification' in window && permissions === 'granted') {
      const notification = new Notification(title, {
        body,
        icon,
        badge: icon,
        tag: 'chat-notification', // This will replace previous notifications with same tag
        requireInteraction: true, // Keep notification visible until user interacts
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto close after 10 seconds
      setTimeout(() => {
        notification.close();
      }, 10000);

      return notification;
    }
  };

  const updateTabTitle = (hasNewMessages = false, count = notificationCount) => {
    if (hasNewMessages) {
      // Clear any existing interval
      if (titleInterval.current) {
        clearInterval(titleInterval.current);
      }

      // Create blinking effect
      let isOriginal = true;
      titleInterval.current = setInterval(() => {
        document.title = isOriginal 
          ? `(${count}) ${originalTitle.current}` 
          : `🔔 Tin nhắn mới! - ${originalTitle.current}`;
        isOriginal = !isOriginal;
      }, 1000);
    } else {
      resetTitle();
    }
  };

  const resetTitle = () => {
    if (titleInterval.current) {
      clearInterval(titleInterval.current);
      titleInterval.current = null;
    }
    document.title = originalTitle.current;
  };

  const resetNotificationCount = useCallback(() => {
    console.log("Resetting notification count to 0");
    setNotificationCount(0);
    resetTitle();
  }, []);

  const incrementNotificationCount = () => {
    setNotificationCount(prev => {
      const newCount = prev + 1;
      console.log(`Incrementing notification count: ${prev} -> ${newCount}`);
      updateTabTitle(true, newCount);
      return newCount;
    });
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      console.log("Visibility changed:", document.hidden ? "hidden" : "visible");
      if (!document.hidden) {
        // Page is now visible, reset notifications
        console.log("Resetting notification count due to visibility change");
        resetNotificationCount();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [resetNotificationCount]);

  return {
    notificationCount,
    permissions,
    showBrowserNotification,
    incrementNotificationCount,
    resetNotificationCount,
    updateTabTitle,
    resetTitle,
    requestNotificationPermission
  };
};
