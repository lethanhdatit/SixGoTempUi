import React, { useEffect, useState } from "react";
import { getConversationMessages } from "../services/chatService";
import { CopyableField } from "./CopyableField";

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
                {msg.message ? (
                  <CopyableField value={msg.message} label="message" />
                ) : (
                  (
                    <i style={{ color: "blue" }}>
                      {msg.orderInfo ? (
                        <>
                          <CopyableField
                            value={msg.orderInfo.orderNo}
                            label="Order No"
                          />{" "}
                          <a
                            href={`https://6ixgo.com${encodeURIComponent(
                              msg.orderInfo.productInfo.slug
                                .replace(/[^a-z0-9]+/gi, "-")
                                .replace(/^-+|-+$/g, "")
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline hover:text-blue-800"
                          >
                            {msg.orderInfo.productInfo.name}
                          </a>{" "}
                          <CopyableField
                            value={msg.orderInfo.productInfo.productId}
                            label="Product Id"
                          />{" "}
                        </>
                      ) : msg.productInfo ? (
                        <>
                          <a
                            href={`https://6ixgo.com${encodeURIComponent(
                              msg.productInfo.slug
                                .replace(/[^a-z0-9]+/gi, "-")
                                .replace(/^-+|-+$/g, "")
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline hover:text-blue-800"
                          >
                            {msg.productInfo.name}
                          </a>
                          <CopyableField
                            value={msg.productInfo.productId}
                            label="Product Id"
                          />
                        </>
                      ) : msg.attachments ? (
                        <>
                          {msg.attachments
                            .sort((a, b) => a.displayOrder - b.displayOrder)
                            .map((att, idx) => {
                              const isImage =
                                /\.(jpe?g|png|gif|bmp|webp|svg|tiff?|heic)$/i.test(
                                  att.url
                                );
                              return (
                                <span
                                  key={att.id}
                                  className="mr-2 inline-block"
                                >
                                  {isImage ? (
                                    <a
                                      href={att.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-block"
                                    >
                                      <img
                                        src={att.url}
                                        alt={
                                          att.displayName ||
                                          `Attachment ${idx + 1}`
                                        }
                                        className="w-20 h-20 object-cover rounded-lg border border-gray-300 hover:opacity-80 transition"
                                      />
                                    </a>
                                  ) : (
                                    <a
                                      href={att.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      download
                                      className="flex items-center space-x-1 text-blue-600 underline hover:text-blue-800"
                                    >
                                      📎
                                      <span>
                                        {att.displayName ||
                                          `Attachment ${idx + 1}`}
                                      </span>
                                    </a>
                                  )}
                                </span>
                              );
                            })}
                        </>
                      ) : (
                        "[No content]"
                      )}
                    </i>
                  ) || "[No content]"
                )}
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
