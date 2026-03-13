import { identityApi } from './api';

export const authService = {
  login: async (credentials) => {
    const response = await identityApi.post('/id/v1/account/signin/admin', {
      data: credentials,
    });
    return response.data;
  },

  logout: async () => {
    const response = await identityApi.post('/id/v1/account/logout?byPassCookies=true');
    return response.data;
  },
};

export default authService;
