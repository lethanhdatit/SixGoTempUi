const ENV = {
  identityApiUrl: process.env.REACT_APP_IDENTITY_API_URL || 'https://identity.6ixgo.com',
  adminApiUrl: process.env.REACT_APP_ADMIN_API_URL || 'https://admin-api.6ixgo.com',
  notificationApiUrl: process.env.REACT_APP_NOTIFICATION_API_URL || 'https://notification.6ixgo.com',
  originUrl: process.env.REACT_APP_ORIGIN_URL || 'https://tool.6ixgo.com',
};

export const getConfig = () => ENV;

export const getTimezoneOffset = () => new Date().getTimezoneOffset();

// Country configuration based on hostname
const COUNTRY_CONFIG = {
  'tool.6ixgo.my': {
    countries: [{ code: 'MYS', label: 'Malaysia' }],
    defaultCountry: 'MYS',
    identityBasePath: '/MYS',
  },
};

const DEFAULT_CONFIG = {
  countries: [
    { code: 'VNM', label: 'Vietnam' },
    { code: 'MYS', label: 'Malaysia' },
  ],
  defaultCountry: 'VNM',
  identityBasePath: '',
};

export const getCountryConfig = () => {
  const hostname = window.location.hostname;
  return COUNTRY_CONFIG[hostname] || DEFAULT_CONFIG;
};
