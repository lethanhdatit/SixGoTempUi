// Country configuration based on hostname
const COUNTRY_CONFIG = {
  'tool.6ixgo.my': {
    countries: [{ code: 'MYS', label: 'Malaysia' }],
    defaultCountry: 'MYS',
    identityBasePath: '/MYS',
    notificationBasePath: '/MYS',
    siteDomain: '6ixgo.my',
    marketplaceDomain: '6ixgo.my',
  },
};

const DEFAULT_CONFIG = {
  countries: [
    { code: 'VNM', label: 'Vietnam' },
    { code: 'MYS', label: 'Malaysia' },
  ],
  defaultCountry: 'VNM',
  identityBasePath: '',
  notificationBasePath: '',
  siteDomain: '6ixgo.com',
  marketplaceDomain: '6ixgo.com',
};

export const getCountryConfig = () => {
  const hostname = window.location.hostname;
  return COUNTRY_CONFIG[hostname] || DEFAULT_CONFIG;
};

const countryConfig = getCountryConfig();
const domain = countryConfig.siteDomain;

const ENV = {
  identityApiUrl: process.env.REACT_APP_IDENTITY_API_URL || `https://identity.${domain}`,
  notificationApiUrl: process.env.REACT_APP_NOTIFICATION_API_URL || `https://notification.${domain}`,
  originUrl: process.env.REACT_APP_ORIGIN_URL || `https://tool.${domain}`,
};

export const getConfig = () => ENV;

export const getTimezoneOffset = () => new Date().getTimezoneOffset();
