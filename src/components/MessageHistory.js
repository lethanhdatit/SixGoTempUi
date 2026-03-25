import React, { useEffect, useState, useRef } from "react";
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

const MessageHistory = ({ conversationId, conversation, countryCode, toggleMessages }) => {
  const [messages, setMessages] = useState([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const containerRef = useRef(null);
  const pageSize = 20;

  const scrollToTop = () => {
    containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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

  const mapMetaTypeByCategory = (code) => {
    if(code === "CTG10000000001") return "Class";
    if(code === "CTG10000000002") return "Service";
    if(code === "CTG10000000003") return "Item";
    return "Undefined";
  };

  return (
    <div ref={containerRef} className="bg-gray-100 p-2 sm:p-4 mt-3 rounded-md shadow-inner overflow-hidden">
      <div className="max-h-[50vh] sm:max-h-[55vh] md:max-h-[60vh] lg:max-h-[65vh] overflow-y-auto scroll-smooth pr-1">
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
            <div>
              <p>
                <b className="text-black-1000">
                  <span>
                    {`${sender.firstName ?? ""}${sender.middleName ?? ""}${sender.lastName ?? ""
                      }` || sender.email}
                  </span>
                  {"  "}
                  <span className="text-xs text-gray-400">
                    <i>
                      <b>{new Date(msg.sentTS).toLocaleString()}</b>
                    </i>
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
                          <CopyableField
                            value={msg.orderInfo.orderNo}
                            label="Order No"
                          />{" "}
                          <a
                            href={buildProductHref(
                              msg.orderInfo.productInfo.slug,
                              msg.orderInfo.productInfo.parentCategoryCode
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline hover:text-blue-800"
                          >
                            [{mapMetaTypeByCategory(msg.orderInfo.productInfo.parentCategoryCode)}] {msg.orderInfo.productInfo.name}
                          </a>{" "}
                          <CopyableField
                            value={msg.orderInfo.productInfo.productId}
                            label="Product Id"
                          />{" "}
                          {msg.orderInfo.productInfo.images && msg.orderInfo.productInfo.images.length > 0 && (
                            <div className="mt-1">
                              {msg.orderInfo.productInfo.images
                                .sort((a, b) => a.displayOrder - b.displayOrder)
                                .map((img) => (
                                  <span key={img.id} className="inline-block mr-2">
                                    <PreviewableImage
                                      url={img.url}
                                      alt={img.title || "Product image"}
                                      className="w-20 h-20 object-cover rounded-lg border border-gray-300 hover:opacity-80 transition"
                                      gallery={msg.orderInfo.productInfo.images
                                        .sort((a, b) => a.displayOrder - b.displayOrder)
                                        .map((i) => ({ url: i.url, title: i.title }))}
                                    />
                                  </span>
                                ))}
                            </div>
                          )}
                        </>
                      ) : msg.productInfo ? (
                        <>
                          <a
                            href={buildProductHref(
                              msg.productInfo.slug,
                              msg.productInfo.parentCategoryCode
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline hover:text-blue-800"
                          >
                            [{mapMetaTypeByCategory(msg.productInfo.parentCategoryCode)}] {msg.productInfo.name}
                          </a>
                          <CopyableField
                            value={msg.productInfo.productId}
                            label="Product Id"
                          />
                          {msg.productInfo.images && msg.productInfo.images.length > 0 && (
                            <div className="mt-1">
                              {msg.productInfo.images
                                .sort((a, b) => a.displayOrder - b.displayOrder)
                                .map((img) => (
                                  <span key={img.id} className="inline-block mr-2">
                                    <PreviewableImage
                                      url={img.url}
                                      alt={img.title || "Product image"}
                                      className="w-20 h-20 object-cover rounded-lg border border-gray-300 hover:opacity-80 transition"
                                      gallery={msg.productInfo.images
                                        .sort((a, b) => a.displayOrder - b.displayOrder)
                                        .map((i) => ({ url: i.url, title: i.title }))}
                                    />
                                  </span>
                                ))}
                            </div>
                          )}
                        </>
                      ) : msg.jobInfo ? (
                        <>
                          <a
                            href={`${getCountryConfig().marketplaceDomain}/jobGo/${msg.jobInfo.jobId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-600 underline hover:text-blue-800"
                          >
                            {msg.jobInfo.title}
                          </a>
                          <CopyableField
                            value={msg.jobInfo.jobId}
                            label="Job Id"
                          />
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
                                    <PreviewableImage
                                      url={img.url}
                                      alt={img.title || "Job image"}
                                      className="w-20 h-20 object-cover rounded-lg border border-gray-300 hover:opacity-80 transition"
                                      gallery={msg.jobInfo.images
                                        .sort((a, b) => a.displayOrder - b.displayOrder)
                                        .map((i) => ({ url: i.url, title: i.title }))}
                                    />
                                  </span>
                                ))}
                            </div>
                          )}
                        </>
                      ) : msg.restaurantInfo ? (
                        <>
                          <a
                            href={buildRestaurantHref(msg.restaurantInfo.title, msg.restaurantInfo.autoId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-600 underline hover:text-blue-800"
                          >
                            {msg.restaurantInfo.title}
                          </a>
                          <CopyableField
                            value={msg.restaurantInfo.restaurantId}
                            label="Restaurant Id"
                          />
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
                                    <PreviewableImage
                                      url={img.url}
                                      alt={img.title || "Restaurant image"}
                                      className="w-20 h-20 object-cover rounded-lg border border-gray-300 hover:opacity-80 transition"
                                      gallery={msg.restaurantInfo.images
                                        .sort((a, b) => a.displayOrder - b.displayOrder)
                                        .map((i) => ({ url: i.url, title: i.title }))}
                                    />
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
                              const isImage =
                                /\.(jpe?g|png|gif|bmp|webp|svg|tiff?|heic)$/i.test(
                                  att.url
                                );
                              const imageGallery = msg.attachments
                                .filter((a) => /\.(jpe?g|png|gif|bmp|webp|svg|tiff?|heic)$/i.test(a.url))
                                .sort((a, b) => a.displayOrder - b.displayOrder)
                                .map((a) => ({ url: a.url, title: a.displayName }));
                              return (
                                <span
                                  key={att.id}
                                  className="mr-2 inline-block"
                                >
                                  {isImage ? (
                                    <PreviewableImage
                                      url={att.url}
                                      alt={
                                        att.displayName ||
                                        `Attachment ${idx + 1}`
                                      }
                                      className="w-20 h-20 object-cover rounded-lg border border-gray-300 hover:opacity-80 transition"
                                      gallery={imageGallery.length > 1 ? imageGallery : undefined}
                                    />
                                  ) : (
                                    <PreviewableFile
                                      url={att.url}
                                      displayName={
                                        att.displayName ||
                                        `Attachment ${idx + 1}`
                                      }
                                    />
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

            {/* <br></br> */}
          </div>
        );
      })}
      </div>
      <div className="flex items-center mt-2 sticky bottom-0 bg-gray-100 pt-1">
        <div>
          {hasMore ? (
            <button
              onClick={loadMore}
              className="default text-blue-600 hover:underline text-sm font-medium"
            >
              Load more ↓ { " " }
            </button>
          ) : (
            <p className="text-sm text-gray-400">No more messages</p>
          )}
        </div>
        {messages.length > 3 && (
          <div className="flex ml-2 items-center gap-4 text-sm text-gray-500">
             <button
            onClick={toggleMessages}
            className="text-sm text-blue-600 hover:underline flex items-center gap-1 ml-auto"
            title="Scroll to top"
          >
            { " " } Collapse ↑
          </button>
          </div>
         
        )}
      </div>
    </div>
  );
};

export default MessageHistory;
