const ENV = {
  identityApiUrl: process.env.REACT_APP_IDENTITY_API_URL || 'https://identity.6ixgo.com',
  adminApiUrl: process.env.REACT_APP_ADMIN_API_URL || 'https://admin-api.6ixgo.com',
  notificationApiUrl: process.env.REACT_APP_NOTIFICATION_API_URL || 'https://notification.6ixgo.com',
  originUrl: process.env.REACT_APP_ORIGIN_URL || 'https://tool.6ixgo.com',
};

export const getConfig = () => ENV;

export const getTimezoneOffset = () => new Date().getTimezoneOffset();
