import React, { useEffect, useState } from "react";
import { getConversationMessages } from "../services/chatService";

const MessageHistory = ({ conversationId, conversation, countryCode }) => {
  const [messages, setMessages] = useState([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 20;

  const fetchMessages = async (page = 1) => {
    try {
      const result = await getConversationMessages(
        conversationId,
        page,
        pageSize,
        "ENG",
        countryCode
      );
      if (result.items.length > 0) {
        setMessages((prev) =>
          page === 1 ? result.items : [...prev, ...result.items]
        );
        setHasMore(result.pageNumber < result.totalPages);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    setMessages([]);
    setPageNumber(1);
    setHasMore(true);
    fetchMessages(1);
  }, [conversationId]);

  const loadMore = () => {
    const nextPage = pageNumber + 1;
    setPageNumber(nextPage);
    fetchMessages(nextPage);
  };

  return (
    <div className="bg-gray-100 p-4 mt-3 rounded-md shadow-inner">
      <br></br>
      <h2 className="font-semibold text-gray-1100 mb-2">Logs:</h2>
      <br></br>
      {messages.map((msg) => {
        var sender =
          conversation.sender?.userId === msg.sender?.userId
            ? conversation.sender
            : conversation.receiver;

        return (
          <div
            key={msg.messageId}
            className="mb-2 border-b border-gray-300 pb-2"
          >
            <p>
              <b className="text-black-1000">
                {`${sender.firstName ?? ""}${sender.middleName ?? ""}${
                  sender.lastName ?? ""
                }` || sender.email}
                :{" "}
              </b>
              <span className="text-gray-800">
                {msg.message || (
                    <i style={{color: 'blue'}}>
                      {msg.orderInfo
                        ? `[ Order NO: ${msg.orderInfo.orderNo} ] - [ ${msg.orderInfo.productInfo.name} ] - [ ProductId: ${msg.orderInfo.productInfo.productId} ]`
                        : msg.productInfo
                        ? `[ Product: ${msg.productInfo.name} ] - [ ProductId: ${msg.productInfo.productId} ]`
                        : msg.attachments
                        ? `[ Attachments: ${JSON.stringify(msg.attachments)} ]`
                        : "[No content]"}
                    </i>
                  ) ||
                  "[No content]"}
              </span>
            </p>
            <p className="text-xs text-gray-400">
              <i>
                <b>{new Date(msg.sentTS).toLocaleString()}</b>
              </i>
            </p>
            <br></br>
          </div>
        );
      })}
      {hasMore ? (
        <button
          onClick={loadMore}
          className="mt-2 text-blue-600 hover:underline text-sm font-medium"
        >
          Load more...
        </button>
      ) : (
        <p className="text-sm text-gray-400 mt-2">No more messages</p>
      )}
    </div>
  );
};

export default MessageHistory;
