import axios from 'axios';

const BASE_URL = 'https://notification.6ixgo.com';

const buildApiUrl = (countryCode = 'VNM') => {
  if (countryCode === 'VNM') {
    return `${BASE_URL}/api/v1/chats/conversations/lateReply`;
  }
  return `${BASE_URL}/${countryCode.toLowerCase()}/api/v1/chats/conversations/lateReply`;
};

export const getConversations = async (lateInHours, take, lastConversationId, countryCode = 'VNM') => {
  try {
    const API_URL = buildApiUrl(countryCode);

    const params = { lateInHours, take };
    if (lastConversationId) {
      params.lastConversationId = lastConversationId;
    }

    const timeZoneOffset = new Date().getTimezoneOffset();

    const response = await axios.get(API_URL, {
      params,
      headers: {
        'X-TimeZone-Offset': timeZoneOffset,
      },
    });

    return response.data.data;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
};
