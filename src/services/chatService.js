import axios from 'axios';

const BASE_URL = 'https://notification.6ixgo.com';


export const getConversations = async (lateInHours, take, lastConversationId, countryCode = 'VNM', locale = "ENG") => {
  const buildApiUrl = (countryCode = 'VNM') => {
    if (countryCode === 'VNM') {
      return `${BASE_URL}/api/v1/chats/conversations/lateReply`;
    }
    return `${BASE_URL}/${countryCode.toLowerCase()}/api/v1/chats/conversations/lateReply`;
  };

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
        "X-Locale-Code": locale.toLowerCase(),
      },
    });

    return response.data.data;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
};

export const getConversationMessages = async (conversationId, pageNumber = 1, pageSize = 20, locale = "kor", countryCode = 'VNM') => {
  const buildApiUrl = (countryCode = 'VNM') => {
    if (countryCode === 'VNM') {
      return `${BASE_URL}/api/v1/chats/guest/conversations/${conversationId}`;
    }
    return `${BASE_URL}/${countryCode.toLowerCase()}/api/v1/chats/guest/conversations/${conversationId}`;
  };

  try {
    const timeZoneOffset = new Date().getTimezoneOffset();
    const API_URL = buildApiUrl(countryCode);

    const response = await axios.get(
      API_URL,
      {
        params: {
          pageSize,
          pageNumber,
        },
        headers: {
          "X-TimeZone-Offset": timeZoneOffset,
          "X-Locale-Code": locale.toLowerCase(),
        },
      }
    );

    return response.data.data.messages;
  } catch (error) {
    console.error("Error fetching conversation messages:", error);
    throw error;
  }
};

