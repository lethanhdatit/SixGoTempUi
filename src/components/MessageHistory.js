import React, { useEffect, useState, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import InfiniteScroll from "react-infinite-scroll-component";
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

const MessageHistory = ({ conversationId, conversation, countryCode, onClose, autoScroll = false }) => {
  const [messages, setMessages] = useState([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);
  const isFetchingRef = useRef(false);
  const pageSize = 20;

  const fetchMessages = useCallback(async (page = 1) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsLoading(true);
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
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
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

  const renderImageGallery = (images, altPrefix) => {
    if (!images || images.length === 0) return null;
    const sorted = [...images].sort((a, b) => a.displayOrder - b.displayOrder);
    const gallery = sorted.map((i) => ({ url: i.url, title: i.title }));
    return (
      <div className="mt-1">
        {sorted.map((img) => (
          <span key={img.id} className="inline-block mr-2">
            <PreviewableImage url={img.url} alt={img.title || `${altPrefix} image`}
              className="w-20 h-20 object-cover rounded-lg border border-gray-300 hover:opacity-80 transition"
              gallery={gallery} />
          </span>
        ))}
      </div>
    );
  };

  const renderLink = (href, label, extra) => (
    <a href={href} target="_blank" rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="text-blue-600 underline hover:text-blue-800">
      {label}
    </a>
  );

  const renderProductBlock = (productInfo, orderNo) => {
    if (!productInfo) return "[No content]";
    return (
    <>
      {orderNo && <><CopyableField value={orderNo} label="Order No" />{" "}</>}
      {renderLink(
        buildProductHref(productInfo.slug, productInfo.parentCategoryCode),
        <>[{mapMetaTypeByCategory(productInfo.parentCategoryCode)}] {productInfo.name}</>
      )}{" "}
      <CopyableField value={productInfo.productId} label="Product Id" />
      {renderImageGallery(productInfo.images, "Product")}
    </>
  )
  };

  const renderJobBlock = (jobInfo) => (
    <>
      {renderLink(
        `${getCountryConfig().marketplaceDomain}/jobGo/${jobInfo.jobId}`,
        jobInfo.title
      )}
      <CopyableField value={jobInfo.jobId} label="Job Id" />
      {jobInfo.companyName && (
        <div className="text-sm text-gray-600">
          <span className="font-medium mr-2">Company:</span>
          {jobInfo.companyName}
        </div>
      )}
      <div className="text-sm text-gray-600">
        {jobInfo.employmentType && (
          <span className="mr-3">
            <span className="font-medium mr-1">Type:</span>
            {jobInfo.employmentType}
          </span>
        )}
        {jobInfo.status && (
          <span>
            <span className="font-medium mr-1">Status:</span>
            <b style={{ color: jobInfo.status === "open" ? "green" : "orange" }}>
              {jobInfo.status}
            </b>
          </span>
        )}
      </div>
      {renderImageGallery(jobInfo.images, "Job")}
    </>
  );

  const renderRestaurantBlock = (info) => (
    <>
      {renderLink(
        buildRestaurantHref(info.title, info.autoId),
        info.title
      )}
      <CopyableField value={info.restaurantId} label="Restaurant Id" />
      {info.status && (
        <div className="text-sm text-gray-600">
          <span className="font-medium mr-1">Status:</span>
          <b style={{ color: info.status === "published" ? "green" : "orange" }}>
            {info.status}
          </b>
        </div>
      )}
      {info.categories && info.categories.length > 0 && (
        <div className="text-sm text-gray-600">
          <span className="font-medium mr-1">Categories:</span>
          {info.categories.map((c) => c.name).join(", ")}
        </div>
      )}
      {renderImageGallery(info.images, "Restaurant")}
    </>
  );

  const renderAttachments = (attachments) => {
    const sorted = [...attachments].sort((a, b) => a.displayOrder - b.displayOrder);
    const imageGallery = sorted
      .filter((a) => /\.(jpe?g|png|gif|bmp|webp|svg|tiff?|heic)$/i.test(a.url))
      .map((a) => ({ url: a.url, title: a.displayName }));
    return sorted.map((att, idx) => {
      const isImage = /\.(jpe?g|png|gif|bmp|webp|svg|tiff?|heic)$/i.test(att.url);
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
    });
  };

  const renderMessageContent = (msg) => {
    if (msg.orderInfo) return renderProductBlock(msg.orderInfo.productInfo, msg.orderInfo.orderNo);
    if (msg.productInfo) return renderProductBlock(msg.productInfo);
    if (msg.jobInfo) return renderJobBlock(msg.jobInfo);
    if (msg.restaurantInfo) return renderRestaurantBlock(msg.restaurantInfo);
    if (msg.attachments) return renderAttachments(msg.attachments);
    return "[No content]";
  };

  const renderMessage = (msg, sender) => (
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
        {!msg.message && (
          <span className="text-gray-800">
            <div className="border border-gray-200 rounded-lg p-3 mt-2">
              {renderMessageContent(msg)}
            </div>
          </span>
        )}
      </div>
    </div>
  );

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
        <div id="message-scroll-container" ref={scrollRef} className="flex-1 overflow-y-auto px-3 sm:px-5 py-3 scroll-smooth">
          {messages.length === 0 && isLoading && (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
              Loading...
            </div>
          )}
          {autoScroll ? (
            <InfiniteScroll
              dataLength={messages.length}
              next={loadMore}
              hasMore={hasMore}
              loader={messages.length > 0 && <p className="text-center text-gray-400 text-sm py-2">Loading...</p>}
              // endMessage={!isLoading && pageNumber > 1 && messages.length > 0 && <p className="text-center text-gray-400 text-sm py-2">No more messages</p>}
              scrollableTarget="message-scroll-container"
            >
              {messages.map((msg) => {
                var sender =
                  conversation.sender?.userId === msg.sender?.userId
                    ? conversation.sender
                    : conversation.receiver;
                return renderMessage(msg, sender);
              })}
            </InfiniteScroll>
          ) : (
            <>
              {messages.map((msg) => {
                var sender =
                  conversation.sender?.userId === msg.sender?.userId
                    ? conversation.sender
                    : conversation.receiver;
                return renderMessage(msg, sender);
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0 bg-gray-50 rounded-b-xl sm:rounded-b-2xl">
          <div>
            {!autoScroll && (
              hasMore ? (
                <button onClick={loadMore}
                  className="text-blue-600 hover:underline text-sm font-medium">
                  Load more ↓
                </button>
              ) : (
                !isLoading && pageNumber > 1 && <span className="text-sm text-gray-400">No more messages</span>
              )
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
