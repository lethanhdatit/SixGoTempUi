import React, { useMemo } from 'react';

const ChatMessages = ({ messages, currentUserId, conversationDetails }) => {
  // Tạo bản đồ userId -> user info (từ API cũ)
  const userMap = useMemo(() => {
    const map = new Map();
    for (const conv of conversationDetails) {
      if (!map.has(conv.sender.userId)) {
        map.set(conv.sender.userId, conv.sender);
      }
      if (!map.has(conv.receiver.userId)) {
        map.set(conv.receiver.userId, conv.receiver);
      }
    }
    return map;
  }, [conversationDetails]);

  // Hàm lấy tên hiển thị người dùng
  const getUserDisplayName = (userId) => {
    const user = userMap.get(userId);
    if (!user) return 'Unknown';
    return [user.firstName, user.middleName, user.lastName]
      .filter(Boolean)
      .join(' ')
      .trim() || user.email;
  };

  return (
    <div className="flex flex-col space-y-2 p-4">
      {messages.map((msg) => {
        const isOwnMessage = msg.sender.userId === currentUserId;
        const displayName = getUserDisplayName(msg.sender.userId);

        return (
          <div
            key={msg.id}
            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`rounded-2xl p-3 shadow max-w-[70%] ${
                isOwnMessage ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'
              }`}
            >
              <div className="text-xs mb-1 font-semibold text-gray-700 dark:text-gray-300">
                {displayName}
              </div>
              <div className="whitespace-pre-wrap">{msg.content}</div>
              <div className="text-right text-[10px] text-gray-400">
                {new Date(msg.createdTs).toLocaleString()}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ChatMessages;
