import { useState, useEffect, useRef, useCallback } from 'react';

export const useCountryNotifications = () => {
  const [countryNotifications, setCountryNotifications] = useState({});
  const [currentCountry, setCurrentCountry] = useState('VNM');
  const [permissions, setPermissions] = useState('default');
  const originalTitle = useRef(document.title);
  const titleInterval = useRef(null);

  useEffect(() => {
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
        tag: `chat-notification-${currentCountry}`, // Tag by country
        requireInteraction: true,
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

  const updateTabTitle = (hasNewMessages = false, count, countryCode) => {
    if (hasNewMessages && count > 0) {
      // Clear any existing interval
      if (titleInterval.current) {
        clearInterval(titleInterval.current);
      }

      // Create blinking effect
      let isOriginal = true;
      titleInterval.current = setInterval(() => {
        document.title = isOriginal 
          ? `(${count}) ${originalTitle.current} - ${countryCode}` 
          : `🔔 New message ${countryCode}! - ${originalTitle.current}`;
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

  const getNotificationCount = (countryCode) => {
    return countryNotifications[countryCode] || 0;
  };

  const setCountryCode = useCallback((countryCode) => {
    console.log(`Switching notification country from ${currentCountry} to ${countryCode}`);
    
    // If country code is the same, do nothing
    if (currentCountry === countryCode) {
      console.log("Country code is the same, no need to switch");
      return;
    }
    
    // Reset title when switching countries
    resetTitle();
    
    // Update current country
    setCurrentCountry(countryCode);
    
    // Initialize count for new country if not exists
    if (!countryNotifications[countryCode]) {
      setCountryNotifications(prev => ({
        ...prev,
        [countryCode]: 0
      }));
    }
  }, [currentCountry, countryNotifications]);

  const resetNotificationCount = useCallback((countryCode = currentCountry) => {
    console.log(`Resetting notification count for ${countryCode} to 0`);
    setCountryNotifications(prev => ({
      ...prev,
      [countryCode]: 0
    }));
    resetTitle();
  }, [currentCountry]);

  const incrementNotificationCount = (countryCode = currentCountry) => {
    setCountryNotifications(prev => {
      const currentCount = prev[countryCode] || 0;
      const newCount = currentCount + 1;
      console.log(`Incrementing notification count for ${countryCode}: ${currentCount} -> ${newCount}`);
      
      // Update tab title if this is the current country
      if (countryCode === currentCountry) {
        updateTabTitle(true, newCount, countryCode);
      }
      
      return {
        ...prev,
        [countryCode]: newCount
      };
    });
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      console.log("Visibility changed:", document.hidden ? "hidden" : "visible");
      if (!document.hidden) {
        // Page is now visible, reset notifications for current country
        console.log(`Resetting notification count for ${currentCountry} due to visibility change`);
        resetNotificationCount(currentCountry);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [resetNotificationCount, currentCountry]);

  return {
    notificationCount: getNotificationCount(currentCountry),
    countryNotifications,
    currentCountry,
    permissions,
    showBrowserNotification,
    incrementNotificationCount,
    resetNotificationCount,
    setCountryCode,
    getNotificationCount,
    updateTabTitle,
    resetTitle,
    requestNotificationPermission
  };
};
