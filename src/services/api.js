import axios from 'axios';
import { getConfig, getTimezoneOffset } from '../config/env';

const AUTH_KEY = '6ixgo_auth_tool';
const DEFAULT_LOCALE_CODE = 'eng';

// In-memory access token cache
let accessToken = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

const getAccessToken = () => {
  if (accessToken) return accessToken;
  try {
    const stored = localStorage.getItem(AUTH_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return parsed.accessToken || null;
  } catch {
    return null;
  }
};

// Custom error class for API errors
export class ApiError extends Error {
  constructor(message, status, code, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const extractErrorMessage = (error) => {
  const response = error.response;
  if (response?.data) {
    if (response.data.data && response.data.data.length > 0) {
      return response.data.data.map((d) => d.description).join('. ');
    }
    if (response.data.message) {
      const msg = response.data.message;
      const traceIndex = msg.indexOf(', Non-Production trace:');
      return traceIndex > -1 ? msg.substring(0, traceIndex) : msg;
    }
  }
  switch (response?.status) {
    case 400: return 'Invalid request. Please check your input.';
    case 401: return 'Session expired. Please login again.';
    case 403: return 'You do not have permission to perform this action.';
    case 404: return 'The requested resource was not found.';
    case 500: return 'Server error. Please try again later.';
    default: return error.message || 'An unexpected error occurred.';
  }
};

const createApiInstance = (getBaseUrl) => {
  const instance = axios.create({ withCredentials: true });

  instance.interceptors.request.use(
    (config) => {
      config.baseURL = getBaseUrl();
      const envConfig = getConfig();
      config.headers['X-Locale-Code'] = DEFAULT_LOCALE_CODE;
      config.headers['X-TimeZone-Offset'] = getTimezoneOffset().toString();
      config.headers['Content-Type'] = 'application/json';
      config.headers['X-Origin'] = envConfig.originUrl;

      const token = getAccessToken();
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error.response?.status || 0;
      const errorMessage = extractErrorMessage(error);
      const errorCode = error.response?.data?.data?.[0]?.code;
      const errorDetails = error.response?.data?.data;
      const apiError = new ApiError(errorMessage, status, errorCode, errorDetails);

      if (status === 401) {
        localStorage.removeItem(AUTH_KEY);
        setAccessToken(null);
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }

      return Promise.reject(apiError);
    }
  );

  return instance;
};

export const identityApi = createApiInstance(() => getConfig().identityApiUrl);
export const adminApi = createApiInstance(() => getConfig().adminApiUrl);
