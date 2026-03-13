import { notificationApi } from './api';

const buildPath = (path, countryCode = 'VNM') => {
  if (countryCode === 'VNM') return path;
  return `/${countryCode.toLowerCase()}${path}`;
};

export const getConversations = async (lateInHours, take, lastConversationId, countryCode = 'VNM', locale = 'ENG') => {
  try {
    const params = { lateInHours, take };
    if (lastConversationId) {
      params.lastConversationId = lastConversationId;
    }

    const response = await notificationApi.get(
      buildPath('/api/v1/chats/conversations/lateReply', countryCode),
      {
        params,
        headers: { 'X-Locale-Code': locale.toLowerCase() },
      }
    );

    return response.data.data;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
};

export const getConversationMessages = async (conversationId, pageNumber = 1, pageSize = 20, locale = 'kor', countryCode = 'VNM') => {
  try {
    const response = await notificationApi.get(
      buildPath(`/api/v1/chats/guest/conversations/${conversationId}`, countryCode),
      {
        params: { pageSize, pageNumber },
        headers: { 'X-Locale-Code': locale.toLowerCase() },
      }
    );

    return response.data.data.messages;
  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    throw error;
  }
};

