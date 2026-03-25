import React, { useEffect, useState, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import { X } from "lucide-react";
import { getConversationMessages } from "../services/chatService";
import { CopyableField } from "./CopyableField";
import { PreviewableImage, PreviewableFile } from "./MediaPreview";
import { getCountryConfig } from "../config/env";

export const buildProductHref = (rawSlug, parentCategory) => {
  const { marketplaceDomain } = getCountryConfig();
  if (!rawSlug) return "";

  // Chuẩn hóa slug (loại bỏ ký tự đặc biệt, khoảng trắng)
  const cleanedSlug = rawSlug
    .replace(/[^a-zA-Z0-9-.]+/g, "-")
    .replace(/^-+|-+$/g, "");

  // Lấy code cũ phía sau dấu '.' cuối cùng (vd: ci692)
  const match = cleanedSlug.match(/\.([a-zA-Z]{2}\d+)$/);
  const oldCode = match ? match[1] : "";

  // Lấy phần số (vd: 692)
  const numberPart = oldCode.replace(/^\D+/g, "");

  // Xác định prefix mới theo parentCategory
  let prefix = "";
  switch (parentCategory) {
    case "CTG10000000001":
      prefix = "ci";
      break;
    case "CTG10000000002":
      prefix = "si";
      break;
    case "CTG10000000003":
      prefix = "pi";
      break;
    default:
      return `${marketplaceDomain}/${cleanedSlug}`; // fallback nếu không khớp
  }

  // Gắn code mới
  const newCode = prefix + numberPart;

  // Nếu có code cũ thì thay thế, nếu không thì thêm vào cuối
  const newSlug = oldCode
    ? cleanedSlug.replace(oldCode, newCode)
    : `${cleanedSlug}.${newCode}`;

  return `${marketplaceDomain}/${newSlug}`;
};

const buildRestaurantHref = (title, autoId) => {
  const { marketplaceDomain } = getCountryConfig();
  const slug = (title || "")
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${marketplaceDomain}/${slug}.ri${autoId}`;
};

const MessageHistory = ({ conversationId, conversation, countryCode, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const scrollRef = useRef(null);
  const pageSize = 20;

  const fetchMessages = useCallback(async (page = 1) => {
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
  }, [conversationId, countryCode]);

  useEffect(() => {
    setMessages([]);
    setPageNumber(1);
    setHasMore(true);
    fetchMessages(1);
  }, [fetchMessages]);

  // Lock body scroll when modal is open
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = original; };
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const loadMore = () => {
    const nextPage = pageNumber + 1;
    setPageNumber(nextPage);
    fetchMessages(nextPage);
  };

  const mapMetaTypeByCategory = (code) => {
    if(code === "CTG10000000001") return "Class";
    if(code === "CTG10000000002") return "Service";
    if(code === "CTG10000000003") return "Item";
    return "Undefined";
  };

  const senderName = (s) =>
    `${s.firstName ?? ""}${s.middleName ?? ""}${s.lastName ?? ""}` || s.email;

  const modal = (
    <div
      className="fixed inset-0 z-[9990] flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Modal panel */}
      <div
        className="relative z-10 bg-white rounded-xl shadow-2xl flex flex-col
          w-full h-[95dvh] sm:h-[90dvh] sm:rounded-2xl max-w-[95vw] lg:max-w-[85vw] xl:max-w-[80vw]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800 truncate">
              {senderName(conversation.sender)} → {senderName(conversation.receiver)}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {messages.length} message{messages.length !== 1 ? "s" : ""} loaded
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-3 p-2 rounded-full hover:bg-gray-100 transition-colors shrink-0"
            title="Close"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Scrollable message area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 sm:px-5 py-3 scroll-smooth">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
              Loading messages...
            </div>
          )}
          {messages.map((msg) => {
            var sender =
              conversation.sender?.userId === msg.sender?.userId
                ? conversation.sender
                : conversation.receiver;

            return (
              <div key={msg.messageId} className="mb-3 pb-3 border-b border-gray-100 last:border-b-0">
                <div>
                  <p>
                    <b className="text-gray-900">
                      <span>{senderName(sender)}</span>
                      {"  "}
                      <span className="text-xs text-gray-400 font-normal">
                        {new Date(msg.sentTS).toLocaleString()}
                      </span>
                    </b>
                    {msg.message && <CopyableField value={msg.message} />}
                  </p>

                  <span className="text-gray-800">
                    {!msg.message && (
                      (
                        <div className="border border-gray-200 rounded-lg p-3 mt-2">
                          {msg.orderInfo ? (
                            <>
                              <CopyableField value={msg.orderInfo.orderNo} label="Order No" />{" "}
                              <a href={buildProductHref(msg.orderInfo.productInfo.slug, msg.orderInfo.productInfo.parentCategoryCode)}
                                target="_blank" rel="noopener noreferrer"
                                className="text-blue-600 underline hover:text-blue-800">
                                [{mapMetaTypeByCategory(msg.orderInfo.productInfo.parentCategoryCode)}] {msg.orderInfo.productInfo.name}
                              </a>{" "}
                              <CopyableField value={msg.orderInfo.productInfo.productId} label="Product Id" />{" "}
                              {msg.orderInfo.productInfo.images && msg.orderInfo.productInfo.images.length > 0 && (
                                <div className="mt-1">
                                  {msg.orderInfo.productInfo.images
                                    .sort((a, b) => a.displayOrder - b.displayOrder)
                                    .map((img) => (
                                      <span key={img.id} className="inline-block mr-2">
                                        <PreviewableImage url={img.url} alt={img.title || "Product image"}
                                          className="w-20 h-20 object-cover rounded-lg border border-gray-300 hover:opacity-80 transition"
                                          gallery={msg.orderInfo.productInfo.images
                                            .sort((a, b) => a.displayOrder - b.displayOrder)
                                            .map((i) => ({ url: i.url, title: i.title }))} />
                                      </span>
                                    ))}
                                </div>
                              )}
                            </>
                          ) : msg.productInfo ? (
                            <>
                              <a href={buildProductHref(msg.productInfo.slug, msg.productInfo.parentCategoryCode)}
                                target="_blank" rel="noopener noreferrer"
                                className="text-blue-600 underline hover:text-blue-800">
                                [{mapMetaTypeByCategory(msg.productInfo.parentCategoryCode)}] {msg.productInfo.name}
                              </a>
                              <CopyableField value={msg.productInfo.productId} label="Product Id" />
                              {msg.productInfo.images && msg.productInfo.images.length > 0 && (
                                <div className="mt-1">
                                  {msg.productInfo.images
                                    .sort((a, b) => a.displayOrder - b.displayOrder)
                                    .map((img) => (
                                      <span key={img.id} className="inline-block mr-2">
                                        <PreviewableImage url={img.url} alt={img.title || "Product image"}
                                          className="w-20 h-20 object-cover rounded-lg border border-gray-300 hover:opacity-80 transition"
                                          gallery={msg.productInfo.images
                                            .sort((a, b) => a.displayOrder - b.displayOrder)
                                            .map((i) => ({ url: i.url, title: i.title }))} />
                                      </span>
                                    ))}
                                </div>
                              )}
                            </>
                          ) : msg.jobInfo ? (
                            <>
                              <a href={`${getCountryConfig().marketplaceDomain}/jobGo/${msg.jobInfo.jobId}`}
                                target="_blank" rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-blue-600 underline hover:text-blue-800">
                                {msg.jobInfo.title}
                              </a>
                              <CopyableField value={msg.jobInfo.jobId} label="Job Id" />
                              {msg.jobInfo.companyName && (
                                <div className="text-sm text-gray-600">
                                  <span className="font-medium mr-2">Company:</span>
                                  {msg.jobInfo.companyName}
                                </div>
                              )}
                              <div className="text-sm text-gray-600">
                                {msg.jobInfo.employmentType && (
                                  <span className="mr-3">
                                    <span className="font-medium mr-1">Type:</span>
                                    {msg.jobInfo.employmentType}
                                  </span>
                                )}
                                {msg.jobInfo.status && (
                                  <span>
                                    <span className="font-medium mr-1">Status:</span>
                                    <b style={{ color: msg.jobInfo.status === "open" ? "green" : "orange" }}>
                                      {msg.jobInfo.status}
                                    </b>
                                  </span>
                                )}
                              </div>
                              {msg.jobInfo.images && msg.jobInfo.images.length > 0 && (
                                <div className="mt-1">
                                  {msg.jobInfo.images
                                    .sort((a, b) => a.displayOrder - b.displayOrder)
                                    .map((img) => (
                                      <span key={img.id} className="inline-block mr-2">
                                        <PreviewableImage url={img.url} alt={img.title || "Job image"}
                                          className="w-20 h-20 object-cover rounded-lg border border-gray-300 hover:opacity-80 transition"
                                          gallery={msg.jobInfo.images
                                            .sort((a, b) => a.displayOrder - b.displayOrder)
                                            .map((i) => ({ url: i.url, title: i.title }))} />
                                      </span>
                                    ))}
                                </div>
                              )}
                            </>
                          ) : msg.restaurantInfo ? (
                            <>
                              <a href={buildRestaurantHref(msg.restaurantInfo.title, msg.restaurantInfo.autoId)}
                                target="_blank" rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-blue-600 underline hover:text-blue-800">
                                {msg.restaurantInfo.title}
                              </a>
                              <CopyableField value={msg.restaurantInfo.restaurantId} label="Restaurant Id" />
                              {msg.restaurantInfo.status && (
                                <div className="text-sm text-gray-600">
                                  <span className="font-medium mr-1">Status:</span>
                                  <b style={{ color: msg.restaurantInfo.status === "published" ? "green" : "orange" }}>
                                    {msg.restaurantInfo.status}
                                  </b>
                                </div>
                              )}
                              {msg.restaurantInfo.categories && msg.restaurantInfo.categories.length > 0 && (
                                <div className="text-sm text-gray-600">
                                  <span className="font-medium mr-1">Categories:</span>
                                  {msg.restaurantInfo.categories.map((c) => c.name).join(", ")}
                                </div>
                              )}
                              {msg.restaurantInfo.images && msg.restaurantInfo.images.length > 0 && (
                                <div className="mt-1">
                                  {msg.restaurantInfo.images
                                    .sort((a, b) => a.displayOrder - b.displayOrder)
                                    .map((img) => (
                                      <span key={img.id} className="inline-block mr-2">
                                        <PreviewableImage url={img.url} alt={img.title || "Restaurant image"}
                                          className="w-20 h-20 object-cover rounded-lg border border-gray-300 hover:opacity-80 transition"
                                          gallery={msg.restaurantInfo.images
                                            .sort((a, b) => a.displayOrder - b.displayOrder)
                                            .map((i) => ({ url: i.url, title: i.title }))} />
                                      </span>
                                    ))}
                                </div>
                              )}
                            </>
                          ) : msg.attachments ? (
                            <>
                              {msg.attachments
                                .sort((a, b) => a.displayOrder - b.displayOrder)
                                .map((att, idx) => {
                                  const isImage = /\.(jpe?g|png|gif|bmp|webp|svg|tiff?|heic)$/i.test(att.url);
                                  const imageGallery = msg.attachments
                                    .filter((a) => /\.(jpe?g|png|gif|bmp|webp|svg|tiff?|heic)$/i.test(a.url))
                                    .sort((a, b) => a.displayOrder - b.displayOrder)
                                    .map((a) => ({ url: a.url, title: a.displayName }));
                                  return (
                                    <span key={att.id} className="mr-2 inline-block">
                                      {isImage ? (
                                        <PreviewableImage url={att.url}
                                          alt={att.displayName || `Attachment ${idx + 1}`}
                                          className="w-20 h-20 object-cover rounded-lg border border-gray-300 hover:opacity-80 transition"
                                          gallery={imageGallery.length > 1 ? imageGallery : undefined} />
                                      ) : (
                                        <PreviewableFile url={att.url}
                                          displayName={att.displayName || `Attachment ${idx + 1}`} />
                                      )}
                                    </span>
                                  );
                                })}
                            </>
                          ) : (
                            "[No content]"
                          )}
                        </div>
                      ) || "[No content]"
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 shrink-0 bg-gray-50 rounded-b-xl sm:rounded-b-2xl">
          <div>
            {hasMore ? (
              <button onClick={loadMore}
                className="text-blue-600 hover:underline text-sm font-medium">
                Load more ↓
              </button>
            ) : (
              <span className="text-sm text-gray-400">No more messages</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
};

export default MessageHistory;
